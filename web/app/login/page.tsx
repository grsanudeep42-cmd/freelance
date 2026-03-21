"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/types";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function onSubmit(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/jobs");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#0f172a] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-white text-2xl font-bold">Login</h1>
          <p className="mt-2 text-slate-300">Welcome back to SkillBridge.</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500"
                placeholder="you@example.com"
                autoCapitalize="none"
                inputMode="email"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500"
                placeholder="••••••••"
                type="password"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
            </div>

            {error ? <p className="text-red-400 text-sm">{error}</p> : null}

            <button
              disabled={!canSubmit}
              onClick={onSubmit}
              className={
                canSubmit
                  ? "w-full rounded-xl bg-blue-500 py-3 text-white font-semibold hover:bg-blue-600 transition-colors"
                  : "w-full rounded-xl bg-slate-700 py-3 text-white font-semibold opacity-60"
              }
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <button
              onClick={() => router.push("/register")}
              className="w-full rounded-xl border border-slate-700 py-3 text-white font-semibold bg-transparent hover:border-slate-500 transition-colors"
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
