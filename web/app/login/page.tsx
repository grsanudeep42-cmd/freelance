"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

// ─── Feature cards data (matches landing TrustCard content) ───────────────────

const BRAND_FEATURES = [
  {
    icon: "🛡️",
    title: "AI Phishing Guard",
    desc: "Every message scanned before it reaches you",
  },
  {
    icon: "✅",
    title: "Verified Skills",
    desc: "Take tests, earn badges, get hired faster",
  },
  {
    icon: "🔒",
    title: "Escrow Protection",
    desc: "Funds held safely until work is delivered",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0 && !loading,
    [email, password, loading]
  );

  async function onSubmit(): Promise<void> {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
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
        {/* ── Left: Form ────────────────────────────────────────────────── */}
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
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Sign in to continue to SkillBridge.
            </p>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  inputMode="email"
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
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
                  className="w-full px-4 py-3 rounded-xl text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                  placeholder="••••••••"
                  type="password"
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
                />
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
                    Signing in…
                  </span>
                ) : "Sign In →"}
              </button>

              {/* Register link */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition-colors"
                >
                  Sign up free
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Brand Panel ─────────────────────────────────────────── */}
        <div
          className="hidden lg:flex w-[480px] min-h-screen flex-col justify-center px-12 py-16 relative overflow-hidden animate-fade-up animation-delay-200"
          style={{
            background:
              "var(--brand-bg, linear-gradient(135deg, #0a1628 0%, #0d1a10 50%, #0a1628 100%))",
          }}
        >
          {/* Light mode override */}
          <style>{`
            :root {
              --brand-bg: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%);
            }
            .dark {
              --brand-bg: linear-gradient(135deg, #0a1628 0%, #0d1a10 50%, #0a1628 100%);
            }
          `}</style>

          {/* Glow blobs — match landing hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/[0.08] rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            {/* Headline */}
            <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
              Build your freelance career.
            </p>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">
              India&apos;s smartest marketplace for the next generation.
            </p>

            {/* Feature cards — match landing TrustCard style */}
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
      </main>
    </>
  );
}
