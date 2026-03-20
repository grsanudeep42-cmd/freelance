import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { approveAdminJob, claimAdminJob, submitAdminWork } from "../controllers/adminJobController";

export const adminJobRoutes = Router();

adminJobRoutes.post("/claim", authenticate, claimAdminJob);
adminJobRoutes.post("/submit", authenticate, submitAdminWork);
adminJobRoutes.post("/approve", authenticate, approveAdminJob);

