import { Router } from "express";
import { getMyProfile, updateMyProfile, getPublicProfile } from "../controllers/profileController";
import { authenticate } from "../middlewares/authenticate";

export const profileRoutes = Router();

profileRoutes.get("/me", authenticate, getMyProfile);
profileRoutes.put("/me", authenticate, updateMyProfile);
profileRoutes.get("/:userId", getPublicProfile);
