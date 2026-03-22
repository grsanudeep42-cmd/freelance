"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
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

function typeBadgeClass(type: string): string {
  const t = type.toUpperCase();
  if (t === "FREE") return "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
  if (t === "BID") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
  if (t === "ADMIN") return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
  return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
}

function daysAgo(date: string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job, isLoggedIn }: { job: PublicJob; isLoggedIn: boolean }) {
  const router = useRouter();
  function handleApply() {
    if (!isLoggedIn) router.push("/login?redirect=/explore");
    else router.push(`/jobs/${job.id}`);
  }
  return (
    <article className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeBadgeClass(job.type || "JOB")}`}>
              {job.type}
            </span>
            {job.category && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{job.category}</span>
            )}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight line-clamp-1">{job.title}</h3>
        </div>
        <div className="text-right shrink-0">
          {job.budget ? (
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{job.budget.toLocaleString("en-IN")}</p>
          ) : job.creditReward ? (
            <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">⚡ {job.creditReward}</p>
          ) : null}
        </div>
      </div>

      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">{job.description}</p>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[80px]">{job.client.fullName}</span>
          <span>·</span>
          <span>{daysAgo(job.createdAt)}</span>
          {job._count.bids > 0 && (
            <><span>·</span><span>{job._count.bids} bid{job._count.bids !== 1 ? "s" : ""}</span></>
          )}
        </div>
        <button
          onClick={handleApply}
          className={
            isLoggedIn 
              ? "bg-emerald-600 hover:bg-emerald-500 shrink-0 text-white py-1.5 px-4 text-xs rounded-lg font-semibold transition-colors"
              : "border border-slate-200 dark:border-slate-700 shrink-0 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 px-4 text-xs rounded-lg font-semibold transition-colors"
          }
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
    <article className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col gap-3">
      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30">
          {getCategoryLabel(service.category)}
        </span>
        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight line-clamp-1 mt-2">{service.title}</h3>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="font-bold text-slate-900 dark:text-white">{service.freelancer.fullName}</span>
        {service.freelancer.rating && (
          <>
            <span>·</span>
            <span className="text-amber-500">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
            <span>({service.freelancer.totalRatings})</span>
          </>
        )}
      </div>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Starting at</p>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">₹{service.price.toLocaleString("en-IN")}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Delivery in {service.deliveryDays}d</p>
        </div>
        <button
          onClick={handleOrder}
          className={
            isLoggedIn
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 py-1.5 px-4 text-xs rounded-lg font-semibold transition-colors"
              : "border border-slate-200 dark:border-slate-700 shrink-0 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 px-4 text-xs rounded-lg font-semibold transition-colors"
          }
        >
          {isLoggedIn ? "Order Now →" : "Sign in to Order"}
        </button>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ExploreContent() {
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
    <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Find Work &amp; Services
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Browse jobs and freelancer services — no account required to look.
            </p>
          </div>
          {!isLoggedIn && (
            <div className="flex gap-3 shrink-0">
              <Link href="/login" className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors py-2 px-4 text-sm font-semibold">Sign In</Link>
              <Link href="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl transition-colors font-semibold text-sm shadow-sm">Join Free</Link>
            </div>
          )}
        </div>

        {/* Platform stats */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: `${jobs.length} open jobs` },
            { label: `${services.length} services available` },
            { label: "5% platform fee — lowest in India 🇮🇳" },
          ].map((s) => (
            <span key={s.label} className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 rounded-full px-3 py-1.5 text-xs font-semibold">
              {s.label}
            </span>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => { setTab("jobs"); setSearch(""); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "jobs" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            💼 Jobs
          </button>
          <button
            onClick={() => { setTab("services"); setSearch(""); }}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "services" 
                ? "bg-emerald-600 text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
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
            className={`${inputClass} flex-1`}
            placeholder={tab === "jobs" ? "Search jobs…" : "Search services…"}
          />
          {tab === "jobs" ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 shrink-0">
              {(["ALL", "FREE", "BID"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setJobTypeFilter(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                    jobTypeFilter === t
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
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
              className={`${inputClass} w-full sm:w-auto min-w-[200px] shrink-0 dark:[color-scheme:dark]`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-48 animate-pulse shadow-sm border border-slate-200 dark:border-slate-800" />
            ))}
          </div>
        ) : tab === "jobs" ? (
          filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl px-6 py-12 text-center shadow-sm">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No jobs found.</h3>
              <p className="mt-1 text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} isLoggedIn={isLoggedIn} />
              ))}
            </div>
          )
        ) : (
          filteredServices.length === 0 ? (
             <div className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl px-6 py-12 text-center shadow-sm">
              <div className="text-4xl mb-4">🛍</div>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No services found.</h3>
              <p className="mt-1 text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

export default function ExplorePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f1a]" />}>
      <ExploreContent />
    </Suspense>
  );
}
