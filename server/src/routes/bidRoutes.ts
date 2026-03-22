import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  acceptBid,
  applyBid,
  getBidsForJob,
  getMyBids
} from "../controllers/bidController";

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const createBidSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Amount too large"),
  coverLetter: z
    .string()
    .min(20, "Cover letter must be at least 20 characters")
    .max(2000, "Cover letter too long"),
  creditsSpent: z.number().int().min(0).max(100),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const bidRoutes = Router();

bidRoutes.get("/", authenticate, getMyBids);
bidRoutes.post("/", authenticate, validate(createBidSchema), applyBid);
bidRoutes.get("/job/:jobId", authenticate, getBidsForJob);
bidRoutes.post("/:bidId/accept", authenticate, acceptBid);
