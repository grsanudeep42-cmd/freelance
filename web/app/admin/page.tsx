"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import type { Job } from "../../lib/jobTypes";

// ─── Interfaces ───────────────────────────────────────────────────────────────

type PlatformStats = {
  totalUsers: number;
  totalJobs: number;
  totalBids: number;
  totalCreditsDistributed: number;
  pendingSubmissions: number;
};

type AdminSubmission = {
  id: string; // adminJobId
  job: { id: string; title: string; creditReward: number };
  assignedUser: { id: string; fullName: string };
};

type AiFlag = {
  id: string;
  user: { id: string; fullName: string; email: string };
  reason: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
};

// ─── Component: Admin Page ───────────────────────────────────────────────────

export default function AdminPage(): JSX.Element {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Stats State
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Lists State
  const [missions, setMissions] = useState<Job[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<AdminSubmission[]>([]);
  const [aiFlags, setAiFlags] = useState<AiFlag[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);

  // Create Mission Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formReward, setFormReward] = useState("10");
  const [formDeadline, setFormDeadline] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Approval State
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setStatsLoading(true);
      setMissionsLoading(true);
      const [statsRes, missRes, subRes, flagRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/missions"),
        api.get("/admin/submissions"),
        api.get("/admin/flags")
      ]);
      setStats((statsRes.data?.data as PlatformStats) ?? null);
      setMissions((missRes.data?.data ?? []) as Job[]);
      setPendingSubmissions((subRes.data?.data ?? []) as AdminSubmission[]);
      setAiFlags((flagRes.data?.data ?? []) as AiFlag[]);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setStatsLoading(false);
      setMissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchDashboardData();
    }
  }, [authLoading, user?.role, fetchDashboardData]);

  // Guard: Not an admin? Get out.
  useEffect(() => {
    if (!authLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  if (authLoading || (user && user.role !== "ADMIN")) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] flex flex-col px-4 py-10 items-center justify-center">
        <p className="text-slate-400 dark:text-slate-500 animate-pulse text-sm font-medium">Loading admin panel…</p>
      </main>
    );
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleCreateMission(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const t = formTitle.trim();
    const d = formDesc.trim();
    const rew = Number(formReward);

    if (t.length < 5) return setFormError("Title must be at least 5 characters.");
    if (d.length < 10) return setFormError("Description must be at least 10 characters.");
    if (!Number.isFinite(rew) || rew < 1 || !Number.isInteger(rew)) {
      return setFormError("Reward must be a whole positive number.");
    }

    try {
      setFormBusy(true);
      await api.post("/jobs", {
        title: t,
        description: d,
        type: "ADMIN",
        creditReward: rew,
        deadlineAt: formDeadline ? new Date(formDeadline).toISOString() : undefined,
      });
      setFormSuccess("Admin mission created successfully!");
      setFormTitle("");
      setFormDesc("");
      setFormReward("10");
      setFormDeadline("");
      await fetchDashboardData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create mission.");
    } finally {
      setFormBusy(false);
    }
  }

  async function handleApprove(jobId: string) {
    try {
      setApprovingId(jobId);
      await api.post("/admin-jobs/approve", { jobId });
      await fetchDashboardData();
    } catch (err) {
      alert("Failed to approve mission.");
    } finally {
      setApprovingId(null);
    }
  }

  async function handleResolveFlag(flagId: string) {
    try {
      await api.patch(`/admin/flags/${flagId}/resolve`);
      await fetchDashboardData();
    } catch (err) {
      alert("Failed to resolve flag.");
    }
  }

  // ─── Derived UI ─────────────────────────────────────────────────────────────

  const inputClass =
    "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── HEADER CARD ── */}
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Console</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Platform control and mission management.</p>
            </div>
            <span className="bg-purple-50 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full shrink-0">
              ⚡ Admin
            </span>
          </header>

          {/* ── KPI STRIP ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statsLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl h-[104px] animate-pulse" />
              ))
            ) : stats ? (
              <>
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Users</p>
                  <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Jobs</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.totalJobs}</p>
                </div>
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Bids</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.totalBids}</p>
                </div>
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Credits</p>
                  <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.totalCreditsDistributed}</p>
                </div>
                <div className={`bg-white dark:bg-[#111827] rounded-2xl shadow-sm p-5 transition-colors border ${
                  aiFlags.length > 0 ? "border-red-200 dark:border-red-500/30" : "border-slate-200 dark:border-slate-800"
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Flags</p>
                  <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400">{aiFlags.length}</p>
                </div>
              </>
            ) : (
              <p className="text-red-400 text-sm col-span-full">Failed to load stats.</p>
            )}
          </div>

          {/* ── TWO COLUMN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* ── LEFT: Create Mission Card ── */}
            <div className="lg:col-span-1">
              <section className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl shadow-sm p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Mission</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dispatch a task to the community.</p>
                </div>
                {formError && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-400 text-sm">
                    {formSuccess}
                  </div>
                )}
                <form onSubmit={handleCreateMission} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Title</label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      type="text"
                      className={inputClass}
                      disabled={formBusy}
                      placeholder="e.g. Rate 5 user portfolios"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className={`${inputClass} min-h-[80px] resize-none`}
                      disabled={formBusy}
                      placeholder="Task details..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Reward <span className="text-amber-500 text-[10px]">⚡</span>
                      </label>
                      <input
                        value={formReward}
                        onChange={(e) => setFormReward(e.target.value)}
                        type="number"
                        min="1"
                        className={inputClass}
                        disabled={formBusy}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Deadline</label>
                      <input
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        type="date"
                        className={inputClass}
                        disabled={formBusy}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                  >
                    {formBusy ? "Creating…" : "Dispatch Mission"}
                  </button>
                </form>
              </section>
            </div>

            {/* ── RIGHT: Logs & Flags ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* AI Safety Flags */}
              <section className={`bg-white dark:bg-[#111827] rounded-2xl shadow-sm p-6 space-y-4 border ${
                aiFlags.length > 0 ? "border-red-200 dark:border-red-500/30" : "border-slate-200 dark:border-slate-800"
              }`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">🛡️ AI Safety Flags</h2>
                  {aiFlags.length > 0 && (
                    <span className="bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                      {aiFlags.length} active
                    </span>
                  )}
                </div>

                {missionsLoading ? (
                  <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ) : aiFlags.length === 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5 text-center">
                    <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">✅ All clear! No pending safety issues.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiFlags.map((f) => {
                      const badgeClasses =
                        f.severity === "high"   ? "bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30" :
                        f.severity === "medium" ? "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30" :
                                                  "bg-yellow-50 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30";

                      return (
                        <div key={f.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${badgeClasses}`}>
                                {f.severity}
                              </span>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{f.user.fullName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">({f.user.email})</p>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{f.reason}</p>
                            <p className="text-xs text-slate-400 font-mono mt-1.5">{new Date(f.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                          <button
                            onClick={() => handleResolveFlag(f.id)}
                            className="shrink-0 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg px-4 py-2 transition-colors"
                          >
                            Resolve Flag
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Pending Approvals */}
              <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Submissions Awaiting Review</h2>
                  {stats?.pendingSubmissions ? (
                    <span className="bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                      {stats.pendingSubmissions}
                    </span>
                  ) : null}
                </div>

                {missionsLoading ? (
                  <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ) : pendingSubmissions.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
                    <p className="text-sm text-slate-400">No submissions waiting for review.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map((m) => (
                      <div key={m.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{m.job.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Assigned to: <span className="font-medium text-slate-700 dark:text-slate-300">{m.assignedUser.fullName}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                          <span className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-bold text-sm px-3 py-1.5 rounded-lg">
                            {m.job.creditReward} ⚡
                          </span>
                          <button
                            onClick={() => handleApprove(m.job.id)}
                            disabled={approvingId === m.job.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors flex-1 sm:flex-none"
                          >
                            {approvingId === m.job.id ? "Approving…" : "Approve & Pay"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* All Missions Log */}
              <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">All Missions Log</h2>
                
                {missionsLoading ? (
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ) : missions.length === 0 ? (
                  <p className="text-sm text-slate-400">No admin missions created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">Mission</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">Reward</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">Status</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3">Freelancer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {missions.map((m) => {
                          const statusBadge =
                            m.status === "OPEN"        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" :
                            m.status === "IN_PROGRESS" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20" :
                                                         "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";

                          return (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3">
                                <Link href={`/jobs/${m.id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors max-w-[180px] truncate block" title={m.title}>
                                  {m.title}
                                </Link>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">{m.creditReward} ⚡</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {/* @ts-ignore typed loosely based on Prisma include */}
                                <span className={`text-xs ${m.assignedFreelancer ? "text-slate-500 dark:text-slate-400" : "text-slate-400 italic"}`}>
                                  {/* @ts-ignore */}
                                  {m.assignedFreelancer?.fullName ?? "Unclaimed"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

            </div>
          </div>
          
        </div>
      </main>
    </ProtectedRoute>
  );
}
