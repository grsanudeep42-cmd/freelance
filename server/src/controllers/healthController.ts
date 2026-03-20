import type { Request, Response } from "express";

export function getHealth(_req: Request, res: Response): Response {
  return res.status(200).json({
    ok: true,
    service: "skillbridge-api",
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
}

