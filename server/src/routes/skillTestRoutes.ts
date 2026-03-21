import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getSkillTests,
  getAttemptStatus,
  getTestQuestions,
  submitTest,
  getUserBadges,
} from "../controllers/skillTestController";

export const skillTestRoutes = Router();

// Register specific routes BEFORE param routes to avoid collisions
skillTestRoutes.get("/badges/:userId", getUserBadges);

skillTestRoutes.get("/", getSkillTests);

skillTestRoutes.get("/:testId/attempt-status", authenticate, getAttemptStatus);
skillTestRoutes.get("/:testId/questions", authenticate, getTestQuestions);
skillTestRoutes.post("/:testId/submit", authenticate, submitTest);
