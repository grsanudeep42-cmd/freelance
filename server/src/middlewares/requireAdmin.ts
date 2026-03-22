import type { Request, Response, NextFunction } from "express";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({
      ok: false,
      error: {
        message: "Admin access required",
        code: "FORBIDDEN",
      },
    });
    return;
  }
  next();
}
