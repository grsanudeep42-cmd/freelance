import { Router } from "express";
import { UserRole } from "../generated/prisma";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/requireRole";
import { getMissions, getPlatformStats, getSubmissions, getAiFlags, resolveAiFlag } from "../controllers/adminController";

export const adminRoutes = Router();

adminRoutes.get("/stats", authenticate, requireRole([UserRole.ADMIN]), getPlatformStats);
adminRoutes.get("/submissions", authenticate, requireRole([UserRole.ADMIN]), getSubmissions);
adminRoutes.get("/missions", authenticate, requireRole([UserRole.ADMIN]), getMissions);
adminRoutes.get("/flags", authenticate, requireRole([UserRole.ADMIN]), getAiFlags);
adminRoutes.patch("/flags/:id/resolve", authenticate, requireRole([UserRole.ADMIN]), resolveAiFlag);
