import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response, _next: NextFunction): Response {
  return res.status(404).json({
    ok: false,
    error: {
      message: "Route not found",
      code: "NOT_FOUND"
    }
  });
}

