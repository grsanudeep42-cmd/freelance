import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import {
  getMe,
  login,
  logout,
  refreshToken,
  register
} from "../controllers/authController";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/refresh", refreshToken);
authRoutes.post("/logout", logout);

authRoutes.get("/me", authenticate, getMe);

