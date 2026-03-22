"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User, UserRole } from "../lib/types";
import {
  getStoredUser,
  getToken,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  setStoredUser
} from "../lib/auth";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  /** Update user in state + localStorage (used after role switch) */
  updateUser: (user: User) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: hydrate from localStorage, then refresh from /auth/me if token exists
  useEffect(() => {
    const stored = getStoredUser();
    const storedToken = getToken();

    setUser(stored);
    setToken(storedToken);

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Refresh user from server to pick up any changes
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        const rawUser = res.data?.data?.user as Record<string, unknown> | null;
        if (!cancelled && rawUser) {
          const role = rawUser.role as string;
          const mappedRole: UserRole =
            role === "CUSTOMER" ? "CLIENT" : role === "FREELANCER" ? "FREELANCER" : "ADMIN";

          const freshUser: User = {
            id: rawUser.id as string,
            fullName: rawUser.fullName as string,
            email: rawUser.email as string,
            role: mappedRole,
            creditBalance:
              typeof rawUser.creditBalance === "number" ? rawUser.creditBalance : undefined,
            avatarUrl: rawUser.avatarUrl as string | null | undefined
          };
          setUser(freshUser);
          setStoredUser(freshUser);
        }
      } catch {
        // Token may be expired or invalid – clear
        authLogout();
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authLogin(email, password);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string, role: UserRole = "CLIENT") => {
      const result = await authRegister(fullName, email, password, role);
      setToken(result.token);
      setUser(result.user);
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
