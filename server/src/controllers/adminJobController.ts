import type { Request, Response } from "express";
import { z } from "zod";
import { AdminJobStatus, JobStatus, JobType, UserRole } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

class HttpError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function requireAuthed(req: Request): { id: string; role: UserRole } {
  const user = req.user;
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
  return { id: user.id, role: user.role as unknown as UserRole };
}

const claimSchema = z.object({
  jobId: z.string().uuid()
});

export async function claimAdminJob(req: Request, res: Response): Promise<void> {
  try {
    const authed = requireAuthed(req);

    if (authed.role !== UserRole.FREELANCER) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    const body = claimSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      select: {
        id: true,
        type: true,
        status: true,
        assignedFreelancerId: true,
        clientId: true,
        creditReward: true
      }
    });

    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    if (job.type !== JobType.ADMIN) {
      res.status(400).json({ ok: false, error: { message: "Invalid job type", code: "BAD_REQUEST" } });
      return;
    }

    if (job.status !== JobStatus.OPEN) {
      res.status(400).json({ ok: false, error: { message: "Job is not open", code: "BAD_REQUEST" } });
      return;
    }

    const updated = await prisma.job.update({
      where: { id: body.jobId },
      data: {
        status: JobStatus.IN_PROGRESS,
        assignedFreelancerId: authed.id
      }
    });

    res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ ok: false, error: { message: err.message, code: err.code } });
      return;
    }

    logger.error("claimAdminJob failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

const submitSchema = z.object({
  jobId: z.string().uuid(),
  submission: z.string().min(5)
});

export async function submitAdminWork(req: Request, res: Response): Promise<void> {
  try {
    const authed = requireAuthed(req);

    const body = submitSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      select: { id: true, status: true, assignedFreelancerId: true }
    });

    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    if (!job.assignedFreelancerId || job.assignedFreelancerId !== authed.id) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    // Store submission if the AdminJob row exists (optional).
    await prisma.adminJob.updateMany({
      where: { jobId: body.jobId },
      data: { submissionUrl: body.submission, status: AdminJobStatus.SUBMITTED }
    });

    const updated = await prisma.job.update({
      where: { id: body.jobId },
      data: { status: JobStatus.COMPLETED }
    });

    res.status(200).json({ ok: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ ok: false, error: { message: err.message, code: err.code } });
      return;
    }

    logger.error("submitAdminWork failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

const approveSchema = z.object({
  jobId: z.string().uuid()
});

export async function approveAdminJob(req: Request, res: Response): Promise<void> {
  try {
    const authed = requireAuthed(req);

    if (authed.role !== UserRole.ADMIN) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    const body = approveSchema.parse(req.body);

    const job = await prisma.job.findUnique({
      where: { id: body.jobId },
      select: { id: true, creditReward: true, assignedFreelancerId: true }
    });

    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    if (!job.creditReward) {
      res.status(400).json({
        ok: false,
        error: { message: "creditReward is required for approval", code: "BAD_REQUEST" }
      });
      return;
    }

    if (!job.assignedFreelancerId) {
      res.status(400).json({
        ok: false,
        error: { message: "assignedFreelancerId is required for approval", code: "BAD_REQUEST" }
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { id: job.assignedFreelancerId! },
        data: { creditBalance: { increment: job.creditReward ?? 0 } }
      });

      await tx.job.update({
        where: { id: job.id },
        data: { status: JobStatus.COMPLETED }
      });

      await tx.adminJob.updateMany({
        where: { jobId: job.id },
        data: { status: AdminJobStatus.APPROVED }
      });
    });

    res.status(200).json({ ok: true, data: { message: "Admin job approved" } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({ ok: false, error: { message: err.message, code: err.code } });
      return;
    }

    logger.error("approveAdminJob failed", { message: err instanceof Error ? err.message : String(err) });
    res
      .status(500)
      .json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

