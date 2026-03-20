import { Router } from "express";
import { healthRoutes } from "./healthRoutes";
import { authRoutes } from "./authRoutes";
import { skillsRoutes } from "./skillsRoutes";
import { jobRoutes } from "./jobRoutes";
import { bidRoutes } from "./bidRoutes";
import { adminJobRoutes } from "./adminJobRoutes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/jobs", jobRoutes);
apiRoutes.use("/bids", bidRoutes);
apiRoutes.use("/admin-jobs", adminJobRoutes);
apiRoutes.use("/", skillsRoutes);

export { healthRoutes };

