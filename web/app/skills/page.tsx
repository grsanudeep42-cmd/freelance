"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SkillsPage(): JSX.Element {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [tests, setTests] = useState<SkillTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, AttemptStatus>>({});
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchTests = useCallback(async () => {
    try {
      setTestsLoading(true);
      const res = await api.get("/skill-tests");
      setTests((res.data?.data ?? []) as SkillTest[]);
    } catch {
      // ignore
    } finally {
      setTestsLoading(false);
    }
  }, []);

  const fetchStatuses = useCallback(
    async (testList: SkillTest[]) => {
      if (!user) return;
      setStatusLoading(true);
      const entries = await Promise.allSettled(
        testList.map((t) =>
          api
            .get(`/skill-tests/${t.id}/attempt-status`)
            .then((r: AxiosResponse) => ({ id: t.id, status: r.data?.data as AttemptStatus }))
        )
      );
      const map: Record<string, AttemptStatus> = {};
      for (const e of entries) {
        if (e.status === "fulfilled") map[e.value.id] = e.value.status;
      }
      setStatuses(map);
      setStatusLoading(false);
    },
    [user]
  );

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  useEffect(() => {
    if (tests.length > 0 && user) fetchStatuses(tests);
  }, [tests, user, fetchStatuses]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <header className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Skill Verification
            </h1>
            <p className="mt-1 text-slate-400 text-sm">
              Take a short test to earn a verified badge on your profile. One
              attempt per skill — make it count.
            </p>
          </header>

          {/* Tests grid */}
          {testsLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 h-36"
                />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-10 text-center">
              <p className="text-slate-400">No skill tests available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => {
                const st = statuses[test.id];
                const attempted = st?.attempted ?? false;
                const passed = st?.passed ?? false;

                return (
                  <article
                    key={test.id}
                    className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {test.skill}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {test._count.questions} questions · {test.passMark}% to pass
                        </span>
                      </div>
                      <h2 className="text-white font-semibold text-base truncate">
                        {test.title}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                        {test.description}
                      </p>
                    </div>

                    {/* Status / Action */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {statusLoading && !st ? (
                        <div className="h-9 w-28 bg-slate-700/60 rounded-xl animate-pulse" />
                      ) : attempted ? (
                        passed ? (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-semibold">
                            ✅ Verified — {st!.score}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold">
                            ❌ {st!.score}% — Not passed
                          </span>
                        )
                      ) : (
                        <Link
                          href={`/skills/${test.id}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
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
