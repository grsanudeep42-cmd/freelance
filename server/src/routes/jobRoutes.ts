import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  acceptJob, createJob, getJobById, getJobs, getPublicJobs,
  getMyActiveJobs, getMyPostedJobs, completeJob,
} from "../controllers/jobController";

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const createJobSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title too long"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description too long"),
  type: z.enum(["FREE", "BID", "ADMIN"]),
  budget: z.number().positive().optional(),
  creditReward: z.number().int().positive().optional(),
  deadlineAt: z.string().datetime().optional(),
  category: z.string().max(100).optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const jobRoutes = Router();

// Public — no auth (must be registered before /:id)
jobRoutes.get("/public",    getPublicJobs);

// Authenticated specific paths — must be before /:id
jobRoutes.get("/my-active", authenticate, getMyActiveJobs);
jobRoutes.get("/my-posted", authenticate, getMyPostedJobs);

// General
jobRoutes.get("/",           getJobs);
jobRoutes.post("/",          authenticate, validate(createJobSchema), createJob);

// Param routes last
jobRoutes.get("/:id",        getJobById);
jobRoutes.post("/:id/accept",    authenticate, acceptJob);
jobRoutes.post("/:id/complete",  authenticate, completeJob);
