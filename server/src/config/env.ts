import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive(),
  HOST: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(1),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(1),
  JWT_ISSUER: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  SKILLS_SAMPLE_JSON: z.string().optional(),
  // Auth rate limiting — all optional with secure production defaults
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000), // 15 min
  AUTH_RATE_LIMIT_MAX_DEV:  z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX_PROD: z.coerce.number().int().positive().default(10),
  GROQ_API_KEY: z.string().min(1),
  PAYMENT_MODE: z.enum(["mock", "razorpay"]).default("mock"),
  PLATFORM_FEE_PERCENT: z.coerce.number().int().min(1).max(100).default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  const missingOrInvalidFields = Object.entries(fieldErrors)
    .filter(([, errors]) => Array.isArray(errors) && errors.length > 0)
    .map(([field]) => field);

  throw new Error(
    `Environment validation failed. Missing/invalid env vars: ${missingOrInvalidFields.join(", ")}`
  );
}

export const env = parsed.data;
