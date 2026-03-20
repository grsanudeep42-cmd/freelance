import { Router } from "express";
import { healthRoutes } from "./healthRoutes";
import { skillsRoutes } from "./skillsRoutes";

export const apiRoutes = Router();

apiRoutes.use("/", skillsRoutes);

export { healthRoutes };

