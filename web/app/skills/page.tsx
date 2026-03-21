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
  React:    { bg: "bg-blue-500/12",    border: "border-blue-500/30",    text: "text-blue-400" },
  "Node.js":{ bg: "bg-emerald-500/12",  border: "border-emerald-500/30",  text: "text-emerald-400" },
  Python:   { bg: "bg-yellow-500/12",  border: "border-yellow-500/30",  text: "text-yellow-400" },
  default:  { bg: "bg-indigo/12",      border: "border-indigo/30",      text: "text-indigo-light" },
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
      <main className="min-h-screen bg-appBg px-4 py-8 page-enter">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Hero banner */}
          <header className="relative overflow-hidden rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, #111827 0%, #1a1040 100%)" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-indigo/20 rounded-full blur-[64px] pointer-events-none" />
            <div className="relative z-10">
              <h1 className="font-display text-3xl font-extrabold text-white mb-2">
                Prove Your Skills.{" "}
                <span className="gradient-text">Earn Verified Badges.</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                One test per skill. Pass ≥ {70}% and earn a verified ✅ badge on your public profile.
              </p>
            </div>
          </header>

          {/* Tests grid */}
          {testsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="glass-card p-6 h-36" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-slate-400">No skill tests available yet.</p>
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
                    className="glass-card card-hover p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                          {test.skill}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">
                          {test._count.questions} questions · {test.passMark}% to pass
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-white text-base">{test.title}</h2>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2 leading-relaxed">{test.description}</p>
                    </div>

                    {/* Status / Action */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {statusLoading && !st ? (
                        <div className="h-9 w-28 bg-white/5 rounded-xl animate-pulse" />
                      ) : attempted ? (
                        passed ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/12 border border-emerald-500/35 text-emerald-400 text-sm font-semibold">
                            ✅ Verified — <span className="font-mono">{st!.score}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/8 border border-red-500/25 text-red-400 text-sm font-medium">
                            ❌ <span className="font-mono">{st!.score}%</span> — Not passed
                          </span>
                        )
                      ) : (
                        <Link
                          href={`/skills/${test.id}`}
                          className="btn-primary px-5 py-2 rounded-xl text-sm"
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
