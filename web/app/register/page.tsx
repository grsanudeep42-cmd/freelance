"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
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
    <main className="min-h-screen bg-appBg flex overflow-hidden">
      {/* ── Left: Brand Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] flex-col justify-center px-12 py-16 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0e1628 0%, #1a1040 50%, #0e1628 100%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <p className="font-display text-4xl font-extrabold text-white mb-3">
            Start your journey.
          </p>
          <p className="text-slate-400 text-lg mb-12">
            Join India&apos;s smartest freelance marketplace today.
          </p>

          <div className="space-y-4">
            {[
              { icon: "⚡", title: "50 Welcome Credits", desc: "Free credits to start bidding" },
              { icon: "🛡️", title: "AI-Protected Workspace", desc: "Safe, scam-free environment" },
              { icon: "✅", title: "Verified Badge System", desc: "Prove skills, earn trust faster" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 glass-card px-5 py-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  <p className="text-slate-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ───────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 page-enter">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-block font-display font-bold text-2xl mb-10">
            <span className="text-white">Skill</span>
            <span className="gradient-text">Bridge</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-slate-400 text-sm mb-8">Start your SkillBridge journey — free forever.</p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Anudeep Kumar"
                autoCapitalize="words"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoCapitalize="none"
                inputMode="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 8 characters"
                type="password"
              />
              {password.length > 0 && password.length < 8 && (
                <p className="text-amber-400 text-xs mt-1">At least 8 characters required</p>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">I am a…</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole("CLIENT")}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-200 ${
                    role === "CLIENT"
                      ? "border-indigo bg-indigo/10 text-indigo-light"
                      : "border-white/8 bg-white/2 text-slate-400 hover:border-white/20"
                  }`}
                >
                  🏢 Client
                  <p className="text-xs font-normal mt-0.5 opacity-70">Post jobs, hire talent</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("FREELANCER")}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-200 ${
                    role === "FREELANCER"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                      : "border-white/8 bg-white/2 text-slate-400 hover:border-white/20"
                  }`}
                >
                  💼 Freelancer
                  <p className="text-xs font-normal mt-0.5 opacity-70">Find work, earn credits</p>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={!canSubmit}
              onClick={onSubmit}
              className="btn-primary w-full py-3 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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

            <p className="text-center text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo hover:text-indigo-light transition-colors font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
