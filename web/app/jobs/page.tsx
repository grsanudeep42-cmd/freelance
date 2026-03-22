"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import type { Job, JobType } from "../../lib/jobTypes";

// ─── Filter types ─────────────────────────────────────────────────────────────

type FilterValue = "ALL" | JobType;

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "ALL" },
  { label: "Free", value: "FREE" },
  { label: "Bid", value: "BID" },
  { label: "Admin", value: "ADMIN" },
];

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  const t = type.toUpperCase();
  if (t === "FREE") return "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
  if (t === "BID") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
  if (t === "ADMIN") return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
  return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
}

function formatBudget(job: Job): string {
  if (job.budget !== null && job.budget !== undefined)
    return `₹${job.budget.toLocaleString("en-IN")}`;
  if (job.creditReward !== null && job.creditReward !== undefined)
    return `${job.creditReward} credits`;
  return "Unspecified";
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard(): JSX.Element {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-12" />
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
      </div>
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Job list card ─────────────────────────────────────────────────────────────

function JobCard({ job, userId }: { job: Job; userId?: string }): JSX.Element {
  const type = (job.type ?? "").toString().toUpperCase();
  const status = (job.status ?? "OPEN").toString().toUpperCase();
  const isOwnJob = Boolean(userId && job.clientId === userId);

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col gap-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 shadow-sm transition-all duration-200 hover:scale-[1.015] hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-0.5"
    >
      {/* Title */}
      <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {job.title}
      </h2>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeClass(type)}`}>
          {type || "JOB"}
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
          status === "OPEN"
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
            : "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600"
        }`}>
          {status}
        </span>
        {isOwnJob && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30">
            Your Job
          </span>
        )}
      </div>

      {/* Description snippet */}
      {job.description ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{job.description}</p>
      ) : null}

      {/* Footer row */}
      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{formatBudget(job)}</span>
        <div className="flex items-center gap-3">
          {job.client?.fullName ? (
            <span className="truncate max-w-[100px]">by {job.client.fullName}</span>
          ) : null}
          {typeof job.bidsCount === "number" ? (
            <span>{job.bidsCount} bid{job.bidsCount !== 1 ? "s" : ""}</span>
          ) : null}
          {job.deadlineAt ? (
            <span>Due {formatDeadline(job.deadlineAt)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function JobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadJobs(): Promise<void> {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/jobs");
        const nextJobs = (res.data?.data ?? []) as Job[];
        if (!cancelled) setJobs(nextJobs);
      } catch {
        if (!cancelled) setError("Failed to load jobs. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => { cancelled = true; };
  }, []);

  const filtered =
    filter === "ALL" ? jobs : jobs.filter((j) => j.type?.toString().toUpperCase() === filter);

  const isClient = user?.role === "CLIENT";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">

          {/* Header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Marketplace</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {isClient
                  ? "Browse open opportunities or post your own work."
                  : "Pick up open work and grow your portfolio."}
              </p>
            </div>
            {isClient && (
              <Link
                href="/jobs/new"
                id="post-job-btn"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
              >
                + Post a Job
              </Link>
            )}
          </div>

          {/* Filter bar */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`filter-${opt.value.toLowerCase()}`}
                onClick={() => setFilter(opt.value)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border ${
                  filter === opt.value
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-transparent border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : null}

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : null}

          {/* Job grid */}
          {!loading && !error ? (
            filtered.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl px-6 py-12 text-center shadow-sm">
                <div className="text-4xl mb-4">💼</div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  {filter === "ALL" ? "No open jobs right now." : `No open ${filter} jobs.`}
                </h3>
                {isClient && (
                  <p className="text-sm text-slate-400 mt-1">
                    Be the first to{" "}
                    <Link href="/jobs/new" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 transition-colors">
                      post a job
                    </Link>
                    .
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} userId={user?.id} />
                ))}
              </div>
            )
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
