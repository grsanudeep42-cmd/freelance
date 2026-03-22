import fs from "node:fs";
import winston from "winston";
import { env } from "../config/env";

const isProduction = env.NODE_ENV! === "production";

const level = isProduction ? "info" : "debug";

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [];

if (isProduction) {
  fs.mkdirSync("logs", { recursive: true });

  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error"
    })
  );

  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log"
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      stderrLevels: ["error"],
      level
    })
  );
}

export const logger = winston.createLogger({
  level,
  format: baseFormat,
  transports
});

