"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 40;
    const increment = target / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, suffix, label, delay = "0ms" }: {
  icon: string; value: number; suffix: string; label: string; delay?: string;
}) {
  const count = useCountUp(value);
  return (
    <div
      className="glass-card px-5 py-4 flex items-center gap-3 card-hover"
      style={{ animationDelay: delay }}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-mono text-lg font-bold text-white">
          {count.toLocaleString()}{suffix}
        </p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, gradient }: {
  icon: string; title: string; desc: string; gradient: string;
}) {
  return (
    <div className="glass-card p-6 card-hover group">
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="shrink-0 w-10 h-10 rounded-xl gradient-bg flex items-center justify-center font-display font-bold text-white text-lg">
        {num}
      </div>
      <div>
        <h4 className="font-display font-semibold text-white mb-1">{title}</h4>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-appBg overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-grid px-4 py-20">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo/10 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center page-enter">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo/10 border border-indigo/25 text-indigo text-xs font-semibold mb-8 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo animate-pulse" />
            AI-Powered · Verified · Trusted
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">India&apos;s Smartest</span>
            <br />
            <span className="gradient-text">Freelance Marketplace</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Verified skills. Fair bids. AI-powered trust.
            <br className="hidden sm:block" />
            Built for India&apos;s next generation of builders and creators.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="btn-primary text-base px-8 py-3 rounded-xl">
              Get Started Free →
            </Link>
            <Link href="/explore" className="btn-ghost text-base px-8 py-3 rounded-xl">
              Browse Jobs
            </Link>
            <Link href="/explore?tab=services" className="btn-ghost text-base px-8 py-3 rounded-xl">
              Browse Services
            </Link>
          </div>

          {/* Floating Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <StatCard icon="⚡" value={9000} suffix="+" label="Credits Distributed" delay="100ms" />
            <StatCard icon="🛡️" value={100} suffix="%" label="AI-Powered Safety" delay="200ms" />
            <StatCard icon="✅" value={12} suffix="+" label="Verified Skill Tests" delay="300ms" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Everything you need to{" "}
              <span className="gradient-text">succeed</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Built with security and fairness at the core — from first bid to final payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="🛡️"
              title="AI Phishing Guard"
              desc="Every message is scanned by our AI safety layer. Scammers, fake payment links, and off-platform lures are caught and flagged before they reach you."
              gradient="bg-indigo/15 border border-indigo/25"
            />
            <FeatureCard
              icon="✅"
              title="Skill Verification"
              desc="Take short timed tests in React, Node.js, Python, and more. Pass and earn a verified badge shown prominently on your public profile."
              gradient="bg-emerald-500/15 border border-emerald-500/20"
            />
            <FeatureCard
              icon="🔒"
              title="Escrow Payments"
              desc="Clients lock funds into escrow before work begins. Freelancers get paid securely at milestones. Disputes go to admin review. No ghosting."
              gradient="bg-amber-500/15 border border-amber-400/20"
            />
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-4 py-20 bg-surface/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Simple as <span className="gradient-text">1, 2, 3</span>
            </h2>
          </div>

          <div className="glass-card p-8 space-y-8">
            <StepCard
              num="1"
              title="Post or Find a Job"
              desc="Clients post FREE or BID jobs. Freelancers browse and apply in seconds. No setup cost, no friction."
            />
            <div className="border-t border-white/5" />
            <StepCard
              num="2"
              title="Bid & Get Hired"
              desc="Submit competitive proposals. Clients review, accept, and lock payment into secure escrow. Everyone wins."
            />
            <div className="border-t border-white/5" />
            <StepCard
              num="3"
              title="Deliver & Get Paid"
              desc="Complete the work, submit your proof. Client releases from escrow. Credits + rating land in your account instantly."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────── */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="gradient-border">
            <div className="glass-card-accent rounded-2xl p-10 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to build your career?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Join thousands of students and early-career professionals on SkillBridge.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-primary text-base px-10 py-3 rounded-xl">
                  Create Free Account
                </Link>
                <Link href="/login" className="btn-ghost text-base px-10 py-3 rounded-xl">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-4 py-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold text-lg">
              <span className="text-white">Skill</span>
              <span className="gradient-text">Bridge</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">India&apos;s smartest freelance marketplace</p>
          </div>
          <div className="flex items-center gap-6 text-slate-500 text-sm">
            <Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <p className="text-slate-600 text-xs">© 2026 SkillBridge. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
