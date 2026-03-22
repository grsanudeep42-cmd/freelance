import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive(),
  HOST: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(32,
    "JWT secret must be at least 32 characters"),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(32,
    "JWT refresh secret must be at least 32 characters"),
  JWT_ISSUER: z.string().min(1),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  SKILLS_SAMPLE_JSON: z.string().optional(),
  // Auth rate limiting — all optional with secure production defaults
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 min
  AUTH_RATE_LIMIT_MAX_DEV:  z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX_PROD: z.coerce.number().int().positive().default(10),
  GROQ_API_KEY: z.string().optional(),
  PAYMENT_MODE: z.enum(["mock", "razorpay"]).default("mock"),
  PLATFORM_FEE_PERCENT: z.coerce.number().int().min(1).max(100).default(5),
});

const parsed = envSchema.safeParse(process.env!);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // crash hard if env is wrong
}

export const env = parsed.data!;
