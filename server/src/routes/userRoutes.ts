import { Router } from "express";
import { getPublicUser } from "../controllers/userController";

export const userRoutes = Router();

userRoutes.get("/:userId", getPublicUser);
