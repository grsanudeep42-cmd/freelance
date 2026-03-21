import type { User, UserRole } from "./types";
import { TOKEN_KEY } from "./constants";

const USER_KEY = "skillbridge_user";

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (!token) window.localStorage.removeItem(TOKEN_KEY);
  else window.localStorage.setItem(TOKEN_KEY, token);
}

// ─── User helpers ─────────────────────────────────────────────────────────────

/** Map backend UserRole enum (CUSTOMER) → frontend UserRole (CLIENT). */
function mapBackendRole(role: string): UserRole {
  if (role === "CUSTOMER") return "CLIENT";
  if (role === "FREELANCER") return "FREELANCER";
  if (role === "ADMIN") return "ADMIN";
  return "CLIENT";
}

/** Map frontend UserRole (CLIENT) → backend UserRole (CUSTOMER). */
function mapFrontendRole(role: UserRole): string {
  if (role === "CLIENT") return "CLIENT"; // backend accepts "CLIENT" in our updated schema
  return role;
}

function parseUserFromPayload(raw: Record<string, unknown>): User {
  return {
    id: raw.id as string,
    fullName: raw.fullName as string,
    email: raw.email as string,
    role: mapBackendRole(raw.role as string),
    creditBalance: typeof raw.creditBalance === "number" ? raw.creditBalance : undefined,
    avatarUrl: raw.avatarUrl as string | null | undefined
  };
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (!user) window.localStorage.removeItem(USER_KEY);
  else window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Auth actions ─────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    let message = "Login failed";
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data?.error?.message) message = data.error.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const json = (await res.json()) as { data?: { accessToken?: string; user?: Record<string, unknown> } };
  const token = json.data?.accessToken;
  if (!token) throw new Error("Missing access token");

  const rawUser = json.data?.user;
  const user = rawUser ? parseUserFromPayload(rawUser) : null;

  setToken(token);
  if (user) setStoredUser(user);

  return { token, user: user! };
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  role: UserRole = "CLIENT"
): Promise<{ token: string; user: User }> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fullName, email, password, role: mapFrontendRole(role) })
  });

  if (!res.ok) {
    let message = "Registration failed";
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data?.error?.message) message = data.error.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const json = (await res.json()) as { data?: { accessToken?: string; user?: Record<string, unknown> } };
  const token = json.data?.accessToken;
  if (!token) throw new Error("Missing access token");

  const rawUser = json.data?.user;
  const user = rawUser ? parseUserFromPayload(rawUser) : null;

  setToken(token);
  if (user) setStoredUser(user);

  return { token, user: user! };
}

export function logout(): void {
  setToken(null);
  setStoredUser(null);
}
