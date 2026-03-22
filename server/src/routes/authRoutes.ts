import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { authenticate } from "../middlewares/authenticate";
import { validate } from "../middlewares/validate";
import {
  getMe,
  login,
  logout,
  refreshToken,
  register
} from "../controllers/authController";

/**
 * Auth rate limiter — applies to all /api/auth/* routes.
 *
 * Window and per-environment caps are driven entirely by env vars:
 *   AUTH_RATE_LIMIT_WINDOW_MS  — sliding window in ms  (default: 900000 = 15 min)
 *   AUTH_RATE_LIMIT_MAX_DEV    — max in development     (default: 100)
 *   AUTH_RATE_LIMIT_MAX_PROD   — max in production      (default: 10)
 */
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "development"
    ? env.AUTH_RATE_LIMIT_MAX_DEV
    : env.AUTH_RATE_LIMIT_MAX_PROD,
  standardHeaders: true,  // Return RateLimit-* headers (RFC 6585)
  legacyHeaders: false,   // Disable X-RateLimit-* headers
  message: {
    ok: false,
    error: {
      message: "Too many requests from this IP. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
  role: z.enum(["CLIENT", "FREELANCER"]),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

export const authRoutes = Router();

authRoutes.use(authLimiter);

authRoutes.post("/register", validate(registerSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.post("/refresh", refreshToken);
authRoutes.post("/logout", logout);

authRoutes.get("/me", authenticate, getMe);
