import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { acceptJob, createJob, getJobById, getJobs } from "../controllers/jobController";

export const jobRoutes = Router();

jobRoutes.post("/", authenticate, createJob);
jobRoutes.get("/", getJobs);
jobRoutes.get("/:id", getJobById);
jobRoutes.post("/:id/accept", authenticate, acceptJob);


