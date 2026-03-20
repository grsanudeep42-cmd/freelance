import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = typeof (err as { status?: number }).status === "number" ? (err as { status: number }).status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  res.status(statusCode).json({
    ok: false,
    error: {
      message,
      code: "INTERNAL_SERVER_ERROR"
    }
  });
};

