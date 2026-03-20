import type { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "../generated/prisma";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const ACCESS_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  creditBalance: true,
  rating: true,
  totalRatings: true,
  isVerified: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

function toPublicUser(user: {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  creditBalance: number;
  rating: number | null;
  totalRatings: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  passwordHash?: string;
}): Omit<typeof user, "passwordHash"> {
  // Explicitly drop passwordHash so it never appears in any response.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...publicFields } = user;
  return publicFields;
}

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true }
    });

    if (existing) {
      res.status(409).json({
        ok: false,
        error: { message: "Email already taken", code: "EMAIL_TAKEN" }
      });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        role: UserRole.CUSTOMER
      },
      select: ACCESS_USER_SELECT
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({
      ok: true,
      data: {
        accessToken,
        refreshToken,
        user: toPublicUser(user)
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("Register failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        ...ACCESS_USER_SELECT,
        passwordHash: true
      }
    });

    if (!user) {
      res.status(401).json({ ok: false, error: { message: "Invalid email or password", code: "UNAUTHORIZED" } });
      return;
    }

    const passwordOk = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordOk) {
      res.status(401).json({ ok: false, error: { message: "Invalid email or password", code: "UNAUTHORIZED" } });
      return;
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role });

    const publicUser = toPublicUser(user);
    res.status(200).json({
      ok: true,
      data: { accessToken, refreshToken, user: publicUser }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("Login failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const body = refreshSchema.parse(req.body);

    const payload = verifyRefreshToken(body.refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: ACCESS_USER_SELECT
    });

    if (!user) {
      res.status(401).json({ ok: false, error: { message: "Invalid refresh token", code: "UNAUTHORIZED" } });
      return;
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });

    res.status(200).json({
      ok: true,
      data: { accessToken }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ ok: false, error: { message: err.message, code: "BAD_REQUEST" } });
      return;
    }

    logger.error("Refresh failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(401).json({
      ok: false,
      error: { message: "Invalid refresh token", code: "UNAUTHORIZED" }
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Stateless JWT: client drops token.
  res.status(200).json({
    ok: true,
    data: { message: "Logged out" }
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: ACCESS_USER_SELECT
    });

    if (!user) {
      res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    res.status(200).json({ ok: true, data: { user: toPublicUser(user) } });
  } catch (err) {
    logger.error("GetMe failed", { message: err instanceof Error ? err.message : String(err) });
    res.status(500).json({
      ok: false,
      error: { message: "Server error", code: "INTERNAL_SERVER_ERROR" }
    });
  }
}

