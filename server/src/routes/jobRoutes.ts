import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  acceptJob, createJob, getJobById, getJobs, getPublicJobs,
  getMyActiveJobs, getMyPostedJobs, completeJob,
} from "../controllers/jobController";

export const jobRoutes = Router();

// Public — no auth (must be registered before /:id)
jobRoutes.get("/public",    getPublicJobs);

// Authenticated specific paths — must be before /:id
jobRoutes.get("/my-active", authenticate, getMyActiveJobs);
jobRoutes.get("/my-posted", authenticate, getMyPostedJobs);

// General
jobRoutes.get("/",           getJobs);
jobRoutes.post("/",          authenticate, createJob);

// Param routes last
jobRoutes.get("/:id",        getJobById);
jobRoutes.post("/:id/accept",    authenticate, acceptJob);
jobRoutes.post("/:id/complete",  authenticate, completeJob);
