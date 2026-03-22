import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getMissions, getPlatformStats, getSubmissions, getAiFlags, resolveAiFlag } from "../controllers/adminController";

export const adminRoutes = Router();

adminRoutes.get("/stats",               authenticate, requireAdmin, getPlatformStats);
adminRoutes.get("/submissions",          authenticate, requireAdmin, getSubmissions);
adminRoutes.get("/missions",             authenticate, requireAdmin, getMissions);
adminRoutes.get("/flags",                authenticate, requireAdmin, getAiFlags);
adminRoutes.patch("/flags/:id/resolve",  authenticate, requireAdmin, resolveAiFlag);
