import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/postgres";
import { paymentService } from "../services/paymentService";
import { logger } from "../utils/logger";
import { EscrowStatus, JobStatus, UserRole, TransactionType, BidStatus, JobType } from "../generated/prisma";
import { env } from "../config/env";

export async function initiatePayment(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user || user.role !== UserRole.CUSTOMER) {
    res.status(403).json({ ok: false, error: { message: "Only clients can initiate payments", code: "FORBIDDEN" } });
    return;
  }

  try {
    const { bidId } = z.object({ bidId: z.string().uuid() }).parse(req.body);

    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { job: true }
    });

    if (!bid) {
      res.status(404).json({ ok: false, error: { message: "Bid not found", code: "NOT_FOUND" } });
      return;
    }

    if (bid.status !== BidStatus.ACCEPTED) {
      res.status(400).json({ ok: false, error: { message: "Can only pay for accepted bids", code: "BAD_REQUEST" } });
      return;
    }

    const { job } = bid;

    if (job.clientId !== user.id) {
      res.status(403).json({ ok: false, error: { message: "Not your job", code: "FORBIDDEN" } });
      return;
    }

    if (job.status !== JobStatus.IN_PROGRESS || job.type !== JobType.BID) {
      res.status(400).json({ ok: false, error: { message: "Invalid job state for payment", code: "BAD_REQUEST" } });
      return;
    }

    const existingEscrow = await prisma.escrow.findUnique({ where: { jobId: job.id } });
    if (existingEscrow && existingEscrow.status === EscrowStatus.HELD) {
      res.status(400).json({ ok: false, error: { message: "Escrow already exists and is HELD", code: "BAD_REQUEST" } });
      return;
    }

    const amount = bid.amount;
    const platformFee = Math.round(amount * env.PLATFORM_FEE_PERCENT) / 100;
    const netAmount = amount - platformFee;

    const paymentOrder = await paymentService.createOrder(amount, "INR", job.id);

    const { escrowId } = await prisma.$transaction(async (tx) => {
      const escrow = await tx.escrow.create({
        data: {
          jobId: job.id,
          clientId: user.id,
          freelancerId: bid.freelancerId,
          amount,
          platformFee,
          netAmount,
          status: EscrowStatus.HELD,
        }
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.CREDIT_SPENT,
          amount,
          description: `Escrow payment for job: ${job.title}`,
          referenceId: paymentOrder.orderId
        }
      });

      return { escrowId: escrow.id };
    });

    res.status(200).json({
      ok: true,
      data: {
        orderId: paymentOrder.orderId,
        amount,
        currency: paymentOrder.currency,
        escrowId,
        isMock: paymentOrder.isMock,
        jobTitle: job.title
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("initiatePayment failed", { error: err.message });
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function releasePayment(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user || user.role !== UserRole.CUSTOMER) {
    res.status(403).json({ ok: false, error: { message: "Only clients can release payments", code: "FORBIDDEN" } });
    return;
  }

  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.body);

    const escrow = await prisma.escrow.findUnique({
      where: { jobId },
      include: { job: true }
    });

    if (!escrow) {
      res.status(404).json({ ok: false, error: { message: "Escrow not found", code: "NOT_FOUND" } });
      return;
    }

    if (escrow.clientId !== user.id) {
      res.status(403).json({ ok: false, error: { message: "Not your escrow", code: "FORBIDDEN" } });
      return;
    }

    if (escrow.status !== EscrowStatus.HELD) {
      res.status(400).json({ ok: false, error: { message: "Escrow is not HELD", code: "BAD_REQUEST" } });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: EscrowStatus.RELEASED }
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.COMPLETED }
      });

      await tx.user.update({
        where: { id: escrow.freelancerId },
        data: { creditBalance: { increment: escrow.netAmount } }
      });

      await tx.transaction.create({
        data: {
          userId: escrow.freelancerId,
          type: TransactionType.PAYOUT,
          amount: escrow.netAmount,
          description: `Payment received for: ${escrow.job.title}`
        }
      });

      const admin = await tx.user.findFirst({ where: { role: UserRole.ADMIN } });
      if (admin) {
        await tx.transaction.create({
          data: {
            userId: admin.id,
            type: TransactionType.PLATFORM_FEE,
            amount: escrow.platformFee,
            description: `Platform fee for: ${escrow.job.title}`
          }
        });
      }
    });

    res.status(200).json({
      ok: true,
      data: {
        released: true,
        netAmount: escrow.netAmount,
        platformFee: escrow.platformFee
      }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("releasePayment failed", { error: err.message });
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getEscrow(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return;
  }

  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);

    const escrow = await prisma.escrow.findUnique({
      where: { jobId }
    });

    if (escrow && escrow.clientId !== user.id && escrow.freelancerId !== user.id && user.role !== UserRole.ADMIN) {
      res.status(403).json({ ok: false, error: { message: "Access denied to this escrow", code: "FORBIDDEN" } });
      return;
    }

    res.status(200).json({ ok: true, data: escrow || null });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getMyTransactions(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return;
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    res.status(200).json({ ok: true, data: transactions });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}
