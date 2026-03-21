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
  if (t === "FREE") return "bg-blue-500/20 text-blue-200 border-blue-500/30";
  if (t === "BID") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  if (t === "ADMIN") return "bg-purple-500/20 text-purple-200 border-purple-500/30";
  return "bg-slate-700/40 text-slate-200 border-slate-600/40";
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
    <div className="rounded-xl bg-[#1e293b] border border-slate-700/60 p-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-600/60 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-600/40 rounded-full w-12" />
        <div className="h-5 bg-slate-600/40 rounded-full w-16" />
      </div>
      <div className="h-3 bg-slate-600/40 rounded w-full" />
      <div className="h-3 bg-slate-600/40 rounded w-2/3" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-600/40 rounded w-1/4" />
        <div className="h-3 bg-slate-600/40 rounded w-1/4" />
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
      className="group flex flex-col gap-3 rounded-xl bg-[#1e293b] border border-slate-700/60 p-5 transition-all duration-150 hover:scale-[1.015] hover:shadow-xl hover:border-slate-500/70"
    >
      {/* Title */}
      <h2 className="text-white text-base font-bold leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
        {job.title}
      </h2>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeBadgeClass(type)}`}>
          {type || "JOB"}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-900/40 text-slate-300 border-slate-600/40">
          {status}
        </span>
        {isOwnJob && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/20 text-amber-200 border-amber-500/30">
            Your Job
          </span>
        )}
      </div>

      {/* Description snippet */}
      {job.description ? (
        <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>
      ) : null}

      {/* Footer row */}
      <div className="mt-auto flex items-center justify-between gap-3 text-xs text-slate-400">
        <span className="font-medium text-slate-300">{formatBudget(job)}</span>
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
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Marketplace</h1>
              <p className="mt-1 text-slate-400 text-sm">
                {isClient
                  ? "Browse open opportunities or post your own work."
                  : "Pick up open work and grow your portfolio."}
              </p>
            </div>
            {isClient && (
              <Link
                href="/jobs/new"
                id="post-job-btn"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
              >
                + Post a Job
              </Link>
            )}
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`filter-${opt.value.toLowerCase()}`}
                onClick={() => setFilter(opt.value)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors border ${
                  filter === opt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          ) : null}

          {/* Loading skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : null}

          {/* Job grid */}
          {!loading && !error ? (
            filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-[#1e293b] px-6 py-10 text-center">
                <p className="text-slate-300 font-medium">
                  {filter === "ALL" ? "No open jobs right now." : `No open ${filter} jobs.`}
                </p>
                {isClient && (
                  <p className="mt-2 text-slate-500 text-sm">
                    Be the first to{" "}
                    <Link href="/jobs/new" className="text-blue-400 hover:underline">
                      post a job
                    </Link>
                    .
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
