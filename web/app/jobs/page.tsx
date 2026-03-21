"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

type Job = {
  id: string;
  title: string;
  type: string;
  budget: number | null;
  creditReward?: number | null;
  status?: string;
  clientId: string;
  client?: { id: string; fullName: string };
};

export default function JobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        if (!cancelled) setError("Failed to load jobs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold">Jobs</h1>
            <p className="mt-2 text-slate-300">
              {user?.role === "CLIENT"
                ? "Browse marketplace jobs. Post new work from this page."
                : "Open opportunities waiting for you."}
            </p>
          </div>

          {error ? <p className="text-red-400">{error}</p> : null}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#1e293b] border border-slate-700/60 p-5 animate-pulse"
                >
                  <div className="h-4 bg-slate-600/60 rounded w-3/4" />
                  <div className="h-3 bg-slate-600/60 rounded mt-3 w-1/3" />
                  <div className="h-3 bg-slate-600/60 rounded mt-3 w-2/3" />
                  <div className="h-3 bg-slate-600/60 rounded mt-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error ? (
            <>
              {!jobs.length ? (
                <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
                  <p className="text-slate-300">No open jobs right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => {
                    const type = (job.type ?? "").toString().toUpperCase();
                    const status = (job.status ?? "OPEN").toString();
                    const budgetOrReward =
                      job.budget !== null && job.budget !== undefined
                        ? `Budget: ${job.budget}`
                        : job.creditReward !== null && job.creditReward !== undefined
                          ? `Reward: ${job.creditReward}`
                          : "Budget: Not set";

                    // Role-based badge
                    const isOwnJob = user?.role === "CLIENT" && job.clientId === user.id;
                    const isFreelancer = user?.role === "FREELANCER";

                    return (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="block rounded-xl bg-[#1e293b] border border-slate-700/60 p-5 transition-all duration-150 hover:scale-[1.02] hover:shadow-xl hover:border-slate-600"
                      >
                        <div className="space-y-3">
                          <h2 className="text-white text-lg font-bold leading-snug line-clamp-2">
                            {job.title}
                          </h2>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={
                                type === "FREE"
                                  ? "px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-500/30"
                                  : type === "BID"
                                    ? "px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                                    : "px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/30"
                              }
                            >
                              {type || "BID"}
                            </span>

                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-900/30 text-slate-200 border border-slate-700/50">
                              {status}
                            </span>

                            {/* Role-based badge */}
                            {isOwnJob ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                Your Job
                              </span>
                            ) : isFreelancer && status === "OPEN" ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-500/30">
                                Available
                              </span>
                            ) : null}
                          </div>

                          <p className="text-slate-300 text-sm">{budgetOrReward}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
