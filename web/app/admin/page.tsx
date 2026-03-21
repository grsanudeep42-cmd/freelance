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
      <main className="min-h-screen bg-[#0f172a] px-4 py-10 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse font-medium">Loading admin panel…</p>
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
    "w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 text-sm outline-none border border-slate-700/60 focus:border-slate-500 disabled:opacity-50 transition-colors";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          
          <header className="rounded-2xl border border-purple-500/20 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">Admin Console</h1>
            <p className="mt-1 text-slate-400 text-sm">Platform control and mission management.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: Stats & Create Form */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Stats Block */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <h2 className="text-white text-base font-semibold">Platform Stats</h2>
                {statsLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-slate-700/60 rounded w-full" />
                    ))}
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#0b1220] p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Users</p>
                      <p className="text-white text-xl font-bold mt-0.5">{stats.totalUsers}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b1220] p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Jobs</p>
                      <p className="text-white text-xl font-bold mt-0.5">{stats.totalJobs}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b1220] p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Bids</p>
                      <p className="text-white text-xl font-bold mt-0.5">{stats.totalBids}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b1220] p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Credits</p>
                      <p className="text-emerald-400 text-xl font-bold mt-0.5">{stats.totalCreditsDistributed}</p>
                    </div>
                    <div className="rounded-xl bg-[#0b1220] p-3 border border-slate-700/50">
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Flags</p>
                      <p className="text-red-400 text-xl font-bold mt-0.5">{aiFlags.length}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-400 text-sm">Failed to load stats.</p>
                )}
              </section>

              {/* Create Mission Form */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <h2 className="text-white text-base font-semibold">Create Mission</h2>
                {formError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 text-xs font-medium">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-300 text-xs font-medium">
                    {formSuccess}
                  </div>
                )}
                <form onSubmit={handleCreateMission} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 text-xs font-medium">Title</label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      type="text"
                      className={inputClass}
                      disabled={formBusy}
                      placeholder="e.g. Rate 5 user portfolios"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-slate-300 text-xs font-medium">Description</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className={`${inputClass} min-h-[80px]`}
                      disabled={formBusy}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-slate-300 text-xs font-medium flex items-center gap-1">
                        Reward <span className="text-amber-400">⚡</span>
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
                    <div className="space-y-1.5">
                      <label className="block text-slate-300 text-xs font-medium">Deadline</label>
                      <input
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                        type="date"
                        className={`${inputClass} text-slate-400`}
                        disabled={formBusy}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    {formBusy ? "Creating…" : "Dispatch Mission"}
                  </button>
                </form>
              </section>
            </div>

            {/* RIGHT COLUMN: Lists */}
            <div className="space-y-6 lg:col-span-2">

              {/* AI Safety Flags */}
              <section className="rounded-2xl border border-red-900/40 bg-[#1e293b] p-6 space-y-4 shadow-sm shadow-red-900/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-base font-semibold flex items-center gap-2">
                    <span className="text-red-500 font-bold">⚠️</span> AI Safety Flags
                  </h2>
                  {aiFlags.length > 0 && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                      {aiFlags.length} active
                    </span>
                  )}
                </div>

                {missionsLoading ? (
                  <div className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
                ) : aiFlags.length === 0 ? (
                  <div className="rounded-xl border border-emerald-900/30 bg-emerald-900/10 p-4 text-center">
                    <p className="text-emerald-400 text-sm font-medium">All clear! No pending safety issues.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiFlags.map((f) => {
                      const badgeColor =
                        f.severity === "high" ? "bg-red-500/20 text-red-500 border border-red-500/30" :
                        f.severity === "medium" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                        "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";

                      return (
                        <div key={f.id} className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeColor}`}>
                                {f.severity}
                              </span>
                              <p className="text-white text-sm font-medium">{f.user.fullName}</p>
                              <p className="text-slate-500 text-xs">({f.user.email})</p>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">{f.reason}</p>
                            <p className="text-slate-500 text-xs mt-2">{new Date(f.createdAt).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => handleResolveFlag(f.id)}
                            className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-base font-semibold">Submissions Awaiting Review</h2>
                  {stats?.pendingSubmissions ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                      {stats.pendingSubmissions}
                    </span>
                  ) : null}
                </div>

                {missionsLoading ? (
                  <div className="h-16 bg-slate-700/30 rounded-xl animate-pulse" />
                ) : pendingSubmissions.length === 0 ? (
                  <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-6 text-center">
                    <p className="text-slate-500 text-sm">No submissions waiting for review.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map((m) => (
                      <div key={m.id} className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{m.job.title}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Assigned to: <span className="text-slate-300 font-medium">{m.assignedUser.fullName}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                          <span className="text-amber-400 text-sm font-bold bg-amber-400/10 px-2 py-1 rounded">
                            {m.job.creditReward} ⚡
                          </span>
                          <button
                            onClick={() => handleApprove(m.job.id)}
                            disabled={approvingId === m.job.id}
                            className="flex-1 sm:flex-none rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                          >
                            {approvingId === m.job.id ? "Approving…" : "Approve & Pay"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* All Missions */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <h2 className="text-white text-base font-semibold">All Missions Log</h2>
                
                {missionsLoading ? (
                  <div className="h-24 bg-slate-700/30 rounded-xl animate-pulse" />
                ) : missions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No admin missions have been created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="pb-2 text-slate-400 font-medium px-2">Mission</th>
                          <th className="pb-2 text-slate-400 font-medium px-2">Reward</th>
                          <th className="pb-2 text-slate-400 font-medium px-2">Status</th>
                          <th className="pb-2 text-slate-400 font-medium px-2">Freelancer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/40">
                        {missions.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-700/10 transition-colors">
                            <td className="py-2.5 px-2 text-white max-w-[200px] truncate" title={m.title}>
                              <Link href={`/jobs/${m.id}`} className="hover:text-blue-400 hover:underline">
                                {m.title}
                              </Link>
                            </td>
                            <td className="py-2.5 px-2 text-amber-400 font-semibold">{m.creditReward}</td>
                            <td className="py-2.5 px-2">
                              <span className="text-slate-300 text-xs bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                                {m.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-slate-400 text-xs">
                              {/* @ts-ignore typed loosely based on Prisma include */}
                              {m.assignedFreelancer?.fullName ?? "Unclaimed"}
                            </td>
                          </tr>
                        ))}
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
