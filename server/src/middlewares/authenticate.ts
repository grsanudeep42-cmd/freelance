import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization");

  if (!authHeader) {
    res.status(401).json({ ok: false, error: { message: "Missing authorization token", code: "UNAUTHORIZED" } });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!token || scheme.toLowerCase() !== "bearer") {
    res.status(401).json({ ok: false, error: { message: "Invalid authorization format", code: "UNAUTHORIZED" } });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    res.status(401).json({ ok: false, error: { message: "Invalid or expired token", code: "UNAUTHORIZED" } });
  }
}

