"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { UserRole } from "../../lib/types";
import type { Job } from "../../lib/jobTypes";
import { ProfileStrength } from "../../components/ProfileStrength";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGES: Record<UserRole, { label: string; className: string }> = {
  CLIENT: {
    label: "Client",
    className: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30",
  },
  FREELANCER: {
    label: "Freelancer",
    className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30",
  },
};

const DEV_ROLES: UserRole[] = ["CLIENT", "FREELANCER"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  const t = type.toUpperCase();
  if (t === "FREE") return "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
  if (t === "BID") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
  if (t === "ADMIN") return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
  return "bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-600/40";
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "OPEN") return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
  if (s === "IN_PROGRESS") return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
  if (s === "COMPLETED") return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
  return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonList(): JSX.Element {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-xl h-16" />
      ))}
    </div>
  );
}

function KpiCard({
  icon, label, value, subtext, accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtext: string;
  accent: "amber" | "yellow" | "emerald" | "blue";
}): JSX.Element {
  const colors = {
    amber:   "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 hover:border-amber-300 dark:hover:border-amber-500/40",
    yellow:  "border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/5 hover:border-yellow-300 dark:hover:border-yellow-500/40",
    emerald: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 hover:border-emerald-300 dark:hover:border-emerald-500/40",
    blue:    "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5 hover:border-blue-300 dark:hover:border-blue-500/40",
  };
  const valueColors = {
    amber:   "text-amber-600 dark:text-amber-400",
    yellow:  "text-yellow-600 dark:text-yellow-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue:    "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className={`border rounded-2xl p-5 transition-colors ${colors[accent]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <p className={`text-3xl font-bold font-mono ${valueColors[accent]}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{subtext}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const { user, logout, setUserRole, isLoading: authLoading } = useAuth();

  // 1. My Active Jobs (FREELANCER)
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [activeJobsLoading, setActiveJobsLoading] = useState(false);
  const [activeJobsError, setActiveJobsError] = useState<string | null>(null);

  // 2. Available Missions (FREELANCER)
  const [availableMissions, setAvailableMissions] = useState<Job[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // 3. My Posted Jobs (CLIENT)
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [postedJobsLoading, setPostedJobsLoading] = useState(false);
  const [postedJobsError, setPostedJobsError] = useState<string | null>(null);

  // 4. My Transactions (Cross-Role)
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Submission State for Active Admin Missions
  const [submissionForms, setSubmissionForms] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Stats derived from postedJobs
  const clientStats = {
    total: postedJobs.length,
    active: postedJobs.filter((j) => j.status === "OPEN" || j.status === "IN_PROGRESS").length,
    completed: postedJobs.filter((j) => j.status === "COMPLETED").length,
  };

  // 5. Live User Data (for fresh ratings)
  const [liveUser, setLiveUser] = useState<any>(user);
  const [bannerDismissed, setBannerDismissed] = useState(true);

  useEffect(() => {
    setBannerDismissed(localStorage.getItem("profileBannerDismissed") === "true");
  }, []);

  const dismissBanner = () => {
    localStorage.setItem("profileBannerDismissed", "true");
    setBannerDismissed(true);
  };

  useEffect(() => {
    if (user?.id) {
      setLiveUser(user);
      api.get(`/profile/me`).then(res => {
        const freshUser = res.data?.data;
        if (freshUser) {
          if (freshUser.role === "CUSTOMER") freshUser.role = "CLIENT";
          setLiveUser((prev: any) => prev ? { ...prev, ...freshUser } : freshUser);

          try {
            const storedItem = localStorage.getItem("user");
            if (storedItem) {
              const currentStored = JSON.parse(storedItem);
              localStorage.setItem("user", JSON.stringify({ ...currentStored, ...freshUser }));
            }
          } catch {
            // ignore JSON parse errors
          }
        }
      }).catch(console.error);
    } else {
      setLiveUser(null);
    }
  }, [user]);

  // ─── Fetchers ────────────────────────────────────────────────────────────────

  const fetchActiveJobs = useCallback(async () => {
    try {
      setActiveJobsLoading(true);
      const res = await api.get("/jobs/my-active");
      setActiveJobs((res.data?.data ?? []) as Job[]);
    } catch {
      setActiveJobsError("Could not load active jobs.");
    } finally {
      setActiveJobsLoading(false);
    }
  }, []);

  const fetchAvailableMissions = useCallback(async () => {
    try {
      setAvailableLoading(true);
      const res = await api.get("/jobs");
      const allJobs = (res.data?.data ?? []) as Job[];
      setAvailableMissions(
        allJobs.filter((j) => j.type === "ADMIN" && j.status === "OPEN")
      );
    } catch {
      // ignore
    } finally {
      setAvailableLoading(false);
    }
  }, []);

  const fetchPostedJobs = useCallback(async () => {
    try {
      setPostedJobsLoading(true);
      const res = await api.get("/jobs/my-posted");
      setPostedJobs((res.data?.data ?? []) as Job[]);
    } catch {
      setPostedJobsError("Could not load your posted jobs.");
    } finally {
      setPostedJobsLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const res = await api.get("/payments/my-transactions");
      setTransactions(res.data?.data || []);
    } catch {
      // ignore
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading || !user) return;

    fetchTransactions();

    if (user.role === "FREELANCER") {
      fetchActiveJobs();
      fetchAvailableMissions();
    } else if (user.role === "CLIENT") {
      fetchPostedJobs();
    }
  }, [authLoading, user, fetchActiveJobs, fetchAvailableMissions, fetchPostedJobs, fetchTransactions]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  async function handleClaimMission(jobId: string) {
    try {
      setClaimingId(jobId);
      await api.post("/admin-jobs/claim", { jobId });
      await Promise.all([fetchAvailableMissions(), fetchActiveJobs()]);
    } catch (err) {
      alert("Failed to claim mission.");
    } finally {
      setClaimingId(null);
    }
  }

  async function handleSubmitWork(jobId: string) {
    const submission = submissionForms[jobId] || "";
    if (submission.trim().length < 5) {
      alert("Submission must be at least 5 characters.");
      return;
    }

    try {
      setSubmittingId(jobId);
      await api.post("/admin-jobs/submit", { jobId, submission: submission.trim() });
      await fetchActiveJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit work.");
    } finally {
      setSubmittingId(null);
      setSubmissionForms((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    }
  }

  // ─── UI Variables ────────────────────────────────────────────────────────────

  const displayUser = liveUser || user;
  const badge = displayUser?.role && ROLE_BADGES[displayUser.role as UserRole]
    ? ROLE_BADGES[displayUser.role as UserRole]
    : ROLE_BADGES.CLIENT;
  const isFreelancer = displayUser?.role === "FREELANCER";
  const isClient = displayUser?.role === "CLIENT";
  const isProfileIncomplete = isFreelancer
    ? (displayUser?.freelancerProfile?.profileStrength ?? 0) < 60
    : !displayUser?.bio;

  const userRating = displayUser?.rating !== undefined && displayUser?.rating !== null
    ? Number(displayUser.rating)
    : 0;
  const totalRatings = displayUser?.totalRatings ?? 0;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">

          {/* ═══════════════════════════════════════════════════════════════
              SECTION 1 — PAGE HEADER
              ═══════════════════════════════════════════════════════════════ */}
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Welcome back, {displayUser?.fullName?.split(" ")[0] || "User"}.
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
              {badge.label}
            </span>
          </header>

          {authLoading ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <p className="text-slate-500 dark:text-slate-400 animate-pulse">Loading profile…</p>
            </div>
          ) : displayUser ? (
            <>
              {/* ═══════════════════════════════════════════════════════════
                  SECTION 2 — KPI STRIP
                  ═══════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {isFreelancer ? (
                  <>
                    <KpiCard
                      icon="⚡"
                      label="Credits"
                      value={displayUser.creditBalance ?? 0}
                      subtext="Available balance"
                      accent="amber"
                    />
                    <KpiCard
                      icon="⭐"
                      label="Rating"
                      value={userRating > 0 ? userRating.toFixed(1) : "—"}
                      subtext={`${totalRatings} review${totalRatings !== 1 ? "s" : ""}`}
                      accent="yellow"
                    />
                    <KpiCard
                      icon="🔥"
                      label="Active Work"
                      value={activeJobs.length}
                      subtext="Jobs in progress"
                      accent="emerald"
                    />
                    <KpiCard
                      icon="🎯"
                      label="Missions"
                      value={availableMissions.length}
                      subtext="Available to claim"
                      accent="blue"
                    />
                  </>
                ) : (
                  <>
                    <KpiCard
                      icon="📋"
                      label="Total Posted"
                      value={clientStats.total}
                      subtext="All time"
                      accent="blue"
                    />
                    <KpiCard
                      icon="🟢"
                      label="Active"
                      value={clientStats.active}
                      subtext="In progress"
                      accent="emerald"
                    />
                    <KpiCard
                      icon="✅"
                      label="Completed"
                      value={clientStats.completed}
                      subtext="Successfully done"
                      accent="amber"
                    />
                    <KpiCard
                      icon="💳"
                      label="Transactions"
                      value={transactions.length}
                      subtext="Payment history"
                      accent="blue"
                    />
                  </>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════════
                  SECTION 3 — PROFILE INCOMPLETE BANNER
                  ═══════════════════════════════════════════════════════════ */}
              {!bannerDismissed && isProfileIncomplete && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-200">
                      Complete your profile to get hired faster.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href="/profile/edit" className="text-amber-600 dark:text-amber-400 text-sm font-bold hover:text-amber-500 dark:hover:text-amber-300 transition-colors">
                      Edit Profile &rarr;
                    </Link>
                    <button onClick={dismissBanner} className="text-amber-500 hover:text-amber-400 text-lg">&times;</button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════
                  SECTION 4 — TWO COLUMN GRID
                  ═══════════════════════════════════════════════════════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

                {/* ── MAIN COLUMN (60%) ──────────────────────────────────── */}
                <div className="space-y-5 lg:col-span-3">

                  {/* ─── FREELANCER: Available Missions ──────────────────── */}
                  {isFreelancer && (
                    <>
                      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            🎯 Available Missions
                          </h2>
                          <span className="text-xs text-slate-400">Earn credits ⚡</span>
                        </div>

                        {availableLoading ? (
                          <SkeletonList />
                        ) : availableMissions.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">🎯</div>
                            <p className="text-sm text-slate-400 dark:text-slate-500">No missions available right now.</p>
                            <p className="text-xs text-slate-400 mt-1">Check back soon — new missions posted regularly.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {availableMissions.map((m) => (
                              <div key={m.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{m.title}</h3>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                  <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-mono text-sm font-bold px-2.5 py-1 rounded-lg">
                                    {m.creditReward} ⚡
                                  </span>
                                  <button
                                    onClick={() => handleClaimMission(m.id)}
                                    disabled={claimingId === m.id}
                                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
                                  >
                                    {claimingId === m.id ? "Claiming…" : "Claim"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      {/* ─── FREELANCER: My Active Work ──────────────────── */}
                      <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="font-semibold text-slate-900 dark:text-white">My Active Work</h2>
                          {activeJobs.length > 0 && (
                            <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {activeJobs.length} active
                            </span>
                          )}
                        </div>

                        {activeJobsLoading ? (
                          <SkeletonList />
                        ) : activeJobsError ? (
                          <p className="text-red-500 dark:text-red-400 text-sm">{activeJobsError}</p>
                        ) : activeJobs.length === 0 ? (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 text-center">
                            <div className="text-3xl mb-3">💼</div>
                            <p className="text-sm text-slate-400">No active jobs yet.</p>
                            <Link href="/jobs" className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold mt-2 inline-block hover:text-emerald-500 transition-colors">
                              Browse the marketplace →
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeJobs.map((job) => {
                              const isMission = job.type === "ADMIN";
                              return (
                                <div key={job.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden">
                                  {/* Top row */}
                                  <div className="p-4 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                      <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeClass(job.type)}`}>
                                        {job.type}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.title}</p>
                                        {job.client?.fullName && !isMission ? (
                                          <p className="text-xs text-slate-400 mt-0.5">Client: {job.client.fullName}</p>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isMission && job.creditReward && (
                                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold mr-2">{job.creditReward} ⚡</span>
                                      )}
                                      <Link
                                        href={`/jobs/${job.id}`}
                                        className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg px-3 py-1.5 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                      >
                                        View Details
                                      </Link>
                                    </div>
                                  </div>
                                  {/* ADMIN mission submission form */}
                                  {isMission && (
                                    <div className="bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 p-4 space-y-2">
                                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Submit Mission Work</label>
                                      <div className="flex gap-2 items-start flex-col sm:flex-row">
                                        <textarea
                                          value={submissionForms[job.id] || ""}
                                          onChange={(e) => setSubmissionForms({ ...submissionForms, [job.id]: e.target.value })}
                                          placeholder="Link or task output..."
                                          className="w-full flex-1 rounded-lg bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white px-3 py-2 text-sm outline-none border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 resize-none h-10 min-h-[40px] transition-colors"
                                          disabled={submittingId === job.id}
                                        />
                                        <button
                                          onClick={() => handleSubmitWork(job.id)}
                                          disabled={submittingId === job.id}
                                          className="w-full sm:w-auto shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 h-10 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                                        >
                                          {submittingId === job.id ? "Submitting…" : "Submit"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </section>
                    </>
                  )}

                  {/* ─── CLIENT: My Posted Jobs ─────────────────────────── */}
                  {isClient && (
                    <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-slate-900 dark:text-white">My Posted Jobs</h2>
                        <Link
                          href="/jobs/new"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                        >
                          + Post Job
                        </Link>
                      </div>

                      {postedJobsLoading ? (
                        <SkeletonList />
                      ) : postedJobsError ? (
                        <p className="text-red-500 dark:text-red-400 text-sm">{postedJobsError}</p>
                      ) : postedJobs.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-10 text-center">
                          <p className="text-sm text-slate-400">No jobs posted yet.</p>
                          <p className="text-xs text-slate-400 mt-1">Post your first job and start finding talent.</p>
                          <Link
                            href="/jobs/new"
                            className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 py-2.5 font-semibold text-sm transition-colors"
                          >
                            Post your first job
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {postedJobs.map((job) => (
                            <div key={job.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1.5">{job.title}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeBadgeClass(job.type)}`}>
                                    {job.type}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass(job.status)}`}>
                                    {job.status}
                                  </span>
                                  {job.type === "BID" && job._count && (
                                    <span className="text-blue-600 dark:text-blue-300 text-xs font-medium">
                                      {job._count.bids} bid{job._count.bids !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/jobs/${job.id}`}
                                className="shrink-0 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg px-3 py-1.5 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors self-start sm:self-auto"
                              >
                                Manage →
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  )}

                  {/* ─── BOTH: Recent Transactions ──────────────────────── */}
                  <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Recent Transactions</h2>
                    {transactionsLoading ? (
                      <SkeletonList />
                    ) : transactions.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-6 text-center">
                        <div className="text-3xl mb-3">💳</div>
                        <p className="text-sm text-slate-400">No transactions yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((t: any) => (
                          <div key={t.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{t.description}</p>
                              <p className="font-mono text-xs text-slate-400 mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`font-mono text-sm font-bold ${t.type === "CREDIT_SPENT" || t.type === "PLATFORM_FEE" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {t.type === "CREDIT_SPENT" || t.type === "PLATFORM_FEE" ? "-" : "+"}
                                {t.amount ? t.amount : t.credits} {t.amount ? "INR" : "⚡"}
                              </span>
                              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{t.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </div>

                {/* ── SIDE COLUMN (40%) ───────────────────────────────────── */}
                <div className="space-y-4 lg:col-span-2">

                  {/* Profile Card */}
                  <section className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 shadow-sm rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg select-none shrink-0">
                        {displayUser.fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 dark:text-white truncate">{displayUser.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayUser.email}</p>
                        <Link href="/profile/edit" className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium mt-1 inline-block transition-colors">
                          Edit Profile →
                        </Link>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                      {totalRatings > 0 ? (
                        <p className="text-amber-500 font-bold text-sm">
                          ⭐ {userRating.toFixed(1)}{" "}
                          <span className="text-slate-400 text-xs font-medium">
                            ({totalRatings} review{totalRatings > 1 ? "s" : ""})
                          </span>
                        </p>
                      ) : (
                        <p className="text-slate-400 text-sm italic">No ratings yet</p>
                      )}
                    </div>

                    {/* Profile strength (freelancer only) */}
                    {isFreelancer && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                        <ProfileStrength score={displayUser.freelancerProfile?.profileStrength ?? 0} />
                      </div>
                    )}

                    {/* Credits */}
                    {displayUser.creditBalance !== undefined && (
                      <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/70">
                          Balance
                        </span>
                        <p className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                          ⚡ {displayUser.creditBalance}{" "}
                          <span className="text-sm font-normal text-amber-500 dark:text-amber-400/70">credits</span>
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Actions */}
                  <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
                    <Link
                      href="/jobs"
                      className="block text-center w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                    >
                      Browse Jobs Feed
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full mt-3 rounded-xl border border-red-200 dark:border-red-500/30 py-2.5 text-sm font-semibold text-red-500 dark:text-red-400 hover:border-red-300 dark:hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all"
                    >
                      Logout
                    </button>
                  </section>

                  {/* Client stats (side) */}
                  {isClient && (
                    <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Quick Stats</h2>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Total Posted</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{clientStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Active</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{clientStats.active}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Completed</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{clientStats.completed}</span>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* DEV TOOLS */}
                  {process.env.NODE_ENV === "development" && (
                    <section className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
                      <p className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wide mb-3">
                        ⚡ Dev Tools — Switch Role
                      </p>
                      <div className="flex gap-2">
                        {DEV_ROLES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setUserRole(r)}
                            className={
                              displayUser.role === r
                                ? "flex-1 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 py-2 text-sm font-semibold cursor-default"
                                : "flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-500 dark:text-slate-400 py-2 text-sm font-semibold hover:border-slate-400 dark:hover:border-white/25 transition-colors"
                            }
                          >
                            {r === "CLIENT" ? "Client" : "Freelancer"}
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

              </div>
            </>
          ) : null}

        </div>
      </main>
    </ProtectedRoute>
  );
}
