import type { Request, Response } from "express";
import { z } from "zod";
import { JobStatus, JobType, UserRole } from "../generated/prisma";
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

const createJobSchema = z
  .object({
    title: z.string().min(5),
    description: z.string().min(10),
    type: z.nativeEnum(JobType),
    budget: z.coerce.number().optional(),
    deadlineAt: z.coerce.date().optional(),
    creditReward: z.coerce.number().int().optional()
  })
  .superRefine((val, ctx) => {
    if (val.type === JobType.ADMIN) {
      if (val.creditReward === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["creditReward"],
          message: "creditReward must be provided for ADMIN jobs"
        });
      }
    }
  });

function requireAuthenticatedUser(req: Request): { id: string; role: UserRole } | null {
  const user = req.user;
  if (!user) return null;
  return { id: user.id, role: user.role as unknown as UserRole };
}

export async function createJob(req: Request, res: Response): Promise<void> {
  const authed = requireAuthenticatedUser(req);
  if (!authed) {
    res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return;
  }

  try {
    const body = createJobSchema.parse(req.body);
    const requesterRole = authed.role;

    if (requesterRole !== UserRole.CUSTOMER && requesterRole !== UserRole.ADMIN) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    if (body.type === JobType.ADMIN && requesterRole !== UserRole.ADMIN) {
      // Prevent non-admin users from creating ADMIN jobs.
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    const created = await prisma.job.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        status: JobStatus.OPEN,
        budget: body.budget,
        deadlineAt: body.deadlineAt,
        clientId: authed.id,
        adminId: body.type === JobType.ADMIN ? authed.id : undefined,
        creditReward: body.type === JobType.ADMIN ? body.creditReward : undefined
      }
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("createJob failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getJobs(_req: Request, res: Response): Promise<void> {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      include: {
        client: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ ok: true, data: jobs });
  } catch (err) {
    logger.error("getJobs failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getJobById(req: Request, res: Response): Promise<void> {
  const id = z.string().uuid().parse(req.params.id);

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, fullName: true }
        },
        _count: {
          select: { bids: true }
        }
      }
    });

    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    res.status(200).json({ ok: true, data: { job, bidsCount: job._count.bids } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("getJobById failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function acceptJob(req: Request, res: Response): Promise<void> {
  const authed = (() => {
    const user = req.user;
    if (!user) return null;
    return { id: user.id, role: user.role as unknown as UserRole };
  })();

  if (!authed) {
    res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return;
  }
  if (authed.role !== UserRole.FREELANCER) {
    res.status(403).json({ ok: false, error: { message: "Only freelancers can accept jobs", code: "FORBIDDEN" } });
    return;
  }

  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

    const updated = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id },
        select: { id: true, type: true, status: true, clientId: true, assignedFreelancerId: true }
      });

      if (!job) throw new HttpError(404, "NOT_FOUND", "Job not found");
      if (job.type !== JobType.FREE) throw new HttpError(400, "WRONG_TYPE", "Only FREE jobs can be accepted directly");
      if (job.status !== JobStatus.OPEN) throw new HttpError(400, "JOB_NOT_OPEN", "Job is not open");
      if (job.clientId === authed.id) throw new HttpError(403, "FORBIDDEN", "You cannot accept your own job");
      if (job.assignedFreelancerId) throw new HttpError(400, "ALREADY_ACCEPTED", "Job already has an assigned freelancer");

      return tx.job.update({
        where: { id },
        data: {
          status: JobStatus.IN_PROGRESS,
          assignedFreelancerId: authed.id
        }
      });
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
    logger.error("acceptJob failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}
