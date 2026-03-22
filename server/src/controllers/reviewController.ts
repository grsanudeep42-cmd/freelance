import type { Request, Response } from "express";
import { z } from "zod";
import { JobStatus } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";
import { createNotification } from "../services/notificationService";

const createReviewSchema = z.object({
  jobId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

export async function createReview(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
    return;
  }

  try {
    const { jobId, rating, comment } = createReviewSchema.parse(req.body);

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      res.status(404).json({ ok: false, error: { message: "Job not found", code: "NOT_FOUND" } });
      return;
    }

    if (job.status !== JobStatus.COMPLETED) {
      res.status(400).json({ ok: false, error: { message: "Can only review COMPLETED jobs", code: "BAD_REQUEST" } });
      return;
    }

    let revieweeId: string | null = null;

    if (user.id === job.clientId) {
      revieweeId = job.assignedFreelancerId;
    } else if (user.id === job.assignedFreelancerId) {
      revieweeId = job.clientId;
    } else {
      res.status(403).json({ ok: false, error: { message: "You are not a participant in this job", code: "FORBIDDEN" } });
      return;
    }

    if (!revieweeId) {
      res.status(400).json({ ok: false, error: { message: "No counterpart to review", code: "BAD_REQUEST" } });
      return;
    }

    const existingReview = await prisma.review.findFirst({
      where: { jobId, reviewerId: user.id }
    });

    if (existingReview) {
      res.status(400).json({ ok: false, error: { message: "You have already reviewed this job", code: "BAD_REQUEST" } });
      return;
    }

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          jobId,
          reviewerId: user.id,
          revieweeId,
          rating,
          comment
        }
      });

      const allReviews = await tx.review.findMany({
        where: { revieweeId },
        select: { rating: true }
      });

      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await tx.user.update({
        where: { id: revieweeId },
        data: {
          rating: avg,
          totalRatings: allReviews.length
        }
      });

      return newReview;
    });

    // Notify reviewee: new review
    await createNotification({
      userId: revieweeId,
      type: "NEW_REVIEW",
      title: "You received a review ⭐",
      message: `${rating}/5 stars: "${comment?.slice(0, 60) ?? "No comment"}"`,
      link: `/profile/${revieweeId}`,
    });

    res.status(201).json({ ok: true, data: review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("createReview failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getUserReviews(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, fullName: true, avatarUrl: true } },
        job: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ ok: true, data: reviews });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("getUserReviews failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

export async function getJobReviews(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = z.object({ jobId: z.string().uuid() }).parse(req.params);

    const reviews = await prisma.review.findMany({
      where: { jobId },
      include: {
        reviewer: { select: { id: true, fullName: true, avatarUrl: true } },
        reviewee: { select: { id: true, fullName: true, avatarUrl: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ ok: true, data: reviews });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("getJobReviews failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}
