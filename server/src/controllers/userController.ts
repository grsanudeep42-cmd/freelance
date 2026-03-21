import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

export async function getPublicUser(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        rating: true,
        totalRatings: true,
        createdAt: true,
        isVerified: true
      }
    });

    if (!user) {
      res.status(404).json({ ok: false, error: { message: "User not found", code: "NOT_FOUND" } });
      return;
    }

    res.status(200).json({ ok: true, data: user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }
    logger.error("getPublicUser failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({ ok: false, error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}
