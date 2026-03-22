"use client";

import React, { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  amount: number;
  credits: number | null;
  type: string;
  description: string;
  createdAt: string;
}

interface Job {
  id: string;
  status: string;
  type: string;
  budget: number;
  createdAt: string;
  clientId: string;
  assignedFreelancerId: string | null;
}

interface Bid {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByMonth(items: Transaction[]): { month: string; value: number }[] {
  const map: Record<string, number> = {};
  items.forEach((t) => {
    const month = new Date(t.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
    map[month] = (map[month] ?? 0) + Math.abs(t.amount);
  });
  return Object.entries(map).map(([month, value]) => ({ month, value }));
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function txSign(t: Transaction): "positive" | "negative" {
  return (t.type === "PAYOUT" || t.type === "CREDIT_EARNED") ? "positive" : "negative";
}

function truncateDesc(desc: string): string {
  const clean = desc
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .trim();
  return clean.length > 50 ? clean.slice(0, 50) + "…" : clean || desc.slice(0, 50);
}

// ─── Chart palette ────────────────────────────────────────────────────────────

const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#64748b",
};

const TYPE_COLORS: Record<string, string> = {
  FREE: "#3b82f6",
  BID: "#10b981",
  ADMIN: "#f59e0b",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  icon: string;
  label: string;
  value: string | number;
  subtext: string;
  accent: "emerald" | "blue" | "amber" | "red";
}

const ACCENT_MAP: Record<string, { border: string; bg: string; text: string }> = {
  emerald: { border: "border-emerald-200 dark:border-emerald-500/30", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  blue:    { border: "border-blue-200 dark:border-blue-500/30",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400" },
  amber:   { border: "border-amber-200 dark:border-amber-500/30",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400" },
  red:     { border: "border-red-200 dark:border-red-500/30",     bg: "bg-red-50 dark:bg-red-500/10",     text: "text-red-600 dark:text-red-400" },
};

function KpiCard({ icon, label, value, subtext, accent }: KpiProps): JSX.Element {
  const a = ACCENT_MAP[accent];
  const isEmpty = value === 0 || value === "0" || value === "₹0" || value === "—" || value === formatINR(0);
  return (
    <div className={`bg-white dark:bg-[#111827] border ${a.border} rounded-2xl shadow-sm p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center text-base`}>{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className={`font-mono text-3xl font-bold ${isEmpty ? "text-slate-400 dark:text-slate-600" : a.text}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtext}</p>
    </div>
  );
}

// ─── Chart Card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1 h-4 bg-emerald-500 rounded-full" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }): JSX.Element | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white">{formatINR(payload[0].value)}</p>
    </div>
  );
}

function CountTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }): JSX.Element | null {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-mono">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white">{payload[0].value}</p>
    </div>
  );
}

// ─── Chart empty state ────────────────────────────────────────────────────────

function ChartEmpty({ text }: { text: string }): JSX.Element {
  return (
    <div className="h-[220px] flex items-center justify-center">
      <p className="text-sm text-slate-400 dark:text-slate-500 italic">{text}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage(): JSX.Element {
  const { user } = useAuth();
  const role = user?.role ?? "CLIENT";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      api.get("/payments/my-transactions"),
      api.get("/jobs"),
      api.get("/bids/my"),
    ]);

    if (results[0].status === "fulfilled") {
      setTransactions((results[0].value.data?.data ?? []) as Transaction[]);
    }
    if (results[1].status === "fulfilled") {
      setJobs((results[1].value.data?.data ?? []) as Job[]);
    }
    if (results[2].status === "fulfilled") {
      setBids((results[2].value.data?.data ?? []) as Bid[]);
    }

    const allFailed = results.every((r) => r.status === "rejected");
    if (allFailed) setError("Failed to load analytics data.");
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Chart grid color ──
  const gridColor = "#1e293b";

  // ── Derived data ──

  // FREELANCER
  const totalEarned = transactions.filter((t) => t.type === "PAYOUT").reduce((s, t) => s + t.amount, 0);
  const acceptedBids = bids.filter((b) => b.status === "ACCEPTED").length;
  const winRate = bids.length > 0 ? Math.round((acceptedBids / bids.length) * 100) : 0;
  const earningsData = groupByMonth(transactions.filter((t) => t.type === "PAYOUT"));
  const creditsData = groupByMonth(transactions.filter((t) => t.type === "CREDIT_EARNED"));
  const bidOutcomes = [
    { name: "Accepted", value: bids.filter((b) => b.status === "ACCEPTED").length, color: CHART_COLORS.primary },
    { name: "Pending",  value: bids.filter((b) => b.status === "PENDING").length,  color: CHART_COLORS.warning },
    { name: "Rejected", value: bids.filter((b) => b.status === "REJECTED").length, color: CHART_COLORS.danger },
  ].filter((d) => d.value > 0);

  // CLIENT
  const myJobs = jobs.filter((j) => j.clientId === user?.id);
  const totalSpent = transactions
    .filter((t) => t.type === "CREDIT_SPENT" || t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const spendingData = groupByMonth(transactions.filter((t) => t.amount < 0));
  const jobsByStatus = [
    { name: "Open",        value: myJobs.filter((j) => j.status === "OPEN").length,        color: CHART_COLORS.primary },
    { name: "In Progress", value: myJobs.filter((j) => j.status === "IN_PROGRESS").length, color: CHART_COLORS.secondary },
    { name: "Completed",   value: myJobs.filter((j) => j.status === "COMPLETED").length,   color: CHART_COLORS.muted },
  ].filter((d) => d.value > 0);
  const jobsByType = [
    { type: "FREE",  count: myJobs.filter((j) => j.type === "FREE").length },
    { type: "BID",   count: myJobs.filter((j) => j.type === "BID").length },
    { type: "ADMIN", count: myJobs.filter((j) => j.type === "ADMIN").length },
  ];

  // ADMIN
  const uniqueUsers = new Set([...jobs.map((j) => j.clientId), ...jobs.map((j) => j.assignedFreelancerId).filter(Boolean)]);
  const platformFees = transactions.filter((t) => t.type === "PLATFORM_FEE").reduce((s, t) => s + Math.abs(t.amount), 0);
  const platformFeeData = groupByMonth(transactions.filter((t) => t.type === "PLATFORM_FEE"));
  const allJobTypes = [
    { name: "Free",  value: jobs.filter((j) => j.type === "FREE").length,  color: CHART_COLORS.secondary },
    { name: "Bid",   value: jobs.filter((j) => j.type === "BID").length,   color: CHART_COLORS.primary },
    { name: "Admin", value: jobs.filter((j) => j.type === "ADMIN").length, color: CHART_COLORS.warning },
  ].filter((d) => d.value > 0);
  const allJobStatuses = [
    { status: "Open",   count: jobs.filter((j) => j.status === "OPEN").length },
    { status: "Active", count: jobs.filter((j) => j.status === "IN_PROGRESS").length },
    { status: "Done",   count: jobs.filter((j) => j.status === "COMPLETED").length },
  ];

  // Recent transactions (last 10)
  const recentTx = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  // ── Sub-texts ──
  const roleSubtext: Record<string, string> = {
    FREELANCER: "Your earnings, bids, and performance.",
    CLIENT: "Your spending, jobs, and hiring stats.",
    ADMIN: "Platform-wide activity and health.",
  };

  const roleBadge: Record<string, string> = {
    FREELANCER: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    CLIENT: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
    ADMIN: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30",
  };

  // ── Render ──

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* ── HEADER ── */}
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{roleSubtext[role] ?? roleSubtext.CLIENT}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleBadge[role] ?? roleBadge.CLIENT}`}>
              {role}
            </span>
          </header>

          {/* ── LOADING ── */}
          {loading ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-32 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-72 animate-pulse" />
                ))}
              </div>
            </>
          ) : error ? (
            <div className="bg-white dark:bg-[#111827] border border-red-200 dark:border-red-500/30 rounded-2xl shadow-sm p-12 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button onClick={fetchData} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl px-6 py-2 text-sm transition-colors">Retry</button>
            </div>
          ) : (
            <>
              {/* ── KPI STRIP ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {role === "FREELANCER" && (
                  <>
                    <KpiCard icon="⚡" label="Total Earned" value={formatINR(totalEarned)} subtext="All-time payouts received" accent="amber" />
                    <KpiCard icon="🎯" label="Bids Placed" value={bids.length} subtext="Total bids submitted" accent="emerald" />
                    <KpiCard icon="✅" label="Win Rate" value={bids.length > 0 ? `${winRate}%` : "—"} subtext="Bids accepted vs placed" accent="blue" />
                    <KpiCard icon="💼" label="Jobs Won" value={acceptedBids} subtext="Accepted bids" accent="emerald" />
                  </>
                )}
                {role === "CLIENT" && (
                  <>
                    <KpiCard icon="📋" label="Jobs Posted" value={myJobs.length} subtext="All time" accent="blue" />
                    <KpiCard icon="💳" label="Total Spent" value={formatINR(totalSpent)} subtext="Platform payments" accent="amber" />
                    <KpiCard icon="✅" label="Completed" value={myJobs.filter((j) => j.status === "COMPLETED").length} subtext="Jobs finished" accent="emerald" />
                    <KpiCard icon="🔥" label="Active Jobs" value={myJobs.filter((j) => j.status === "IN_PROGRESS").length} subtext="Currently in progress" accent="blue" />
                  </>
                )}
                {role === "ADMIN" && (
                  <>
                    <KpiCard icon="👥" label="Total Users" value={uniqueUsers.size} subtext="Registered on platform" accent="blue" />
                    <KpiCard icon="📋" label="Total Jobs" value={jobs.length} subtext="All job posts" accent="emerald" />
                    <KpiCard icon="💰" label="Platform Fees" value={formatINR(platformFees)} subtext="5% fee collected" accent="amber" />
                    <KpiCard icon="🛡️" label="Flags Raised" value="—" subtext="AI Guard blocks (coming soon)" accent="red" />
                  </>
                )}
              </div>

              {/* ── CHARTS ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── FREELANCER CHARTS ── */}
                {role === "FREELANCER" && (
                  <>
                    <ChartCard title="Earnings Over Time">
                      {earningsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={earningsData}>
                            <defs>
                              <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorEarnings)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : <ChartEmpty text="No earnings yet." />}
                    </ChartCard>

                    <ChartCard title="Bid Outcomes">
                      {bidOutcomes.length > 0 ? (
                        <div className="relative">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={bidOutcomes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                {bidOutcomes.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CountTooltip />} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "2rem" }}>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{bids.length}</p>
                            <p className="text-xs text-slate-400">Total Bids</p>
                          </div>
                        </div>
                      ) : <ChartEmpty text="No bids placed yet." />}
                    </ChartCard>

                    <ChartCard title="Credits Earned Over Time">
                      {creditsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={creditsData}>
                            <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : <ChartEmpty text="No credits earned yet." />}
                    </ChartCard>
                  </>
                )}

                {/* ── CLIENT CHARTS ── */}
                {role === "CLIENT" && (
                  <>
                    <ChartCard title="Spending Over Time">
                      {spendingData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={spendingData}>
                            <defs>
                              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSpending)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : <ChartEmpty text="No spending data yet." />}
                    </ChartCard>

                    <ChartCard title="Jobs by Status">
                      {jobsByStatus.length > 0 ? (
                        <div className="relative">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={jobsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                {jobsByStatus.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CountTooltip />} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "2rem" }}>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{myJobs.length}</p>
                            <p className="text-xs text-slate-400">Total Jobs</p>
                          </div>
                        </div>
                      ) : <ChartEmpty text="No jobs posted yet." />}
                    </ChartCard>

                    <ChartCard title="Jobs by Type">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={jobsByType}>
                          <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                          <XAxis dataKey="type" tick={{ fill: "#64748b", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                          <Tooltip content={<CountTooltip />} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {jobsByType.map((entry, i) => (
                              <Cell key={i} fill={TYPE_COLORS[entry.type] ?? "#10b981"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </>
                )}

                {/* ── ADMIN CHARTS ── */}
                {role === "ADMIN" && (
                  <>
                    <ChartCard title="Platform Fee Revenue">
                      {platformFeeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={platformFeeData}>
                            <defs>
                              <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#colorFees)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : <ChartEmpty text="No fee revenue yet." />}
                    </ChartCard>

                    <ChartCard title="Job Type Distribution">
                      {allJobTypes.length > 0 ? (
                        <div className="relative">
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie data={allJobTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                                {allJobTypes.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip content={<CountTooltip />} />
                              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: "2rem" }}>
                            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{jobs.length}</p>
                            <p className="text-xs text-slate-400">Total Jobs</p>
                          </div>
                        </div>
                      ) : <ChartEmpty text="No jobs yet." />}
                    </ChartCard>

                    <ChartCard title="Job Status Breakdown">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={allJobStatuses}>
                          <CartesianGrid strokeDasharray="0" stroke={gridColor} strokeOpacity={0.5} />
                          <XAxis dataKey="status" tick={{ fill: "#64748b", fontSize: 11 }} />
                          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                          <Tooltip content={<CountTooltip />} />
                          <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </>
                )}

                {/* ── TRANSACTION HISTORY (all roles) ── */}
                <ChartCard title="Recent Transactions">
                  {recentTx.length > 0 ? (
                    <div className="space-y-2">
                      {recentTx.map((tx) => {
                        const sign = txSign(tx);
                        return (
                          <div
                            key={tx.id}
                            className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex justify-between items-center"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{truncateDesc(tx.description)}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                <span className="ml-2 text-slate-300 dark:text-slate-600">·</span>
                                <span className="ml-2 font-mono">{tx.type}</span>
                              </p>
                            </div>
                            <span className={`font-mono font-bold text-sm shrink-0 ml-4 ${sign === "positive" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                              {sign === "positive" ? "+" : "−"}{formatINR(Math.abs(tx.amount))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <ChartEmpty text="No transactions yet." />}
                </ChartCard>

              </div>
            </>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}
