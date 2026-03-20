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
