import type { Request, Response, NextFunction } from "express";
import { type ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        ok: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
