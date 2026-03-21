"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/types";

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return fullName.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 8 && !loading;
  }, [fullName, email, password, loading]);

  async function onSubmit(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password, role);
      router.replace("/jobs");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-57px)] bg-[#0f172a] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-white text-2xl font-bold">Register</h1>
          <p className="mt-2 text-slate-300">Create your SkillBridge account.</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500"
                placeholder="Your name"
                autoCapitalize="words"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500"
                placeholder="you@example.com"
                autoCapitalize="none"
                inputMode="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500"
                placeholder="Minimum 8 characters"
                type="password"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <label className="text-slate-300 text-sm">I am a…</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={
                    role === "CLIENT"
                      ? "flex-1 rounded-xl border-2 border-blue-500 bg-blue-500/10 py-2.5 text-blue-300 font-semibold text-sm transition-all"
                      : "flex-1 rounded-xl border-2 border-slate-700 bg-transparent py-2.5 text-slate-400 font-semibold text-sm hover:border-slate-500 transition-all"
                  }
                >
                  Client
                  <p className="text-xs font-normal mt-0.5 opacity-70">
                    {role === "CLIENT" ? "Post jobs, hire talent" : "Post jobs"}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FREELANCER")}
                  className={
                    role === "FREELANCER"
                      ? "flex-1 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 py-2.5 text-emerald-300 font-semibold text-sm transition-all"
                      : "flex-1 rounded-xl border-2 border-slate-700 bg-transparent py-2.5 text-slate-400 font-semibold text-sm hover:border-slate-500 transition-all"
                  }
                >
                  Freelancer
                  <p className="text-xs font-normal mt-0.5 opacity-70">
                    {role === "FREELANCER" ? "Find work, earn credits" : "Find work"}
                  </p>
                </button>
              </div>
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
              {loading ? "Creating..." : "Register"}
            </button>

            <button
              onClick={() => router.push("/login")}
              className="w-full rounded-xl border border-slate-700 py-3 text-white font-semibold bg-transparent hover:border-slate-500 transition-colors"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
