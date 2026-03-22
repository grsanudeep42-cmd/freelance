import type { Request, Response } from "express";
import { z } from "zod";
import { BidStatus, JobStatus, UserRole } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

type AuthedUser = { id: string; role: UserRole };

class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getAuthedUser(req: Request): AuthedUser {
  const user = req.user;
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  return { id: user.id, role: user.role as unknown as UserRole };
}

const applyBidSchema = z.object({
  jobId: z.string().uuid(),
  amount: z.coerce.number().finite(),
  coverLetter: z.string().min(10),
  creditsSpent: z.coerce.number().int().positive()
});

const acceptBidParamsSchema = z.object({
  bidId: z.string().uuid()
});

const jobIdParamsSchema = z.object({
  jobId: z.string().uuid()
});

export async function applyBid(req: Request, res: Response): Promise<void> {
  try {
    const authed = getAuthedUser(req);
    if (authed.role !== UserRole.FREELANCER) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    const body = applyBidSchema.parse(req.body);

    const created = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: body.jobId },
        select: { id: true, status: true, clientId: true }
      });

      if (!job) {
        throw new HttpError(404, "JOB_NOT_FOUND", "Job not found");
      }

      if (job.status !== JobStatus.OPEN) {
        throw new HttpError(400, "JOB_NOT_OPEN", "Job is not open for bidding");
      }

      if (job.clientId === authed.id) {
        throw new HttpError(403, "FORBIDDEN", "Cannot bid on your own job");
      }

      const existingBid = await tx.bid.findFirst({
        where: {
          jobId: body.jobId,
          freelancerId: authed.id
        },
        select: { id: true }
      });

      if (existingBid) {
        throw new HttpError(400, "ALREADY_BIDDED", "You have already placed a bid on this job");
      }

      // Deduct credits first to ensure we don't create a bid without the debit.
      const creditUpdate = await tx.user.updateMany({
        where: {
          id: authed.id,
          creditBalance: { gte: body.creditsSpent }
        },
        data: {
          creditBalance: { decrement: body.creditsSpent }
        }
      });

      if (creditUpdate.count !== 1) {
        throw new HttpError(400, "INSUFFICIENT_CREDITS", "Insufficient credits");
      }

      const bid = await tx.bid.create({
        data: {
          jobId: body.jobId,
          freelancerId: authed.id,
          amount: body.amount,
          coverLetter: body.coverLetter,
          status: BidStatus.PENDING,
          creditsSpent: body.creditsSpent
        }
      });

      return bid;
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    if (err instanceof HttpError) {
      res
        .status(err.statusCode)
        .json({ ok: false, error: { message: err.message, code: err.code } });
      return;
    }

    logger.error("applyBid failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getBidsForJob(req: Request, res: Response): Promise<void> {
  try {
    const authed = getAuthedUser(req);
    const params = jobIdParamsSchema.parse(req.params);

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: { id: true, clientId: true }
    });

    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    if (job.clientId !== authed.id) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    const bids = await prisma.bid.findMany({
      where: { jobId: params.jobId },
      orderBy: { createdAt: "desc" },
      include: {
        freelancer: {
          select: { id: true, fullName: true, avatarUrl: true }
        }
      }
    });

    res.status(200).json({ ok: true, data: bids });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("getBidsForJob failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function acceptBid(req: Request, res: Response): Promise<void> {
  try {
    const authed = getAuthedUser(req);
    const params = acceptBidParamsSchema.parse(req.params);

    const updatedBid = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { id: params.bidId },
        include: {
          job: { select: { id: true, clientId: true, status: true } }
        }
      });

      if (!bid) {
        throw new HttpError(404, "BID_NOT_FOUND", "Bid not found");
      }

      if (bid.job.clientId !== authed.id) {
        throw new HttpError(403, "FORBIDDEN", "Only the job owner can accept a bid");
      }

      if (bid.status !== BidStatus.PENDING) {
        throw new HttpError(400, "BID_NOT_PENDING", "Bid is not pending");
      }

      if (bid.job.status !== JobStatus.OPEN) {
        throw new HttpError(400, "JOB_NOT_OPEN", "Job is not open");
      }

      const accepted = await tx.bid.update({
        where: { id: bid.id },
        data: { status: BidStatus.ACCEPTED }
      });

      await tx.job.update({
        where: { id: bid.job.id },
        data: {
          status: JobStatus.IN_PROGRESS,
          assignedFreelancerId: bid.freelancerId
        }
      });

      await tx.bid.updateMany({
        where: {
          jobId: bid.job.id,
          id: { not: bid.id }
        },
        data: { status: BidStatus.REJECTED }
      });

      return accepted;
    });

    res.status(200).json({ ok: true, data: updatedBid });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    if (err instanceof HttpError) {
      res
        .status(err.statusCode)
        .json({ ok: false, error: { message: err.message, code: err.code } });
      return;
    }

    logger.error("acceptBid failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getMyBids(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const bids = await prisma.bid.findMany({
      where: { freelancerId: userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, data: bids });
  } catch (err) {
    res.status(500).json({ ok: false, error: { message: "Failed to fetch bids" } });
  }
}
