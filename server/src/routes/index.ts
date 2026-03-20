import { Router } from "express";
import { healthRoutes } from "./healthRoutes";
import { authRoutes } from "./authRoutes";
import { skillsRoutes } from "./skillsRoutes";
import { jobRoutes } from "./jobRoutes";
import { bidRoutes } from "./bidRoutes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/jobs", jobRoutes);
apiRoutes.use("/bids", bidRoutes);
apiRoutes.use("/", skillsRoutes);

export { healthRoutes };

