"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import type { JobType } from "../../../lib/jobTypes";

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  description: string;
  type: JobType;
  budget: string;
  deadlineAt: string;
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  type: "FREE",
  budget: "",
  deadlineAt: "",
};

// ─── Validation ───────────────────────────────────────────────────────────────

interface ValidationErrors {
  title?: string;
  description?: string;
  budget?: string;
}

function validate(form: FormState): ValidationErrors {
  const errors: ValidationErrors = {};
  if (form.title.trim().length < 5) errors.title = "Title must be at least 5 characters.";
  if (form.description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
  if (form.type === "BID") {
    const b = Number(form.budget);
    if (!form.budget.trim() || !Number.isFinite(b) || b <= 0) {
      errors.budget = "A positive budget is required for Bid jobs.";
    }
  }
  return errors;
}

// ─── Input components ──────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {error ? <p className="text-red-600 dark:text-red-400 text-xs">{error}</p> : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NewJobPage(): JSX.Element {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Guard: non-CLIENT roles cannot access this page
  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "CLIENT") {
      router.replace("/jobs");
    }
  }, [user, isLoading, router]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setServerError(null);

    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
    };
    if (form.type === "BID") payload.budget = Number(form.budget);
    if (form.deadlineAt) payload.deadlineAt = new Date(form.deadlineAt).toISOString();

    try {
      setSubmitting(true);
      await api.post("/jobs", payload);
      router.push("/jobs");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create job. Please try again.";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Show nothing while auth is resolving to avoid flash
  if (isLoading || !user || user.role !== "CLIENT") return <></>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto w-full max-w-xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Post a Job</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 mb-6">
              Describe your work clearly so the best freelancers can find it.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5"
          >
            {/* Title */}
            <Field label="Job title" error={errors.title}>
              <input
                id="job-title"
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Build a portfolio website in Next.js"
                className={inputClass}
                disabled={submitting}
                maxLength={120}
              />
            </Field>

            {/* Description */}
            <Field label="Description" error={errors.description}>
              <textarea
                id="job-description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What needs to be done? Include skills required, scope, and any deliverables."
                className={`${inputClass} min-h-[140px] resize-y`}
                disabled={submitting}
              />
            </Field>

            {/* Type */}
            <Field label="Job type">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set("type", "FREE")}
                  disabled={submitting}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    form.type === "FREE"
                      ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-500 hover:border-emerald-300 dark:hover:border-emerald-500/50"
                  }`}
                >
                  <span className="font-bold text-sm mb-1">FREE</span>
                  <span className="text-xs opacity-80">Open apply — no bidding</span>
                </button>
                <button
                  type="button"
                  onClick={() => set("type", "BID")}
                  disabled={submitting}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    form.type === "BID"
                      ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] text-slate-500 hover:border-emerald-300 dark:hover:border-emerald-500/50"
                  }`}
                >
                  <span className="font-bold text-sm mb-1">BID</span>
                  <span className="text-xs opacity-80">Freelancers propose their price</span>
                </button>
              </div>
            </Field>

            {/* Budget — only for BID */}
            {form.type === "BID" ? (
              <Field label="Budget (₹)" error={errors.budget}>
                <input
                  id="job-budget"
                  type="number"
                  min="1"
                  step="1"
                  value={form.budget}
                  onChange={(e) => set("budget", e.target.value)}
                  placeholder="e.g. 5000"
                  className={inputClass}
                  disabled={submitting}
                />
              </Field>
            ) : null}

            {/* Deadline */}
            <Field label="Deadline (optional)">
              <input
                id="job-deadline"
                type="date"
                value={form.deadlineAt}
                onChange={(e) => set("deadlineAt", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={`${inputClass} dark:[color-scheme:dark]`}
                disabled={submitting}
              />
            </Field>

            {/* Server error */}
            {serverError ? (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                {serverError}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => router.push("/jobs")}
                disabled={submitting}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                id="submit-job-btn"
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Posting…" : "Post Job"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
