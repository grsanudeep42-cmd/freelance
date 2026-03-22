import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

// Singleton to ensure a single connection pool is reused across the app.
const client = globalThis.__redisClient ?? new Redis(env.REDIS_URL!);

if (!globalThis.__redisClient) {
  globalThis.__redisClient = client;

  // ioredis reconnects automatically by default; these handlers provide visibility.
  client.on("connect", () => {
    logger.info("Redis connected");
  });

  client.on("ready", () => {
    logger.info("Redis ready");
  });

  client.on("error", (err) => {
    logger.error("Redis error", { message: err?.message ?? "Unknown redis error" });
  });

  client.on("reconnecting", () => {
    logger.warn("Redis reconnecting");
  });
}

export const redisClient = client;

