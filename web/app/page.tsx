"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, getCategoryLabel } from "../lib/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  price: number;
  deliveryDays: number;
  freelancer: {
    fullName: string;
    rating: number;
    totalRatings: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  "web-development": "💻",
  "graphic-design": "🎨",
  "content-writing": "✍️",
  "digital-marketing": "📈",
  "video-editing": "🎬",
  "ui-ux-design": "✨",
  "mobile-app-dev": "📱",
  "ai-ml": "🤖",
};

const DEMO_MESSAGES = [
  {
    text: "Hey, can you share your WhatsApp? +91 98765 43210",
    blocked: true,
    reason: "Phone number detected — off-platform contact attempt",
  },
  {
    text: "I'll pay you on GPay outside the platform, 50% bonus!",
    blocked: true,
    reason: "External payment request detected",
  },
  {
    text: "Can you deliver by Friday? The design looks great so far.",
    blocked: false,
    reason: null,
  },
  {
    text: "Contact me on Telegram @client123 for project details",
    blocked: true,
    reason: "Telegram contact attempt detected",
  },
];

const HERO_WORDS = ["trust.", "safety.", "fairness."];

// ─── AI Scanner Widget ────────────────────────────────────────────────────────

type ScanPhase = "idle" | "scanning" | "result";

function AIScannerWidget() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanWidth, setScanWidth] = useState(0);
  const [messageCount] = useState(1247);

  const runCycle = useCallback(() => {
    setPhase("idle");
    setScanWidth(0);

    const t1 = setTimeout(() => {
      setPhase("scanning");
      setScanWidth(100);
    }, 200);

    const t2 = setTimeout(() => {
      setPhase("result");
    }, 1400);

    const t3 = setTimeout(() => {
      setMsgIdx((i) => (i + 1) % DEMO_MESSAGES.length);
      setPhase("idle");
      setScanWidth(0);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const cleanup = runCycle();
    const interval = setInterval(runCycle, 3500);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [runCycle]);

  const msg = DEMO_MESSAGES[msgIdx];

  return (
    <div className="relative">
      {/* Glow behind widget */}
      <div className="absolute -inset-4 bg-emerald-500/5 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🛡️</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              SkillBridge AI Guard
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              LIVE
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-6 min-h-[200px] flex flex-col justify-between">
          {/* Message bubble */}
          <div
            className={`transition-all duration-500 ${
              phase !== "idle" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wide">
              Incoming message
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
              <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                "{msg.text}"
              </p>
            </div>
          </div>

          {/* Scanning bar */}
          {phase === "scanning" && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Analysing message…
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  AI scanning
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${scanWidth}%` }}
                />
              </div>
            </div>
          )}

          {/* Result */}
          {phase === "result" && (
            <div
              className={`mt-5 rounded-xl px-4 py-3 flex items-start gap-3 transition-all duration-300 ${
                msg.blocked
                  ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20"
              }`}
            >
              <span className="text-xl mt-0.5">{msg.blocked ? "🚫" : "✅"}</span>
              <div>
                <p
                  className={`font-bold text-sm ${
                    msg.blocked
                      ? "text-red-700 dark:text-red-400"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {msg.blocked ? "BLOCKED" : "SAFE — Message delivered"}
                </p>
                {msg.blocked && msg.reason && (
                  <p className="text-red-600 dark:text-red-300 text-xs mt-1 opacity-80">
                    {msg.reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div className="mt-5 h-12 flex items-center">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Messages scanned today
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {messageCount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function PublicNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0A0F1E]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-xl"
        >
          <span className="text-slate-900 dark:text-white">Skill</span>
          <span className="text-emerald-500">Bridge</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/explore"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Browse Jobs
          </Link>
          <Link
            href="/explore?tab=services"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Browse Services
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Fee Calculator ───────────────────────────────────────────────────────────

function FeeCalculator() {
  const [projectValue, setProjectValue] = useState(10000);

  const skillbridgeFee = Math.round(projectValue * 0.05);
  const skillbridgeKeep = projectValue - skillbridgeFee;
  const otherFee = Math.round(projectValue * 0.2);
  const otherKeep = projectValue - otherFee;
  const youSave = skillbridgeKeep - otherKeep;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div>
      {/* Slider */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Project value
          </span>
          <span className="font-mono font-bold text-2xl text-slate-900 dark:text-white">
            {fmt(projectValue)}
          </span>
        </div>
        <input
          type="range"
          min={1000}
          max={500000}
          step={1000}
          value={projectValue}
          onChange={(e) => setProjectValue(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700"
          aria-label="Project value slider"
        />
        <div className="flex justify-between mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
          <span>₹1,000</span>
          <span>₹5,00,000</span>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Other platforms */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
            Other Platforms
          </p>
          <div className="mb-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">Platform fee (20%)</p>
            <p className="font-mono font-bold text-red-500 text-xl">{fmt(otherFee)}</p>
          </div>
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">You keep (80%)</p>
            <p className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xl">
              {fmt(otherKeep)}
            </p>
          </div>
        </div>

        {/* SkillBridge */}
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-300 dark:border-emerald-500/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-4">
            SkillBridge ✓
          </p>
          <div className="mb-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">Platform fee (5%)</p>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xl">
              {fmt(skillbridgeFee)}
            </p>
          </div>
          <div className="pt-3 border-t border-emerald-200 dark:border-emerald-500/20">
            <p className="text-xs text-slate-400 dark:text-slate-500">You keep (95%)</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white text-xl">
              {fmt(skillbridgeKeep)}
            </p>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      <div className="mt-4 p-4 rounded-xl bg-emerald-500 flex items-center gap-3">
        <span className="text-2xl">💚</span>
        <p className="font-bold text-white">
          You save{" "}
          <span className="font-mono">{fmt(youSave)}</span> with SkillBridge
        </p>
      </div>
    </div>
  );
}

// ─── Step Card (How It Works) ─────────────────────────────────────────────────

function StepCard({
  num,
  title,
  desc,
  isLast,
}: {
  num: string;
  title: string;
  desc: string;
  isLast?: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex gap-5 items-start">
        <div className="flex flex-col items-center">
          <div className="shrink-0 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-mono font-bold text-white text-lg">
            {num}
          </div>
          {!isLast && (
            <div className="w-px flex-1 mt-3 border-l-2 border-dashed border-emerald-500/30 min-h-[48px]" />
          )}
        </div>
        <div className="pb-10">
          <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1.5">
            {title}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Trust Card ───────────────────────────────────────────────────────────────

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [wordIdx, setWordIdx] = useState(0);

  // Animated headline words
  useEffect(() => {
    const t = setInterval(
      () => setWordIdx((i) => (i + 1) % HERO_WORDS.length),
      2500
    );
    return () => clearInterval(t);
  }, []);

  // Fetch services
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/services/public`
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          setServices(json.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch public services:", err);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <main className="bg-white dark:bg-[#0A0F1E] min-h-screen text-slate-900 dark:text-slate-300 overflow-x-hidden selection:bg-emerald-500/30">
      {/* ── 1. NAVBAR ── */}
      <PublicNavbar />

      {/* ── 2. HERO ── */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left col — 55% */}
          <div className="lg:col-span-7 space-y-7 animate-fade-up">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              🇮🇳 Trusted by Indian students &amp; professionals
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
              The freelance platform
              <br />
              built on{" "}
              <span
                key={wordIdx}
                className="text-emerald-500 animate-fade-up inline-block"
              >
                {HERO_WORDS[wordIdx]}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              AI-powered scam protection, verified skill badges, and escrow
              payments. Finally a marketplace that works for YOU.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2.5">
              {[
                "✓ 5% fee — lowest in India",
                "✓ AI scans every message",
                "✓ Free to join, always",
              ].map((pill) => (
                <span
                  key={pill}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 rounded-full text-sm font-medium"
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto text-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
              >
                Start for free →
              </Link>
              <Link
                href="/explore"
                className="w-full sm:w-auto text-center font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-3.5 rounded-xl transition-colors"
              >
                Browse marketplace
              </Link>
            </div>
          </div>

          {/* Right col — 45% — AI Scanner Widget */}
          <div className="lg:col-span-5 animate-fade-up animation-delay-200 hidden md:block">
            <AIScannerWidget />
          </div>
        </div>
      </section>

      {/* ── 3. FEE CALCULATOR ── */}
      <section className="py-24 px-4 bg-slate-50 dark:bg-[#0d1424] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              See exactly what you keep
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Move the slider — we&apos;ll show you the real numbers
            </p>
          </div>
          <FeeCalculator />
        </div>
      </section>

      {/* ── 4. CATEGORY GRID ── */}
      <section className="py-24 px-4 bg-white dark:bg-[#0A0F1E]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-3">
              15+ skill categories
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Find work or hire talent across every major category
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
              <Link
                key={cat.value}
                href={`/explore?tab=services&category=${cat.value}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-[#1a2332] hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 text-center"
              >
                <span className="text-4xl">{CATEGORY_EMOJIS[cat.value] || "🔹"}</span>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {cat.label}
                </span>
                <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. LIVE SERVICES ── */}
      <section className="py-24 px-4 bg-slate-50 dark:bg-[#0d1424]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Services available right now
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Browse work from verified Indian freelancers
              </p>
            </div>
            <Link
              href="/explore?tab=services"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 flex items-center gap-1 group"
            >
              Browse all services{" "}
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingServices ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
                />
              ))
            ) : services.length > 0 ? (
              services.map((s) => {
                const label = getCategoryLabel(s.category) || s.category;
                const initials = s.freelancer?.fullName?.[0] ?? "?";
                const rating = s.freelancer?.rating;
                const totalRatings = s.freelancer?.totalRatings ?? 0;

                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-emerald-300 dark:hover:border-slate-500 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <span className="self-start px-2.5 py-1 mb-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded border border-slate-200 dark:border-slate-700">
                      {label}
                    </span>
                    <h3
                      className="text-lg font-bold text-slate-900 dark:text-white mb-4 line-clamp-2"
                      title={s.title}
                    >
                      {s.title.length > 60
                        ? s.title.substring(0, 60) + "..."
                        : s.title}
                    </h3>

                    <div className="mt-auto flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {s.freelancer?.fullName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          ⭐{" "}
                          <span className="text-amber-500 font-bold">
                            {rating ? rating.toFixed(1) : "New"}
                          </span>{" "}
                          <span className="opacity-70">({totalRatings})</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Starting at</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{s.price}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-xs text-slate-400">Delivery in</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                          {s.deliveryDays}d
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/services/${s.id}`}
                      className="mt-5 w-full block text-center py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors"
                    >
                      View Service →
                    </Link>
                  </div>
                );
              })
            ) : (
              <>
                {[
                  { emoji: "💻", name: "Web Development" },
                  { emoji: "🎨", name: "Graphic Design" },
                  { emoji: "✍️", name: "Content Writing" },
                ].map((placeholder) => (
                  <div
                    key={placeholder.name}
                    className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center last:hidden md:last:flex"
                  >
                    <span className="text-4xl mb-4">{placeholder.emoji}</span>
                    <h3 className="text-slate-900 dark:text-white font-bold mb-2">
                      {placeholder.name}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                      Be the first to offer {placeholder.name} services.
                    </p>
                    <Link
                      href="/services/new"
                      className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm hover:text-emerald-500"
                    >
                      Create Service →
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section className="px-4 py-24 bg-white dark:bg-[#111827] border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 space-y-6 text-center lg:text-left lg:sticky lg:top-24">
            <div className="inline-flex justify-center items-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.15)] mb-2">
              <span className="text-4xl">🛡️</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Get work done securely in three steps
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              We handle the friction so you can focus on building. Escrow
              payments and AI moderation protect every interaction.
            </p>
          </div>

          <div className="lg:col-span-3">
            <StepCard
              num="1"
              title="Post a job or list your service"
              desc="Clients post jobs in seconds. Freelancers list their services and start getting orders."
            />
            <StepCard
              num="2"
              title="Connect and agree on terms"
              desc="Browse profiles with verified skill badges. Message safely — our AI blocks scammers automatically."
            />
            <StepCard
              num="3"
              title="Work, deliver, get paid"
              desc="Payment is held in escrow. Release on completion. Money hits your UPI within 24 hours."
              isLast
            />
          </div>
        </div>
      </section>

      {/* ── 7. TRUST SECTION ── */}
      <section className="px-4 py-24 bg-slate-50 dark:bg-[#0A0F1E]">
        <div className="max-w-5xl mx-auto">
          {/* Live activity bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-12 py-3 px-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-full text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </div>
            <span>3 jobs posted in the last hour</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span>1 message blocked</span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span>2 skills verified</span>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
              Why Indian freelancers choose SkillBridge
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TrustCard
              icon="🛡️"
              title="AI Scam Protection"
              desc="Every message scanned. Phone numbers, WhatsApp links, fake payment requests — all blocked automatically."
            />
            <TrustCard
              icon="✅"
              title="Skill Verification"
              desc="Take tests in React, Node.js, Python and more. Earn verified badges that clients can trust."
            />
            <TrustCard
              icon="🔒"
              title="Escrow Safety"
              desc="Your payment is locked before work begins. No ghosting. No unpaid work. Ever."
            />
            <TrustCard
              icon="🇮🇳"
              title="Built for India"
              desc="UPI payments, Indian rupee pricing, and support that understands the Indian freelance market."
            />
          </div>
        </div>
      </section>

      {/* ── 8. FINAL CTA ── */}
      <section className="px-4 py-24 bg-slate-900 dark:bg-[#111827]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Your next client is already here.
          </h2>
          <p className="text-slate-300 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Join free. No subscription. Start in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center font-bold bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3.5 rounded-xl transition-colors shadow-lg"
            >
              Create Free Account
            </Link>
            <Link
              href="/explore"
              className="w-full sm:w-auto text-center font-bold bg-transparent border border-slate-600 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="bg-slate-900 dark:bg-[#050810] border-t border-slate-800 px-4 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="font-bold text-xl inline-block mb-3">
              <span className="text-white">Skill</span>
              <span className="text-emerald-500">Bridge</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              The freelance platform built on transparency, safety, and fairness.
              Made for India&apos;s next generation.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Platform
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/explore"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/explore?tab=services"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Browse Services
              </Link>
              <Link
                href="/register"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-slate-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Legal
            </p>
            <div className="flex flex-col gap-3">
              <span className="text-slate-600 text-sm">
                © {new Date().getFullYear()} SkillBridge
              </span>
              <Link
                href="/privacy"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-slate-500 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
