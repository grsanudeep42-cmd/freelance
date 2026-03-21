"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

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
    <main className="min-h-screen bg-appBg flex overflow-hidden">
      {/* ── Left: Form ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 page-enter">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="inline-block font-display font-bold text-2xl mb-10">
            <span className="text-white">Skill</span>
            <span className="gradient-text">Bridge</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue.</p>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoCapitalize="none"
                inputMode="email"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                type="password"
                onKeyDown={(e) => e.key === "Enter" && canSubmit && onSubmit()}
              />
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
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>

            <p className="text-center text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo hover:text-indigo-light transition-colors font-semibold">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Brand Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[480px] flex-col justify-center px-12 py-16 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0e1628 0%, #1a1040 50%, #0e1628 100%)" }}>
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-violet/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10">
          <p className="font-display text-4xl font-extrabold text-white mb-3">
            Build your freelance career.
          </p>
          <p className="text-slate-400 text-lg mb-12">
            India&apos;s smartest marketplace for the next generation.
          </p>

          <div className="space-y-4">
            {[
              { icon: "🛡️", title: "AI Guard", desc: "Every message scanned for scams" },
              { icon: "✅", title: "Verified Skills", desc: "Earn badges, prove expertise" },
              { icon: "🔒", title: "Escrow Safety", desc: "Funds locked until work is done" },
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
    </main>
  );
}
