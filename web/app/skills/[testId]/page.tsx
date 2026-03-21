"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  question: string;
  options: string[];
}

interface TestMeta {
  id: string;
  title: string;
  description: string;
  passMark: number;
}

type ResultState = {
  score: number;
  passed: boolean;
  passMark: number;
  badgeEarned: boolean;
} | null;

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
      const anyErr = err as { response?: { data?: { error?: { message?: string; code?: string } } } };
      const code = anyErr?.response?.data?.error?.code;
      if (code === "ALREADY_ATTEMPTED") {
        // Redirect back with a message — we use sessionStorage as a simple flash
        sessionStorage.setItem("skillsFlash", "You have already taken this test.");
        router.replace("/skills");
      } else {
        setError("Could not load this test. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [testId, router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  function handleSelect(questionId: string, idx: number): void {
    setAnswers((prev) => ({ ...prev, [questionId]: idx }));
  }

  async function handleSubmit(): Promise<void> {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    // Build answers array in question order
    const answersArray = questions.map((q) => answers[q.id] ?? 0);

    try {
      setSubmitting(true);
      const res = await api.post(`/skill-tests/${testId}/submit`, {
        answers: answersArray,
      });
      setResult(res.data?.data as ResultState);
    } catch {
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Back link */}
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors"
          >
            ← Back to Skills
          </Link>

          {loading ? (
            <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-8 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-1/2 mb-4" />
              <div className="h-4 bg-slate-700/60 rounded w-3/4" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
              <p className="text-red-400">{error}</p>
            </div>
          ) : result ? (
            /* ─── Result Screen ─────────────────────────────────────────── */
            <div
              className={`rounded-2xl border p-8 text-center space-y-4 ${
                result.passed
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <p className="text-5xl">{result.passed ? "🎉" : "😔"}</p>
              {result.passed ? (
                <>
                  <h2 className="text-emerald-400 text-2xl font-bold">
                    You passed!
                  </h2>
                  <p className="text-white text-lg font-semibold">
                    Score: {result.score}%
                  </p>
                  <p className="text-emerald-300 text-sm">
                    ✅ Verified badge earned and added to your profile.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-red-400 text-2xl font-bold">
                    Not quite there
                  </h2>
                  <p className="text-white text-lg font-semibold">
                    Score: {result.score}%
                  </p>
                  <p className="text-slate-400 text-sm">
                    You need {result.passMark}% to pass. One attempt per test is
                    allowed.
                  </p>
                </>
              )}
              <Link
                href="/skills"
                className="inline-block mt-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 text-sm font-semibold transition-colors"
              >
                Back to Skills
              </Link>
            </div>
          ) : (
            /* ─── Test Form ─────────────────────────────────────────────── */
            <>
              {/* Test header */}
              <header className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <h1 className="text-white text-xl font-bold">{test?.title}</h1>
                <p className="text-slate-400 text-sm mt-1">{test?.description}</p>
                <p className="text-amber-400 text-xs font-semibold mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
                  ⚠️ One attempt only · {test?.passMark}% required to pass
                </p>
              </header>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <section
                    key={q.id}
                    className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-3"
                  >
                    <p className="text-white text-sm font-semibold">
                      Q{qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {(q.options as string[]).map((opt, idx) => {
                        const selected = answers[q.id] === idx;
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                              selected
                                ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                                : "border-slate-700 bg-[#0b1220] text-slate-300 hover:border-slate-500"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={idx}
                              checked={selected}
                              onChange={() => handleSelect(q.id, idx)}
                              className="accent-emerald-500"
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
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || Object.keys(answers).length < questions.length}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-8 py-3 text-sm font-semibold transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit Test"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
