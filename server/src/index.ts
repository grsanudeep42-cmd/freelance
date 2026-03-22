import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { apiRoutes } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// ─── 1. Helmet — security headers (MUST be first) ───────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // needed for some Next.js assets
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// ─── 2. CORS — dynamic origin, credentials enabled ──────────────────────────
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── 3. Global rate limiter — all /api routes ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});

// ─── 4. Strict auth rate limiter ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      message: "Too many login attempts. Please try again in 15 minutes.",
      code: "RATE_LIMITED",
    },
  },
});

// ─── Body parsing & logging ──────────────────────────────────────────────────
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes (global limiter first) ──────────────────────────────────────────
app.use("/api", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/refresh", authLimiter);
app.use("/api", apiRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: { message: "Not found", code: "NOT_FOUND" },
  });
});

// ─── Error handler — MUST be last ───────────────────────────────────────────
app.use(errorHandler);

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(env.PORT, env.HOST, () => {
  logger.info(`Server running on http://${env.HOST}:${env.PORT}`);
});

export { app };
