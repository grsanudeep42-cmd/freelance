import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, setAuthToken, type Token } from "../lib/api";

type AuthContextValue = {
  token: Token | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (fullName: string, email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const nextToken = res.data?.data?.accessToken as Token | undefined;
      if (!nextToken) throw new Error("Missing access token");

      setToken(nextToken);
      setAuthToken(nextToken);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { fullName, email, password });
      const nextToken = res.data?.data?.accessToken as Token | undefined;
      if (!nextToken) throw new Error("Missing access token");

      setToken(nextToken);
      setAuthToken(nextToken);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, loading, login, logout, register }),
    [token, loading, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

