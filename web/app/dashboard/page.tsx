"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { UserRole } from "../../lib/types";
import type { Job } from "../../lib/jobTypes";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_BADGES: Record<UserRole, { label: string; className: string }> = {
  CLIENT: {
    label: "Client",
    className: "bg-blue-500/20 text-blue-300 border border-blue-500/40"
  },
  FREELANCER: {
    label: "Freelancer",
    className: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
  },
  ADMIN: {
    label: "Admin",
    className: "bg-purple-500/20 text-purple-300 border border-purple-500/40"
  }
};

const DEV_ROLES: UserRole[] = ["CLIENT", "FREELANCER"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeBadgeClass(type: string): string {
  const t = type.toUpperCase();
  if (t === "FREE") return "bg-blue-500/20 text-blue-200 border-blue-500/30";
  if (t === "BID") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  if (t === "ADMIN") return "bg-purple-500/20 text-purple-200 border-purple-500/30";
  return "bg-slate-700/40 text-slate-200 border-slate-600/40";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonList(): JSX.Element {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl bg-[#0b1220] border border-slate-700/60 px-4 py-3 flex items-center gap-3">
          <div className="h-5 w-12 bg-slate-700/60 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-slate-700/60 rounded w-2/3" />
            <div className="h-3 bg-slate-700/40 rounded w-1/3" />
          </div>
        </div>
      ))}
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

  useEffect(() => {
    if (user?.id) {
      setLiveUser(user);
      api.get(`/users/${user.id}`).then(res => {
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
      // Filter client-side for now: Open and type Admin
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
      // Refresh both lists
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
      await fetchActiveJobs(); // Will remove it from "IN_PROGRESS" active jobs if backend changed status
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit work.");
    } finally {
      setSubmittingId(null);
      // Clear form
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

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          
          <header className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-slate-400 text-sm">Welcome back, {displayUser?.fullName?.split(" ")[0] || "User"}.</p>
          </header>

          {authLoading ? (
            <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
              <p className="text-slate-400 animate-pulse">Loading profile…</p>
            </div>
          ) : displayUser ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* LEFT COLUMN: Profile & Actions */}
              <div className="space-y-6 lg:col-span-1">
                {/* User info card */}
                <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold select-none shrink-0">
                        {displayUser.fullName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-lg font-semibold truncate">{displayUser.fullName}</p>
                        <p className="text-slate-400 text-sm truncate">{displayUser.email}</p>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div>
                      {displayUser.rating !== undefined && displayUser.rating !== null && displayUser.totalRatings && displayUser.totalRatings > 0 ? (
                        <p className="text-amber-400 font-bold text-sm mt-1">
                          ⭐ {Number(displayUser.rating).toFixed(1)} <span className="text-slate-500 font-medium text-xs">({displayUser.totalRatings} review{displayUser.totalRatings > 1 ? 's' : ''})</span>
                        </p>
                      ) : (
                        <p className="text-slate-500 font-medium text-sm mt-1 italic">
                          No ratings yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Credits & Earnings */}
                  {displayUser.creditBalance !== undefined && (
                    <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-4 flex flex-col justify-center shadow-inner space-y-1">
                      <span className="text-amber-200/80 text-sm font-medium">Balance & Earnings</span>
                      <span className="text-amber-400 font-bold text-xl tabular-nums">⚡ {displayUser.creditBalance} {isFreelancer ? "credits + earnings" : "credits"}</span>
                    </div>
                  )}
                </section>

                {/* Client Stats snippet */}
                {isClient && (
                  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                    <h2 className="text-white text-sm font-semibold mb-4">Quick Stats</h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Total Posted</span>
                        <span className="font-semibold text-white">{clientStats.total}</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-300">
                        <span>Active</span>
                        <span className="font-semibold">{clientStats.active}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-300">
                        <span>Completed</span>
                        <span className="font-semibold">{clientStats.completed}</span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Actions */}
                <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-3">
                  <Link
                    href="/jobs"
                    className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                  >
                    Browse Jobs Feed
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-slate-700 py-3 text-sm font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/5 transition-colors"
                  >
                    Logout
                  </button>
                </section>

                {/* DEV role switch */}
                {process.env.NODE_ENV === "development" && (
                  <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-3">
                      ⚡ Dev Tools — Switch Role
                    </p>
                    <div className="flex gap-2">
                      {DEV_ROLES.map((r) => (
                        <button
                          key={r}
                          onClick={() => setUserRole(r)}
                          className={
                            displayUser.role === r
                              ? "flex-1 rounded-xl border-2 border-amber-400 bg-amber-400/10 text-amber-300 py-2 text-sm font-semibold cursor-default"
                              : "flex-1 rounded-xl border-2 border-slate-700 bg-transparent text-slate-400 py-2 text-sm font-semibold hover:border-slate-500 transition-colors"
                          }
                        >
                          {r === "CLIENT" ? "Client" : "Freelancer"}
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* RIGHT COLUMN: Scoped content based on role */}
              <div className="space-y-6 lg:col-span-2">

                {/* ─── FREELANCER SECTIONS ───────────────────────────────────────── */}
                {isFreelancer && (
                  <>
                    {/* Available Missions */}
                    <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white text-base font-semibold">Available Missions</h2>
                        <span className="text-slate-400 text-xs">Earn credits</span>
                      </div>

                      {availableLoading ? (
                        <SkeletonList />
                      ) : availableMissions.length === 0 ? (
                        <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-5 text-center">
                          <p className="text-slate-400 text-sm">No new missions available right now.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableMissions.map((m) => (
                            <div key={m.id} className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                              <div>
                                <h3 className="text-white text-sm font-medium">{m.title}</h3>
                                <p className="text-slate-400 text-xs mt-1 line-clamp-2">{m.description}</p>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                                <span className="text-amber-400 text-sm font-bold bg-amber-400/10 px-2.5 py-1 rounded">
                                  {m.creditReward} ⚡
                                </span>
                                <button
                                  onClick={() => handleClaimMission(m.id)}
                                  disabled={claimingId === m.id}
                                  className="flex-1 sm:flex-none rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                >
                                  {claimingId === m.id ? "Claiming…" : "Claim"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* My Active Jobs / Missions */}
                    <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-white text-base font-semibold">My Active Work</h2>
                        {activeJobs.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {activeJobs.length} active
                          </span>
                        )}
                      </div>

                      {activeJobsLoading ? (
                        <SkeletonList />
                      ) : activeJobsError ? (
                        <p className="text-red-400 text-sm">{activeJobsError}</p>
                      ) : activeJobs.length === 0 ? (
                        <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-6 text-center text-sm">
                          <p className="text-slate-500">You have no active jobs.</p>
                          <Link href="/jobs" className="text-blue-400 hover:underline mt-1 inline-block">
                            Browse the marketplace
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeJobs.map((job) => {
                            const isMission = job.type === "ADMIN";
                            return (
                              <div key={job.id} className="rounded-xl bg-[#0b1220] border border-slate-700/60 overflow-hidden">
                                <div className="p-4 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row border-b border-slate-700/30">
                                  <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeBadgeClass(job.type)}`}>
                                      {job.type}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-white text-sm font-medium truncate">{job.title}</p>
                                      {job.client?.fullName && !isMission ? (
                                        <p className="text-slate-500 text-xs mt-0.5">Client: {job.client.fullName}</p>
                                      ) : null}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {isMission && job.creditReward && (
                                      <span className="text-amber-400 text-xs font-bold mr-2">{job.creditReward} ⚡</span>
                                    )}
                                    <Link
                                      href={`/jobs/${job.id}`}
                                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
                                    >
                                      View Details
                                    </Link>
                                  </div>
                                </div>
                                {/* Inline submission form for ADMIN missions */}
                                {isMission && (
                                  <div className="bg-slate-800/30 p-4 space-y-3">
                                    <label className="block text-slate-400 text-xs font-medium">Submit Mission Work</label>
                                    <div className="flex gap-2 items-start flex-col sm:flex-row">
                                      <textarea
                                        value={submissionForms[job.id] || ""}
                                        onChange={(e) => setSubmissionForms({ ...submissionForms, [job.id]: e.target.value })}
                                        placeholder="Link or task output..."
                                        className="w-full flex-1 rounded-lg bg-[#0f172a] text-white px-3 py-2 text-sm outline-none border border-slate-700/60 focus:border-purple-500/50 resize-none h-10 min-h-[40px]"
                                        disabled={submittingId === job.id}
                                      />
                                      <button
                                        onClick={() => handleSubmitWork(job.id)}
                                        disabled={submittingId === job.id}
                                        className="w-full sm:w-auto shrink-0 rounded-lg bg-purple-600 px-4 py-2 h-10 text-sm font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
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

                {/* ─── CLIENT SECTIONS ───────────────────────────────────────────── */}
                {isClient && (
                  <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-white text-base font-semibold">My Posted Jobs</h2>
                      <Link
                        href="/jobs/new"
                        className="rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1.5 text-xs font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        + Post Job
                      </Link>
                    </div>

                    {postedJobsLoading ? (
                      <SkeletonList />
                    ) : postedJobsError ? (
                      <p className="text-red-400 text-sm">{postedJobsError}</p>
                    ) : postedJobs.length === 0 ? (
                      <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-8 text-center">
                        <p className="text-slate-400 text-sm mb-3">You haven't posted any jobs yet.</p>
                        <Link
                          href="/jobs/new"
                          className="inline-block rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                        >
                          Post your first job
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {postedJobs.map((job) => (
                          <div key={job.id} className="rounded-xl bg-[#0b1220] border border-slate-700/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-white text-sm font-medium truncate mb-1.5">{job.title}</h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeBadgeClass(job.type)}`}>
                                  {job.type}
                                </span>
                                <span className="text-slate-400 text-xs">·</span>
                                <span className="text-slate-300 text-xs font-medium">
                                  Status: {job.status}
                                </span>
                                {job.type === "BID" && job._count && (
                                  <>
                                    <span className="text-slate-400 text-xs">·</span>
                                    <span className="text-blue-300 text-xs font-medium">
                                      {job._count.bids} bid{job._count.bids !== 1 ? "s" : ""}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Link
                              href={`/jobs/${job.id}`}
                              className="shrink-0 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:border-slate-500 hover:bg-slate-700 transition-colors self-start sm:self-auto"
                            >
                              Manage Job
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* ─── TRANSACTIONS HISTORY (CROSS-ROLE) ─────────────────────────── */}
                <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white text-base font-semibold">Recent Transactions</h2>
                  </div>
                  {transactionsLoading ? (
                    <SkeletonList />
                  ) : transactions.length === 0 ? (
                    <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-6 text-center text-sm">
                      <p className="text-slate-500">No recent transactions.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((t: any) => (
                        <div key={t.id} className="rounded-xl bg-[#0b1220] border border-slate-700/60 p-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-white text-sm font-medium">{t.description}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{new Date(t.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-sm font-bold ${t.type === "CREDIT_SPENT" || t.type === "PLATFORM_FEE" ? "text-red-400" : "text-emerald-400"}`}>
                              {t.type === "CREDIT_SPENT" || t.type === "PLATFORM_FEE" ? "-" : "+"}
                              {t.amount ? t.amount : t.credits} {t.amount ? "INR" : "⚡"}
                            </span>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-0.5">{t.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            </div>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
