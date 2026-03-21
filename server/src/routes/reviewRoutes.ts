import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { createReview, getUserReviews, getJobReviews } from "../controllers/reviewController";

export const reviewRoutes = Router();

reviewRoutes.get("/user/:userId", getUserReviews);
reviewRoutes.get("/job/:jobId", authenticate, getJobReviews);
reviewRoutes.post("/", authenticate, createReview);
