import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { acceptJob, createJob, getJobById, getJobs, getMyActiveJobs, getMyPostedJobs, completeJob } from "../controllers/jobController";

export const jobRoutes = Router();

jobRoutes.post("/", authenticate, createJob);
jobRoutes.get("/", getJobs);
jobRoutes.get("/my-active", authenticate, getMyActiveJobs); // must be before /:id
jobRoutes.get("/my-posted", authenticate, getMyPostedJobs); // must be before /:id
jobRoutes.post("/:id/complete", authenticate, completeJob); // BEFORE get /:id
jobRoutes.get("/:id", getJobById);
jobRoutes.post("/:id/accept", authenticate, acceptJob);
