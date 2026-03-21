import type { Request, Response } from "express";
import { AdminJobStatus } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

export async function getPlatformStats(_req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalJobs, totalBids, usersWithCredits, pendingSubmissions] = await prisma.$transaction([
      prisma.user.count(),
      prisma.job.count(),
      prisma.bid.count(),
      prisma.user.aggregate({
        _sum: { creditBalance: true }
      }),
      prisma.adminJob.count({
        where: { status: AdminJobStatus.SUBMITTED }
      })
    ]);

    res.status(200).json({
      ok: true,
      data: {
        totalUsers,
        totalJobs,
        totalBids,
        totalCreditsDistributed: usersWithCredits._sum.creditBalance ?? 0,
        pendingSubmissions
      }
    });
  } catch (err) {
    logger.error("getPlatformStats failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getSubmissions(_req: Request, res: Response): Promise<void> {
  try {
    const submissions = await prisma.adminJob.findMany({
      where: { status: AdminJobStatus.SUBMITTED },
      include: {
        job: { select: { id: true, title: true, creditReward: true } },
        assignedUser: { select: { id: true, fullName: true } }
      }
    });
    res.status(200).json({ ok: true, data: submissions });
  } catch (err) {
    logger.error("getSubmissions failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getMissions(_req: Request, res: Response): Promise<void> {
  try {
    const missions = await prisma.job.findMany({
      where: { type: "ADMIN" },
      include: {
        assignedFreelancer: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json({ ok: true, data: missions });
  } catch (err) {
    logger.error("getMissions failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function getAiFlags(_req: Request, res: Response): Promise<void> {
  try {
    const flags = await prisma.aiFlag.findMany({
      where: { resolved: false },
      include: {
        user: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    res.status(200).json({ ok: true, data: flags });
  } catch (err) {
    logger.error("getAiFlags failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function resolveAiFlag(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    // Validating input
    if (!id) {
      res.status(400).json({ ok: false, error: { message: "ID missing", code: "BAD_REQUEST" }});
      return;
    }

    const flag = await prisma.aiFlag.update({
      where: { id },
      data: { resolved: true }
    });

    res.status(200).json({ ok: true, data: flag });
  } catch (err) {
    logger.error("resolveAiFlag failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

