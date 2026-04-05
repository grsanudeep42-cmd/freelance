"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Syne, DM_Sans } from "next/font/google";
import { SERVICE_CATEGORIES, getCategoryLabel } from "../lib/categories";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

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

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 4.5L6.5 11.5L2.5 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 14 14"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 0.5L8.763 5.146L13.763 5.573L9.882 8.854L11.126 13.727L7 11.1L2.874 13.727L4.118 8.854L0.237 5.573L5.237 5.146L7 0.5Z" />
    </svg>
  );
}

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
      <div className="absolute -inset-4 bg-[#10B981]/5 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-[#0E1420] border border-[#1E2A3D] rounded-[16px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#141B28] border-b border-[#1E2A3D]">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🛡️</span>
            <span
              className={`font-bold text-[#F0F4FF] text-sm ${dmSans.className}`}
            >
              SkillBridge AI Guard
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10B981]/10 rounded-full border border-[#10B981]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span
              className={`text-[#34D399] text-xs font-bold ${dmSans.className}`}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-6 min-h-[200px] flex flex-col justify-between">
          {/* Message bubble */}
          <div
            className={`transition-all duration-500 ${
              phase !== "idle"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }`}
          >
            <div
              className={`text-xs font-semibold text-[#3A4A66] mb-2 uppercase tracking-[0.12em] ${dmSans.className}`}
            >
              Incoming message
            </div>
            <div className="bg-[#141B28] border border-[#1E2A3D] rounded-xl px-4 py-3">
              <p
                className={`text-[#F0F4FF]/80 text-sm leading-relaxed ${dmSans.className}`}
              >
                &ldquo;{msg.text}&rdquo;
              </p>
            </div>
          </div>

          {/* Scanning bar */}
          {phase === "scanning" && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-xs font-medium text-[#6B7FA3] ${dmSans.className}`}
                >
                  Analysing message…
                </span>
                <span
                  className={`text-xs font-mono text-[#34D399] ${dmSans.className}`}
                >
                  AI scanning
                </span>
              </div>
              <div className="h-[3px] bg-[#1E2A3D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-1000 ease-in-out"
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
                  ? "bg-red-500/[0.08] border border-red-500/[0.15]"
                  : "bg-[#10B981]/[0.08] border border-[#10B981]/[0.15]"
              }`}
            >
              <span className="text-xl mt-0.5">{msg.blocked ? "🚫" : "✅"}</span>
              <div>
                <p
                  className={`font-bold text-sm ${dmSans.className} ${
                    msg.blocked ? "text-red-400" : "text-[#34D399]"
                  }`}
                >
                  {msg.blocked ? "BLOCKED" : "SAFE — Message delivered"}
                </p>
                {msg.blocked && msg.reason && (
                  <p
                    className={`text-red-300/80 text-xs mt-1 ${dmSans.className}`}
                  >
                    {msg.reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div className="mt-5 h-12 flex items-center">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1E2A3D] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#1E2A3D] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#1E2A3D] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#141B28] border-t border-[#1E2A3D] flex items-center justify-between">
          <span className={`text-xs text-[#6B7FA3] ${dmSans.className}`}>
            Messages scanned today
          </span>
          <span className="font-mono font-bold text-[#34D399] text-sm">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080C14]/85 backdrop-blur-[12px] border-b border-[#1E2A3D]">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className={`font-bold text-xl ${syne.className}`}>
          <span className="text-[#F0F4FF]">Skill</span>
          <span className="text-[#10B981]">Bridge</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/explore"
            className={`text-sm font-medium text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
          >
            Browse Jobs
          </Link>
          <Link
            href="/explore?tab=services"
            className={`text-sm font-medium text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
          >
            Browse Services
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden sm:inline-flex text-sm font-semibold text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors px-4 py-2 ${dmSans.className}`}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={`text-sm font-semibold bg-[#10B981] hover:bg-[#0D9668] text-white px-5 py-2 rounded-[10px] transition-all duration-200 hover:shadow-[0_0_16px_rgba(16,185,129,0.35)] ${dmSans.className}`}
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
          <span
            className={`text-sm font-medium text-[#6B7FA3] ${dmSans.className}`}
          >
            Project value
          </span>
          <span className={`font-bold text-[28px] text-[#F0F4FF] ${syne.className}`}>
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
          className="w-full h-[3px] rounded-full appearance-none cursor-pointer bg-[#1E2A3D] slider-obsidian"
          aria-label="Project value slider"
        />
        <div
          className={`flex justify-between mt-1.5 text-xs text-[#3A4A66] font-mono ${dmSans.className}`}
        >
          <span>₹1,000</span>
          <span>₹5,00,000</span>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Other platforms */}
        <div className="p-7 rounded-[16px] bg-[#0E1420] border border-[#1E2A3D]">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3A4A66] mb-4 ${dmSans.className}`}
          >
            Other Platforms
          </p>
          <div className="mb-3">
            <p className={`text-xs text-[#3A4A66] ${dmSans.className}`}>
              Platform fee (20%)
            </p>
            <p className="font-mono font-bold text-red-400 text-[22px]">
              {fmt(otherFee)}
            </p>
          </div>
          <div className="pt-3 border-t border-[#1E2A3D]">
            <p className={`text-xs text-[#3A4A66] ${dmSans.className}`}>
              You keep (80%)
            </p>
            <p className="font-mono font-bold text-[#F0F4FF] text-[22px]">
              {fmt(otherKeep)}
            </p>
          </div>
        </div>

        {/* SkillBridge */}
        <div className="p-7 rounded-[16px] bg-[#0E1420] border-2 border-[#10B981]/25">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-[#34D399] mb-4 ${dmSans.className}`}
          >
            SkillBridge ✓
          </p>
          <div className="mb-3">
            <p className={`text-xs text-[#3A4A66] ${dmSans.className}`}>
              Platform fee (5%)
            </p>
            <p className="font-mono font-bold text-[#34D399] text-[22px]">
              {fmt(skillbridgeFee)}
            </p>
          </div>
          <div className="pt-3 border-t border-[#10B981]/20">
            <p className={`text-xs text-[#3A4A66] ${dmSans.className}`}>
              You keep (95%)
            </p>
            <p className="font-mono font-bold text-[#F0F4FF] text-[22px]">
              {fmt(skillbridgeKeep)}
            </p>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      <div
        className="mt-4 p-4 rounded-[12px] flex items-center gap-3 border border-[#10B981]/20"
        style={{
          background: "linear-gradient(135deg, #0A2218 0%, #0E2E1E 100%)",
        }}
      >
        <div className="w-8 h-8 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
          <CheckIcon className="w-4 h-4 text-[#34D399]" />
        </div>
        <p className={`font-bold text-[#F0F4FF] ${dmSans.className}`}>
          You save{" "}
          <span className="font-mono text-[#34D399]">{fmt(youSave)}</span> with
          SkillBridge
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
          <div className="shrink-0 w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center font-mono font-bold text-white text-base">
            {num}
          </div>
          {!isLast && (
            <div className="w-px flex-1 mt-3 border-l-2 border-dashed border-[#10B981]/20 min-h-[48px]" />
          )}
        </div>
        <div className="pb-10">
          <h4
            className={`font-semibold text-[#F0F4FF] text-lg mb-1.5 ${dmSans.className}`}
          >
            {title}
          </h4>
          <p
            className={`text-[#6B7FA3] text-[15px] leading-[1.7] ${dmSans.className}`}
          >
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
    <div className="p-7 rounded-[16px] bg-[#080C14] border border-[#1E2A3D] hover:border-[#10B981]/20 transition-colors duration-200">
      <div className="w-12 h-12 rounded-[12px] bg-[#10B981]/[0.08] border border-[#10B981]/[0.15] flex items-center justify-center text-[24px] mb-4">
        {icon}
      </div>
      <h3
        className={`font-semibold text-[#F0F4FF] text-lg mb-2 ${dmSans.className}`}
      >
        {title}
      </h3>
      <p
        className={`text-[#6B7FA3] text-[15px] leading-[1.7] ${dmSans.className}`}
      >
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
    <main
      className={`bg-[#080C14] min-h-screen text-[#F0F4FF] overflow-x-hidden selection:bg-[#10B981]/30 ${syne.variable} ${dmSans.variable}`}
    >
      {/* Dot grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1E2A3D 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }}
      />

      {/* ── 1. NAVBAR ── */}
      <PublicNavbar />

      {/* ── 2. HERO ── */}
      <section className="pt-32 pb-[120px] px-4 relative overflow-hidden">
        {/* Background radial glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, #0E2218 0%, transparent 70%)",
          }}
        />

        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left col — 7/12 */}
          <div className="lg:col-span-7 space-y-7 animate-fade-up">
            {/* Eyebrow pill */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E2A3D] bg-[#0E1420] text-[#6B7FA3] text-[11px] font-semibold uppercase tracking-[0.12em] ${dmSans.className}`}
            >
              🇮🇳 Built for Indian Freelancers
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl md:text-[72px] font-bold text-[#F0F4FF] leading-[1.05] tracking-[-0.03em] ${syne.className}`}
            >
              The freelance platform
              <br />
              built on{" "}
              <span
                key={wordIdx}
                className="text-[#10B981] animate-fade-up inline-block"
              >
                {HERO_WORDS[wordIdx]}
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className={`text-lg text-[#6B7FA3] max-w-[480px] leading-[1.7] ${dmSans.className}`}
            >
              AI-powered scam protection, verified skill badges, and escrow
              payments — built for India&apos;s next generation.
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2.5">
              {[
                "5% fee — lowest in India",
                "AI scans every message",
                "Free to join, always",
              ].map((pill) => (
                <span
                  key={pill}
                  className={`flex items-center gap-2 px-3 py-1.5 border border-[#1E2A3D] bg-[#0E1420] text-[#6B7FA3] rounded-full text-[13px] font-medium ${dmSans.className}`}
                >
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full shrink-0" />
                  {pill}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/register"
                className={`w-full sm:w-auto text-center font-semibold bg-[#10B981] hover:bg-[#0D9668] text-white px-8 py-[14px] rounded-[10px] text-[15px] transition-all duration-200 shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)] ${dmSans.className}`}
              >
                Start for free →
              </Link>
              <Link
                href="/explore"
                className={`w-full sm:w-auto text-center font-semibold border border-[#1E2A3D] text-[#6B7FA3] hover:border-[#2A3A54] hover:text-[#F0F4FF] px-8 py-[14px] rounded-[10px] text-[15px] bg-transparent transition-all duration-200 ${dmSans.className}`}
              >
                Browse marketplace
              </Link>
            </div>
          </div>

          {/* Right col — 5/12 — AI Scanner Widget */}
          <div className="lg:col-span-5 animate-fade-up animation-delay-200 hidden md:block">
            <AIScannerWidget />
          </div>
        </div>
      </section>

      {/* ── 3. FEE CALCULATOR ── */}
      <section className="py-[120px] px-4 bg-[#080C14] border-y border-[#1E2A3D] relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className={`text-3xl md:text-[40px] font-semibold text-[#F0F4FF] mb-4 leading-[1.15] ${syne.className}`}
            >
              See exactly what you keep
            </h2>
            <p
              className={`text-[#6B7FA3] text-base leading-[1.7] ${dmSans.className}`}
            >
              Move the slider — we&apos;ll show you the real numbers
            </p>
          </div>
          <FeeCalculator />
        </div>
      </section>

      {/* ── 4. CATEGORY GRID ── */}
      <section className="py-[120px] px-4 bg-[#080C14] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2
              className={`text-3xl md:text-[40px] font-semibold text-[#F0F4FF] mb-3 leading-[1.15] ${syne.className}`}
            >
              15+ skill categories
            </h2>
            <p
              className={`text-[#6B7FA3] text-base leading-[1.7] ${dmSans.className}`}
            >
              Find work or hire talent across every major category
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
              <Link
                key={cat.value}
                href={`/explore?tab=services&category=${cat.value}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-[16px] bg-[#0E1420] border border-[#1E2A3D] hover:bg-[#141B28] hover:border-[#10B981]/30 hover:-translate-y-[2px] transition-all duration-200 text-center"
              >
                <span className="text-[40px]">
                  {CATEGORY_EMOJIS[cat.value] || "🔹"}
                </span>
                <span
                  className={`font-semibold text-[13px] text-[#6B7FA3] group-hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
                >
                  {cat.label}
                </span>
                <span className="text-[#34D399] opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. LIVE SERVICES ── */}
      <section className="py-[120px] px-4 bg-[#0E1420] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <p
                className={`text-[11px] font-semibold uppercase tracking-[0.12em] text-[#34D399] mb-3 ${dmSans.className}`}
              >
                LIVE MARKETPLACE
              </p>
              <h2
                className={`text-3xl md:text-[40px] font-semibold text-[#F0F4FF] mb-2 leading-[1.15] ${syne.className}`}
              >
                Services available right now
              </h2>
              <p
                className={`text-[#6B7FA3] text-base leading-[1.7] ${dmSans.className}`}
              >
                Browse work from verified Indian freelancers
              </p>
            </div>
            <Link
              href="/explore?tab=services"
              className={`text-[#34D399] font-semibold hover:text-[#10B981] flex items-center gap-1 group ${dmSans.className}`}
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
                  className="h-64 rounded-[16px] bg-[#141B28] animate-pulse border border-[#1E2A3D]"
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
                    className="bg-[#080C14] border border-[#1E2A3D] rounded-[16px] p-6 hover:border-[#2A3A54] hover:-translate-y-[2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-200 flex flex-col"
                  >
                    <span
                      className={`self-start px-2.5 py-1 mb-4 bg-[#141B28] text-[#6B7FA3] text-[11px] font-semibold rounded-[6px] border border-[#1E2A3D] ${dmSans.className}`}
                    >
                      {label}
                    </span>
                    <h3
                      className={`text-base font-semibold text-[#F0F4FF] mb-4 line-clamp-2 ${dmSans.className}`}
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
                        <p
                          className={`text-[13px] font-medium text-[#F0F4FF] truncate ${dmSans.className}`}
                        >
                          {s.freelancer?.fullName}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <StarIcon className="w-[14px] h-[14px] text-[#F59E0B]" />
                          <span className="text-[#F59E0B] font-mono text-[13px] font-bold">
                            {rating ? rating.toFixed(1) : "New"}
                          </span>{" "}
                          <span className="text-[#3A4A66]">
                            ({totalRatings})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1E2A3D] flex items-center justify-between">
                      <div className="flex flex-col">
                        <span
                          className={`text-[11px] text-[#3A4A66] uppercase tracking-wide ${dmSans.className}`}
                        >
                          Starting at
                        </span>
                        <span className="font-mono font-bold text-[#34D399] text-[18px]">
                          ₹{s.price}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span
                          className={`text-[11px] text-[#3A4A66] uppercase tracking-wide ${dmSans.className}`}
                        >
                          Delivery in
                        </span>
                        <span
                          className={`font-medium text-[#6B7FA3] text-[13px] ${dmSans.className}`}
                        >
                          {s.deliveryDays}d
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/services/${s.id}`}
                      className={`mt-5 w-full block text-center py-2.5 bg-[#141B28] text-[#6B7FA3] text-[13px] font-semibold rounded-[8px] border border-[#1E2A3D] hover:bg-[#1E2A3D] hover:text-[#F0F4FF] hover:border-[#2A3A54] transition-all duration-200 ${dmSans.className}`}
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
                    className="bg-[#080C14] border border-dashed border-[#1E2A3D] rounded-[16px] p-8 flex flex-col items-center justify-center text-center last:hidden md:last:flex"
                  >
                    <span className="text-4xl mb-4">{placeholder.emoji}</span>
                    <h3
                      className={`text-[#F0F4FF] font-bold mb-2 ${dmSans.className}`}
                    >
                      {placeholder.name}
                    </h3>
                    <p
                      className={`text-[#6B7FA3] text-sm mb-6 ${dmSans.className}`}
                    >
                      Be the first to offer {placeholder.name} services.
                    </p>
                    <Link
                      href="/services/new"
                      className={`text-[#34D399] font-semibold text-sm hover:text-[#10B981] ${dmSans.className}`}
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
      <section className="px-4 py-[120px] bg-[#080C14] border-y border-[#1E2A3D] relative z-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-2 space-y-6 text-center lg:text-left lg:sticky lg:top-24">
            <div className="inline-flex justify-center items-center w-20 h-20 rounded-[20px] bg-[#10B981]/[0.08] border border-[#10B981]/[0.15] mb-2">
              <span className="text-4xl">🛡️</span>
            </div>
            <h2
              className={`text-3xl md:text-[36px] font-bold text-[#F0F4FF] leading-tight ${syne.className}`}
            >
              Get work done securely in three steps
            </h2>
            <p
              className={`text-base text-[#6B7FA3] leading-[1.7] ${dmSans.className}`}
            >
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
      <section className="px-4 py-[120px] bg-[#0E1420] relative z-10">
        <div className="max-w-[1200px] mx-auto">
          {/* Live activity bar */}
          <div
            className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-12 py-3 px-6 bg-[#080C14] border border-[#1E2A3D] rounded-full text-[13px] text-[#6B7FA3] ${dmSans.className}`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-semibold text-[#34D399]">Live</span>
            </div>
            <span>3 jobs posted in the last hour</span>
            <span className="hidden sm:inline text-[#1E2A3D]">·</span>
            <span>1 message blocked</span>
            <span className="hidden sm:inline text-[#1E2A3D]">·</span>
            <span>2 skills verified</span>
          </div>

          <div className="text-center mb-12">
            <h2
              className={`text-3xl md:text-[40px] font-semibold text-[#F0F4FF] mb-4 leading-[1.15] ${syne.className}`}
            >
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
      <section className="px-4 py-[120px] bg-[#0E1420] relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Subtle radial glow behind heading */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />

          <h2
            className={`text-3xl md:text-[52px] font-bold text-[#F0F4FF] mb-6 tracking-tight leading-[1.1] relative z-10 ${syne.className}`}
          >
            Your next client is already here.
          </h2>
          <p
            className={`text-[#6B7FA3] mb-4 text-lg md:text-xl font-medium max-w-2xl mx-auto relative z-10 ${dmSans.className}`}
          >
            Join the community of Indian freelancers who trust SkillBridge.
          </p>
          <p
            className={`text-[#3A4A66] mb-10 text-sm relative z-10 ${dmSans.className}`}
          >
            Join free. No subscription. Start in 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/register"
              className={`w-full sm:w-auto text-center font-semibold bg-[#10B981] hover:bg-[#0D9668] text-white px-8 py-[14px] rounded-[10px] text-[15px] transition-all duration-200 shadow-[0_0_24px_rgba(16,185,129,0.3)] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)] ${dmSans.className}`}
            >
              Create Free Account
            </Link>
            <Link
              href="/explore"
              className={`w-full sm:w-auto text-center font-semibold border border-[#1E2A3D] text-[#6B7FA3] hover:border-[#2A3A54] hover:text-[#F0F4FF] px-8 py-[14px] rounded-[10px] text-[15px] bg-transparent transition-all duration-200 ${dmSans.className}`}
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="bg-[#050810] border-t border-[#1E2A3D] px-4 py-12 relative z-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className={`font-bold text-xl inline-block mb-3 ${syne.className}`}
            >
              <span className="text-[#F0F4FF]">Skill</span>
              <span className="text-[#10B981]">Bridge</span>
            </Link>
            <p
              className={`text-[#3A4A66] text-[14px] leading-relaxed ${dmSans.className}`}
            >
              The freelance platform built on transparency, safety, and
              fairness. Made for India&apos;s next generation.
            </p>
          </div>

          {/* Links */}
          <div>
            <p
              className={`text-[11px] uppercase tracking-[0.12em] text-[#3A4A66] font-semibold mb-4 ${dmSans.className}`}
            >
              Platform
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/explore"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Browse Jobs
              </Link>
              <Link
                href="/explore?tab=services"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Browse Services
              </Link>
              <Link
                href="/register"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p
              className={`text-[11px] uppercase tracking-[0.12em] text-[#3A4A66] font-semibold mb-4 ${dmSans.className}`}
            >
              Legal
            </p>
            <div className="flex flex-col gap-3">
              <span
                className={`text-[#3A4A66] text-[13px] ${dmSans.className}`}
              >
                © {new Date().getFullYear()} SkillBridge
              </span>
              <Link
                href="/privacy"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className={`text-[14px] text-[#6B7FA3] hover:text-[#F0F4FF] transition-colors ${dmSans.className}`}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom slider styles */}
      <style jsx global>{`
        .slider-obsidian {
          -webkit-appearance: none;
          appearance: none;
          background: #1E2A3D;
          height: 3px;
          border-radius: 999px;
          outline: none;
        }
        .slider-obsidian::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
        .slider-obsidian::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </main>
  );
}
