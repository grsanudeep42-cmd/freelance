import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const prismaClient = globalThis.__prismaClient ?? new PrismaClient();

// In development, preserve a single client instance across reloads.
if (env.NODE_ENV !== "production") {
  globalThis.__prismaClient = prismaClient;
}

export const prisma = prismaClient;

