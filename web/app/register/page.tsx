"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/types";

// ─── Feature cards data ───────────────────────────────────────────────────────

const BRAND_FEATURES = [
  {
    icon: "⚡",
    title: "50 Welcome Credits",
    desc: "Free credits to start bidding",
  },
  {
    icon: "🛡️",
    title: "AI-Protected Workspace",
    desc: "Safe, scam-free environment",
  },
  {
    icon: "✅",
    title: "Verified Badge System",
    desc: "Prove skills, earn trust faster",
  },
] as const;

// ─── Input class (shared across all fields) ──────────────────────────────────

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => fullName.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 8 && !loading,
    [fullName, email, password, loading]
  );

  async function onSubmit(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password, role);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Page-enter animation keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.4s ease both; }
        .animation-delay-200 { animation-delay: 200ms; }
      `}</style>

      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] flex overflow-hidden">
        {/* ── Left: Brand Panel ─────────────────────────────────────────── */}
        <div
          className="hidden lg:flex w-[480px] min-h-screen flex-col justify-center px-12 py-16 relative overflow-hidden animate-fade-up animation-delay-200"
          style={{
            background:
              "var(--brand-bg, linear-gradient(135deg, #0a1628 0%, #0d1a10 50%, #0a1628 100%))",
          }}
        >
          {/* Light / dark CSS variable */}
          <style>{`
            :root {
              --brand-bg: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%);
            }
            .dark {
              --brand-bg: linear-gradient(135deg, #0a1628 0%, #0d1a10 50%, #0a1628 100%);
            }
          `}</style>

          {/* Glow blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/[0.08] rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            {/* Headline */}
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
              Start your journey.
            </p>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">
              Join India&apos;s smartest freelance marketplace today.
            </p>

            {/* Feature cards — TrustCard style */}
            <div className="space-y-4">
              {BRAND_FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form ───────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm animate-fade-up">
            {/* Logo — matches landing navbar */}
            <Link href="/" className="inline-block mb-10">
              <span className="font-bold text-xl">
                <span className="text-slate-900 dark:text-white">Skill</span>
                <span className="text-emerald-500">Bridge</span>
              </span>
            </Link>

            {/* Heading */}
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Create account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Start your SkillBridge journey — free forever.
            </p>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Anudeep Kumar"
                  autoCapitalize="words"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  inputMode="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Minimum 8 characters"
                  type="password"
                />
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                    At least 8 characters required
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  I am a…
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("CLIENT")}
                    className={`flex-1 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 ${
                      role === "CLIENT"
                        ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-slate-600"
                    }`}
                  >
                    🏢 Client
                    <p className="text-xs font-normal mt-0.5 opacity-60">Post jobs, hire talent</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("FREELANCER")}
                    className={`flex-1 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 ${
                      role === "FREELANCER"
                        ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-slate-600"
                    }`}
                  >
                    💼 Freelancer
                    <p className="text-xs font-normal mt-0.5 opacity-60">Find work, earn credits</p>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                disabled={!canSubmit}
                onClick={onSubmit}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating account…
                  </span>
                ) : "Create Account →"}
              </button>

              {/* Sign in link */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
