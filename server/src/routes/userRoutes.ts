import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import { getPublicUser, switchRole } from "../controllers/userController";

export const userRoutes = Router();

userRoutes.patch("/switch-role", authenticate, switchRole);
userRoutes.get("/:userId", getPublicUser);
