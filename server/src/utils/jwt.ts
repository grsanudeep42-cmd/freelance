import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { UserRole } from "../generated/prisma";
import { env } from "../config/env";

type TokenPayload = {
  id: string;
  email: string;
  role: UserRole;
};

const tokenPayloadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole)
});

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: env.JWT_ISSUER
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: env.JWT_ISSUER
  });
}

function verifyToken(token: string, secret: string): TokenPayload {
  const decoded = jwt.verify(token, secret, { issuer: env.JWT_ISSUER });
  const data = decoded as JwtPayload | string;
  if (typeof data === "string") throw new Error("Invalid token payload");

  const payload = tokenPayloadSchema.parse({
    id: data.id,
    email: data.email,
    role: data.role
  });

  return payload as TokenPayload;
}

export function verifyAccessToken(token: string): TokenPayload {
  return verifyToken(token, env.JWT_ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string): TokenPayload {
  return verifyToken(token, env.JWT_REFRESH_TOKEN_SECRET);
}

