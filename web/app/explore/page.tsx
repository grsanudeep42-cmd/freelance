"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { getCategoryLabel, SERVICE_CATEGORIES } from "../../lib/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicJob {
  id: string;
  title: string;
  type: string;
  budget: number | null;
  creditReward: number | null;
  description: string;
  category: string | null;
  createdAt: string;
  client: { id: string; fullName: string };
  _count: { bids: number };
}

interface PublicService {
  id: string;
  title: string;
  category: string;
  price: number;
  deliveryDays: number;
  createdAt: string;
  freelancer: { id: string; fullName: string; rating: number | null; totalRatings: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JOB_TYPE_STYLES: Record<string, string> = {
  FREE:  "bg-blue-500/12 text-blue-400 border-blue-500/30",
  BID:   "bg-emerald-500/12 text-emerald-400 border-emerald-500/30",
  ADMIN: "bg-violet-500/12 text-violet-400 border-violet-500/30",
};

function daysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, isLoggedIn }: { job: PublicJob; isLoggedIn: boolean }) {
  const router = useRouter();
  function handleApply() {
    if (!isLoggedIn) router.push("/login?redirect=/explore");
    else router.push(`/jobs/${job.id}`);
  }
  return (
    <article className="glass-card card-hover p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${JOB_TYPE_STYLES[job.type] ?? ""}`}>
              {job.type}
            </span>
            {job.category && (
              <span className="text-[11px] text-slate-500">{job.category}</span>
            )}
          </div>
          <h3 className="font-display font-semibold text-white text-base leading-tight line-clamp-1">{job.title}</h3>
        </div>
        <div className="text-right shrink-0">
          {job.budget ? (
            <p className="font-mono font-bold text-emerald-400 text-sm">₹{job.budget.toLocaleString("en-IN")}</p>
          ) : job.creditReward ? (
            <p className="font-mono font-bold text-amber-400 text-sm">⚡ {job.creditReward}</p>
          ) : null}
        </div>
      </div>

      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{job.description}</p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{job.client.fullName}</span>
          <span>·</span>
          <span>{daysAgo(job.createdAt)}</span>
          {job._count.bids > 0 && (
            <><span>·</span><span>{job._count.bids} bid{job._count.bids !== 1 ? "s" : ""}</span></>
          )}
        </div>
        <button
          onClick={handleApply}
          className="btn-primary py-1.5 px-4 text-xs rounded-lg"
        >
          {isLoggedIn ? "View Job →" : "Sign in to Apply"}
        </button>
      </div>
    </article>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, isLoggedIn }: { service: PublicService; isLoggedIn: boolean }) {
  const router = useRouter();
  function handleOrder() {
    if (!isLoggedIn) router.push("/login?redirect=/explore?tab=services");
    else router.push(`/services/${service.id}`);
  }
  const stars = service.freelancer.rating
    ? Math.round(service.freelancer.rating)
    : 0;
  return (
    <article className="glass-card card-hover p-5 flex flex-col gap-3">
      <div>
        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-indigo/12 text-indigo-light border-indigo/30">
          {getCategoryLabel(service.category)}
        </span>
        <h3 className="font-display font-semibold text-white text-base leading-tight line-clamp-1 mt-2">{service.title}</h3>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-white">{service.freelancer.fullName}</span>
        {service.freelancer.rating && (
          <>
            <span>·</span>
            <span className="text-amber-400">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
            <span>({service.freelancer.totalRatings})</span>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs">Starting at</p>
          <p className="font-mono font-bold text-emerald-400 text-base">₹{service.price.toLocaleString("en-IN")}</p>
          <p className="text-slate-500 text-xs">Delivery in {service.deliveryDays}d</p>
        </div>
        <button
          onClick={handleOrder}
          className="btn-primary py-1.5 px-4 text-xs rounded-lg"
        >
          {isLoggedIn ? "Order Now →" : "Sign in to Order"}
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExplorePage(): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams?.get("tab") === "services" ? "services" : "jobs";
  const [tab, setTab] = useState<"jobs" | "services">(initialTab);

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTypeFilter, setJobTypeFilter] = useState<"ALL" | "FREE" | "BID">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetched = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("accessToken");
      setIsLoggedIn(!!stored);
    } catch { /* ignore */ }
  }, []);

  const fetchData = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    setLoading(true);
    try {
      const [jobsRes, servicesRes] = await Promise.all([
        api.get("/jobs/public"),
        api.get("/services/public"),
      ]);
      setJobs((jobsRes.data?.data ?? []) as PublicJob[]);
      setServices((servicesRes.data?.data ?? []) as PublicService[]);
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered lists
  const filteredJobs = jobs.filter((j) => {
    if (jobTypeFilter !== "ALL" && j.type !== jobTypeFilter) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) &&
        !j.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-appBg px-4 py-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Find <span className="gradient-text">Work & Services</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Browse jobs and freelancer services — no account required to look.
            </p>
          </div>
          {!isLoggedIn && (
            <div className="flex gap-3 shrink-0">
              <Link href="/login" className="btn-ghost py-2 px-4 text-sm rounded-xl">Sign In</Link>
              <Link href="/register" className="btn-primary py-2 px-4 text-sm rounded-xl">Join Free</Link>
            </div>
          )}
        </div>

        {/* Platform stats */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { label: `${jobs.length} open jobs` },
            { label: `${services.length} services available` },
            { label: "5% platform fee — lowest in India 🇮🇳" },
          ].map((s) => (
            <span key={s.label} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/4 border border-white/8 text-slate-300">
              {s.label}
            </span>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 border-b border-white/8 pb-4">
          <button
            onClick={() => { setTab("jobs"); setSearch(""); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "jobs" ? "gradient-bg text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            💼 Jobs
          </button>
          <button
            onClick={() => { setTab("services"); setSearch(""); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "services" ? "gradient-bg text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            🛍 Services
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1"
            placeholder={tab === "jobs" ? "Search jobs…" : "Search services…"}
          />
          {tab === "jobs" ? (
            <div className="flex gap-2">
              {(["ALL", "FREE", "BID"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setJobTypeFilter(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    jobTypeFilter === t
                      ? "border-indigo bg-indigo/15 text-indigo-light"
                      : "border-white/8 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-auto min-w-[180px]"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-40 animate-pulse" />
            ))}
          </div>
        ) : tab === "jobs" ? (
          filteredJobs.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500">
              No jobs found. Try a different search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )
        ) : (
          filteredServices.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-500">
              No services found. Try a different search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )
        )}
      </div>
    </main>
  );
}
