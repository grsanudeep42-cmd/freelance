"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import type { AxiosResponse } from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillTest {
  id: string;
  skill: string;
  title: string;
  description: string;
  passMark: number;
  _count: { questions: number };
}

interface AttemptStatus {
  attempted: boolean;
  passed: boolean | null;
  score: number | null;
  badgeEarned: boolean;
}

const SKILL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  React:     { bg: "bg-blue-50 dark:bg-blue-500/12",     border: "border-blue-200 dark:border-blue-500/30",     text: "text-blue-600 dark:text-blue-400" },
  "Node.js": { bg: "bg-emerald-50 dark:bg-emerald-500/12", border: "border-emerald-200 dark:border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-400" },
  Python:    { bg: "bg-yellow-50 dark:bg-yellow-500/12",   border: "border-yellow-200 dark:border-yellow-500/30",   text: "text-yellow-600 dark:text-yellow-400" },
  default:   { bg: "bg-slate-100 dark:bg-slate-700/50",    border: "border-slate-200 dark:border-slate-600",        text: "text-slate-600 dark:text-slate-300" },
};

function getSkillColor(skill: string) {
  return SKILL_COLORS[skill] ?? SKILL_COLORS.default;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SkillsPage(): JSX.Element {
  const { user } = useAuth();

  const [tests, setTests] = useState<SkillTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, AttemptStatus>>({});
  const [statusLoading, setStatusLoading] = useState(false);
  const flashShown = useRef(false);

  useEffect(() => {
    if (!flashShown.current) {
      const flash = sessionStorage.getItem("skillsFlash");
      if (flash) { alert(flash); sessionStorage.removeItem("skillsFlash"); }
      flashShown.current = true;
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      setTestsLoading(true);
      const res = await api.get("/skill-tests");
      setTests((res.data?.data ?? []) as SkillTest[]);
    } catch { /* ignore */ } finally { setTestsLoading(false); }
  }, []);

  const fetchStatuses = useCallback(async (testList: SkillTest[]) => {
    if (!user) return;
    setStatusLoading(true);
    const entries = await Promise.allSettled(
      testList.map((t) =>
        api.get(`/skill-tests/${t.id}/attempt-status`)
           .then((r: AxiosResponse) => ({ id: t.id, status: r.data?.data as AttemptStatus }))
      )
    );
    const map: Record<string, AttemptStatus> = {};
    for (const e of entries) {
      if (e.status === "fulfilled") map[e.value.id] = e.value.status;
    }
    setStatuses(map);
    setStatusLoading(false);
  }, [user]);

  useEffect(() => { fetchTests(); }, [fetchTests]);
  useEffect(() => {
    if (tests.length > 0 && user) fetchStatuses(tests);
  }, [tests, user, fetchStatuses]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* ── Hero Banner ── */}
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40 bg-emerald-500/[0.08] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                ✅ Skill Verification
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Prove Your Skills. Earn Verified Badges.
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
                One test per skill. Pass ≥ 70% and earn a verified ✅ badge on your public profile.
              </p>
            </div>
          </header>

          {/* ── Test Cards ── */}
          {testsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-36 animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-12 text-center">
              <p className="text-slate-400 text-sm">No skill tests available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => {
                const st = statuses[test.id];
                const attempted = st?.attempted ?? false;
                const passed = st?.passed ?? false;
                const sc = getSkillColor(test.skill);

                return (
                  <article
                    key={test.id}
                    className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                          {test.skill}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {test._count.questions} questions · {test.passMark}% to pass
                        </span>
                      </div>
                      <h2 className="font-bold text-base text-slate-900 dark:text-white">{test.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{test.description}</p>
                    </div>

                    {/* Status / Action */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {statusLoading && !st ? (
                        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                      ) : attempted ? (
                        passed ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.12] border border-emerald-200 dark:border-emerald-500/[0.35] text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                            ✅ Verified — <span className="font-mono">{st!.score}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/[0.25] text-red-600 dark:text-red-400 text-sm font-medium">
                            ❌ <span className="font-mono">{st!.score}%</span> — Not passed
                          </span>
                        )
                      ) : (
                        <Link
                          href={`/skills/${test.id}`}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors px-5 py-2 text-sm"
                        >
                          Take Test →
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}
