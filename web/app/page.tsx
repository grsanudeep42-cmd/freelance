"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES, getCategoryLabel } from "../lib/categories";

// ─── Constants & Helpers ──────────────────────────────────────────────────────

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

// ─── Components ───────────────────────────────────────────────────────────────

function PublicNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl tracking-tight">
          <span className="text-white">Skill</span>
          <span className="text-emerald-500">Bridge</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Browse Jobs</Link>
          <Link href="/explore?tab=services" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Browse Services</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:inline-flex text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg transition-colors shadow-lg shadow-emerald-500/10">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-emerald-400 text-xl">
        {num}
      </div>
      <div>
        <h4 className="font-sans font-bold text-white text-lg mb-1.5">{title}</h4>
        <p className="font-sans text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TrustCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-sans font-bold text-white text-lg mb-2">{title}</h3>
      <p className="font-sans text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/public`);
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
    <main className="bg-[#0a0f1e] min-h-screen text-slate-300 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <PublicNavbar />

      {/* ── 2. HERO SECTION ── */}
      <section className="py-20 px-4 bg-[#0a0f1e] min-h-[80vh] flex flex-col justify-center relative overflow-hidden page-enter pt-32">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Side */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              🇮🇳 Built for India&apos;s freelancers
            </div>
            
            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.12] tracking-tight">
              The freelance marketplace<br />
              that actually protects you.
            </h1>

            <p className="font-sans text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
              AI scam protection, verified skills, and secure escrow payments. Built for Indian students and professionals.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/register" className="w-full sm:w-auto text-center font-bold bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-3.5 rounded-xl transition-colors shadow-lg">
                Start Earning Free &rarr;
              </Link>
              <Link href="/explore" className="w-full sm:w-auto text-center font-bold bg-transparent text-white border border-slate-700 hover:bg-slate-800 px-8 py-3.5 rounded-xl transition-colors">
                Find Talent
              </Link>
            </div>

            <div className="pt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full"><span className="text-emerald-500">✓</span> 5% platform fee</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full"><span className="text-emerald-500">✓</span> AI scam protection</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-full"><span className="text-emerald-500">✓</span> No subscription</span>
            </div>
          </div>

          {/* Right Side - Floating Card */}
          <div className="lg:col-span-5 relative perspective-1000 hidden md:block">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-indigo-500/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-2xl transform rotate-y-[-2deg] rotate-x-[2deg] hover:rotate-0 hover:-translate-y-1 transition-all duration-300 z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 text-slate-300 text-xs font-bold rounded-md border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite]" /> Web Development
                  </div>
                  <span className="font-mono font-bold text-white text-lg">Starting at ₹2,500</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-5 leading-snug">I will build your responsive React website with Tailwind CSS</h3>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner border border-slate-700">
                    A
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Anudeep K.</p>
                    <p className="text-slate-400 text-xs flex items-center gap-1">⭐ <span className="text-amber-400 font-bold">4.8</span> <span className="text-slate-500">(12 reviews)</span></p>
                  </div>
                </div>
                <button className="w-full py-3 bg-slate-800 text-white font-semibold rounded-xl border border-slate-700 hover:bg-slate-700/80 transition-colors">
                  View Service &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CATEGORY CHIPS ── */}
      <section className="py-16 border-y border-slate-800 bg-[#0d1424]">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="mb-8">
            <h2 className="font-sans text-2xl font-bold text-white mb-2">What are you looking for?</h2>
            <p className="font-sans text-slate-400 text-sm">Browse by category — 15+ skill areas</p>
          </div>
          
          <div className="relative">
            <div className="flex overflow-x-auto pb-4 gap-3 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative z-10">
              {SERVICE_CATEGORIES.slice(0, 8).map(cat => (
                <Link 
                  key={cat.value} 
                  href={`/explore?tab=services&category=${cat.value}`}
                  className="shrink-0 snap-start flex items-center gap-2 px-5 py-3 rounded-full border border-slate-700 bg-slate-800 bg-gradient-to-b hover:from-slate-700 hover:to-slate-800 hover:border-indigo-500/50 hover:text-indigo-300 transition-all group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{CATEGORY_EMOJIS[cat.value] || "🔹"}</span>
                  <span className="font-medium text-sm whitespace-nowrap">{cat.label}</span>
                </Link>
              ))}
            </div>
            <div className="absolute top-0 right-0 bottom-4 w-24 bg-gradient-to-l from-[#0d1424] to-transparent pointer-events-none z-20" />
          </div>
        </div>
      </section>

      {/* ── 4. FEE COMPARISON ── */}
      <section className="py-24 px-4 bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-white mb-4">
              Finally, a platform that&apos;s on your side
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Competitors Card */}
            <div className="p-8 pb-10 rounded-3xl bg-[#0d1424] border border-slate-800 relative overflow-hidden group hover:border-red-500/20 transition-colors h-full flex flex-col">
              <div className="absolute top-0 right-0 p-6 opacity-5 font-sans font-black text-8xl text-red-500 group-hover:opacity-10 transition-opacity">20%</div>
              <div className="mb-6 inline-block px-4 py-1.5 rounded-full bg-[#111827] text-slate-400 text-sm font-bold tracking-wide uppercase border border-slate-800 self-start">
                Other Platforms
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center justify-between text-slate-300">
                  <span>Most platforms</span>
                  <span className="font-mono font-bold text-red-400">up to 20% fee</span>
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Top global platforms</span>
                  <span className="font-mono font-bold text-red-400">up to 20%</span>
                </li>
                <li className="flex items-center justify-between text-slate-300">
                  <span>Bidding platforms</span>
                  <span className="font-mono font-bold text-red-400">up to 10% fee</span>
                </li>
              </ul>
              <div className="pt-6 border-t border-slate-800 mt-auto">
                <p className="text-slate-400 font-medium text-sm">Every rupee you earn, they take a big cut.</p>
              </div>
            </div>

            {/* SkillBridge Card */}
            <div className="pt-8 px-8 pb-0 rounded-3xl bg-emerald-900/10 border border-emerald-500/30 relative overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.05)] flex flex-col h-full">
              <div className="absolute -top-10 -right-4 p-6 opacity-10 font-mono font-black text-9xl text-emerald-500">5%</div>
              <div className="mb-4 inline-block px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold tracking-wide uppercase border border-emerald-500/30 self-start">
                SkillBridge
              </div>
              <div className="mb-8">
                <span className="font-mono text-6xl font-black text-white decoration-emerald-500 underline underline-offset-8">5%</span>
                <p className="text-emerald-400 font-bold mt-2">That&apos;s it. Lowest in India.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-white font-medium">
                  <span className="text-emerald-500 text-lg">✓</span> Keep 95% of every payment
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <span className="text-emerald-500 text-lg">✓</span> No monthly subscription
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <span className="text-emerald-500 text-lg">✓</span> No hidden charges
                </li>
                <li className="flex items-center gap-3 text-white font-medium">
                  <span className="text-emerald-500 text-lg">✓</span> UPI payments supported
                </li>
              </ul>
              
              {/* Highlighted Callout Box */}
              <div className="mt-auto bg-emerald-500/10 border-l-4 border-emerald-500 -mx-8 px-8 py-6 flex items-center">
                <p className="text-emerald-300 font-medium text-base text-left">
                  On a <span className="font-extrabold text-white">₹10,000</span> project — you keep <span className="font-extrabold text-white">₹9,500</span> with us vs <span className="font-bold opacity-70">₹8,000</span> elsewhere.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. LIVE SERVICES PREVIEW ── */}
      <section className="py-24 bg-[#0d1424] px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-sans text-3xl font-bold text-white mb-2">Services available right now</h2>
              <p className="font-sans text-slate-400">Browse work from verified Indian freelancers</p>
            </div>
            <Link href="/explore?tab=services" className="text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 group">
              Browse all services <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingServices ? (
               [1, 2, 3].map(i => (
                 <div key={i} className="h-64 rounded-2xl bg-slate-800 animate-pulse border border-slate-700" />
               ))
            ) : services.length > 0 ? (
               services.map(s => {
                 const label = getCategoryLabel(s.category) || s.category;
                 return (
                 <div key={s.id} className="bg-[#111827] border border-slate-700 rounded-2xl p-6 hover:border-slate-500 transition-colors flex flex-col overflow-hidden">
                    <span className="self-start px-2.5 py-1 mb-4 bg-slate-800 text-slate-300 text-xs font-bold rounded border border-slate-700">
                      {label}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-4 line-clamp-2" title={s.title}>
                      {s.title.length > 60 ? s.title.substring(0, 60) + '...' : s.title}
                    </h3>
                    
                    <div className="mt-auto flex items-center gap-2 mb-5">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                         {s.freelancer?.user?.fullName?.[0] || "?"}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-white truncate">{s.freelancer?.user?.fullName}</p>
                         <div className="flex items-center gap-1 text-xs text-slate-400">
                           ⭐ <span className="text-amber-400 font-bold">{s.freelancer?.user?.rating?.toFixed(1) || "New"}</span> <span className="opacity-70">({s.freelancer?.user?.totalRatings || 0})</span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Starting at</span>
                        <span className="font-mono font-bold text-emerald-400">₹{s.price}</span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-xs text-slate-400">Delivery in</span>
                        <span className="font-medium text-slate-300 text-sm">{s.deliveryDays}d</span>
                      </div>
                    </div>
                    
                    <Link href={`/services/${s.id}`} className="mt-5 w-full block text-center py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors">
                      View Service &rarr;
                    </Link>
                 </div>
               )})
            ) : (
               <>
                 <div className="bg-[#111827] border border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-4">💻</span>
                    <h3 className="text-white font-bold mb-2">Web Development</h3>
                    <p className="text-slate-400 text-sm mb-6">Be the first to offer Web Development services.</p>
                    <Link href="/services/new" className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Create Service &rarr;</Link>
                 </div>
                 <div className="bg-[#111827] border border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-4">🎨</span>
                    <h3 className="text-white font-bold mb-2">Graphic Design</h3>
                    <p className="text-slate-400 text-sm mb-6">Be the first to offer Graphic Design services.</p>
                    <Link href="/services/new" className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Create Service &rarr;</Link>
                 </div>
                 <div className="bg-[#111827] border border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center hidden md:flex">
                    <span className="text-4xl mb-4">✍️</span>
                    <h3 className="text-white font-bold mb-2">Content Writing</h3>
                    <p className="text-slate-400 text-sm mb-6">Be the first to offer Content Writing services.</p>
                    <Link href="/services/new" className="text-indigo-400 font-semibold text-sm hover:text-indigo-300">Create Service &rarr;</Link>
                 </div>
               </>
            )}
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section className="px-4 py-24 border-y border-slate-800 bg-[#111827]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          <div className="lg:col-span-2 space-y-6 text-center lg:text-left">
            <div className="inline-flex justify-center items-center w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)] mb-2">
              <span className="text-4xl">🛡️</span>
            </div>
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Get work done securely in three steps
            </h2>
            <p className="text-lg text-slate-400 font-sans leading-relaxed">
              We handle the friction so you can focus on building. Escrow payments and AI moderation protect every interaction.
            </p>
          </div>

          <div className="lg:col-span-3 space-y-10">
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
            />
          </div>
        </div>
      </section>

      {/* ── 7. TRUST SECTION ── */}
      <section className="px-4 py-24 bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold text-white mb-4">
              Why Indian freelancers choose SkillBridge
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
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

      {/* ── 8. CTA BANNER ── */}
      <section className="px-4 py-24 bg-[#0a0f1e]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-3xl p-10 md:p-16 text-center border border-slate-800">
            <h2 className="font-sans text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Your next opportunity is waiting
            </h2>
            <p className="text-slate-300 mb-10 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Free to join. No subscription. Start in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="w-full sm:w-auto text-center font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl transition-colors shadow-lg">
                Create Free Account
              </Link>
              <Link href="/explore" className="w-full sm:w-auto text-center font-bold bg-transparent border border-slate-700 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl transition-colors">
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="border-t border-slate-800 bg-[#0a0f1e] px-4 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Link href="/" className="font-display font-bold text-xl tracking-tight">
              <span className="text-white">Skill</span>
              <span className="text-emerald-500">Bridge</span>
            </Link>
            <p className="text-slate-500 text-sm mt-2">The freelance marketplace that protects you.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 text-slate-400 text-sm font-medium">
            <Link href="/explore" className="hover:text-white transition-colors">Browse Jobs</Link>
            <Link href="/explore?tab=services" className="hover:text-white transition-colors">Browse Services</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
          <p className="text-slate-600 text-sm font-mono">&copy; {new Date().getFullYear()} SkillBridge. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
