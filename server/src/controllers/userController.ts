import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { UserRole } from "../generated/prisma";

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

export async function switchRole(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      res.status(404).json({
        ok: false,
        error: { message: "User not found", code: "NOT_FOUND" },
      });
      return;
    }

    // ADMIN cannot switch roles
    if (currentUser.role === UserRole.ADMIN) {
      res.status(403).json({
        ok: false,
        error: { message: "Admin role cannot be switched", code: "FORBIDDEN" },
      });
      return;
    }

    // Toggle between CUSTOMER and FREELANCER
    const newRole =
      currentUser.role === UserRole.CUSTOMER
        ? UserRole.FREELANCER
        : UserRole.CUSTOMER;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        creditBalance: true,
        rating: true,
        totalRatings: true,
        avatarUrl: true,
      },
    });

    // Issue new tokens with updated role
    const newAccessToken = signAccessToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });
    const newRefreshToken = signRefreshToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    // Map CUSTOMER → CLIENT for the frontend
    const frontendRole =
      updatedUser.role === UserRole.CUSTOMER ? "CLIENT" : updatedUser.role;

    res.json({
      ok: true,
      data: {
        user: { ...updatedUser, role: frontendRole },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch {
    res.status(500).json({
      ok: false,
      error: { message: "Failed to switch role", code: "INTERNAL_SERVER_ERROR" },
    });
  }
}
