import type { ErrorRequestHandler } from "express";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV === "development";

  logger.error(`[ERROR] ${req.method} ${req.path}: ${err.message}`);

  // Never send stack traces or raw error messages to clients in production
  res.status(500).json({
    ok: false,
    error: {
      message: isDev ? err.message : "Internal server error",
      code: "INTERNAL_ERROR",
      ...(isDev && { stack: err.stack }),
    },
  });
};
