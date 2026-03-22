"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question { id: string; question: string; options: string[]; }
interface TestMeta  { id: string; title: string; description: string; passMark: number; }
type ResultState = { score: number; passed: boolean; passMark: number; badgeEarned: boolean } | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TakeTestPage(): JSX.Element {
  const params = useParams();
  const testId = params?.testId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<TestMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/skill-tests/${testId}/questions`);
      const data = res.data?.data;
      setTest(data.test as TestMeta);
      setQuestions((data.questions ?? []) as Question[]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code?: string } } } };
      if (e?.response?.data?.error?.code === "ALREADY_ATTEMPTED") {
        sessionStorage.setItem("skillsFlash", "You have already taken this test.");
        router.replace("/skills");
      } else {
        setError("Could not load this test. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [testId, router]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  function handleSelect(questionId: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    const answersArray = questions.map((q) => answers[q.id] ?? 0);
    try {
      setSubmitting(true);
      const res = await api.post(`/skill-tests/${testId}/submit`, { answers: answersArray });
      setResult(res.data?.data as ResultState);
    } catch { alert("Failed to submit. Please try again."); }
    finally { setSubmitting(false); }
  }

  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* Back */}
          <Link href="/skills" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            ← Back to Skills
          </Link>

          {loading ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 p-8 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : result ? (
            /* ─── Result Screen ─────────────────────────────────────── */
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-10 text-center space-y-4">
              <p className="text-6xl">{result.passed ? "🎉" : "😔"}</p>
              <p className={`font-mono text-5xl font-bold ${result.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {result.score}%
              </p>
              {result.passed ? (
                <>
                  <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">You passed!</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">✅ Verified badge added to your profile.</p>
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 mt-4 mx-auto w-32" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">So close!</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Required: <span className="font-mono font-bold text-slate-900 dark:text-white">{result.passMark}%</span>. One attempt per test is allowed.
                  </p>
                </>
              )}
              <Link
                href="/skills"
                className="inline-block mt-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors px-8 py-3 font-semibold text-sm"
              >
                ← Back to Skills
              </Link>
            </div>
          ) : (
            /* ─── Test Form ─────────────────────────────────────────── */
            <>
              {/* Test header + progress */}
              <header className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl shadow-sm p-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{test?.title}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{test?.description}</p>

                <div className="mt-4 flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {answered} / {questions.length} answered
                  </span>
                  <span className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-lg">
                    ⚠️ One attempt · {test?.passMark}% to pass
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </header>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <section key={q.id} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-3">
                    <p className="text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">Q{qIdx + 1}.{" "}</span>
                      {q.question}
                    </p>
                    <div className="space-y-2">
                      {(q.options as string[]).map((opt, idx) => {
                        const selected = answers[q.id] === idx;
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-150 ${
                              selected
                                ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-white"
                                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={idx}
                              checked={selected}
                              onChange={() => handleSelect(q.id, idx)}
                              className="accent-emerald-500 shrink-0"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {/* Submit */}
              <div className="flex justify-end pb-8">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || answered < questions.length}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors px-10 py-3 text-base disabled:opacity-40"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Submitting…
                    </span>
                  ) : "Submit Test →"}
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}
