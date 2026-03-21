import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../generated/prisma";

export function requireRole(allowedRoles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const userRole = req.user?.role;

    // Optional: we can cast it safely if it exists, or just use `as UserRole`.
    if (!userRole) {
      res.status(401).json({ ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({ ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } });
      return;
    }

    next();
  };
}
