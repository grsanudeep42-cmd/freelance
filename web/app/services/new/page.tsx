"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { SERVICE_CATEGORIES, getSubcategories } from "../../../lib/categories";

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

const primaryBtnClass =
  "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors";

const ghostBtnClass =
  "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewServicePage(): JSX.Element {
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    title:       "",
    category:    "",
    subcategory: "",
    description: "",
    price:       "",
    deliveryDays:"",
    revisions:   "1",
    includes:    ["", "", ""],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "category" ? { subcategory: "" } : {}),
    }));
  }

  function updateInclude(idx: number, value: string) {
    setForm((prev) => {
      const arr = [...prev.includes];
      arr[idx] = value;
      return { ...prev, includes: arr };
    });
  }

  const subcategories = getSubcategories(form.category);
  const canSubmit =
    form.title.length >= 10 &&
    form.category &&
    form.description.length >= 30 &&
    Number(form.price) >= 100 &&
    Number(form.deliveryDays) >= 1 &&
    form.includes.every((i) => i.trim().length >= 5) &&
    !loading;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/services", {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        subcategory: form.subcategory || undefined,
        price:       Number(form.price),
        deliveryDays:Number(form.deliveryDays),
        revisions:   Number(form.revisions),
        includes:    form.includes.map((i) => i.trim()),
      });
      const id = res.data?.data?.id as string;
      router.push(`/services/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e?.response?.data?.error?.message ?? "Failed to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Only freelancers can access this page
  if (user && user.role !== "FREELANCER") {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-white dark:bg-[#0A0F1E] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 text-center max-w-sm mx-auto flex flex-col items-center">
            <span className="text-4xl block opacity-30 grayscale saturate-0 mb-4">⛔</span>
            <p className="text-slate-400 font-medium mb-4">Only freelancers can create services.</p>
            <Link href="/services" className={`${ghostBtnClass} px-6 py-2 rounded-xl text-sm inline-block`}>← Browse Services</Link>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-5">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
            ← Back to Services
          </Link>

          <header className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl shadow-sm px-6 py-5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create a New Service</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">List your skills and let clients hire you directly.</p>
          </header>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Service Title <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                maxLength={100}
                className={inputClass}
                placeholder="e.g. I will build your React web app from scratch"
              />
              <p className={`text-xs mt-1 font-medium ${form.title.length < 10 && form.title.length > 0 ? "text-amber-500" : "text-slate-400"}`}>
                {form.title.length} / 100 (min 10)
              </p>
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="text-slate-400">Select category…</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="text-slate-900 dark:text-white">{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Subcategory
                </label>
                <select
                  value={form.subcategory}
                  onChange={(e) => update("subcategory", e.target.value)}
                  disabled={!form.category}
                  className={`${inputClass} disabled:opacity-50`}
                >
                  <option value="" className="text-slate-400">Select subcategory…</option>
                  {(subcategories as readonly string[]).map((s) => (
                    <option key={s} value={s} className="text-slate-900 dark:text-white">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={1000}
                rows={5}
                className={`${inputClass} resize-none`}
                placeholder="Describe your service in detail — what you'll deliver, your process, what clients can expect…"
              />
              <p className={`text-xs mt-1 font-medium ${form.description.length < 30 && form.description.length > 0 ? "text-amber-500" : "text-slate-400"}`}>
                {form.description.length} / 1000 (min 30)
              </p>
            </div>

            {/* Price + Delivery + Revisions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  type="number"
                  min={100}
                  max={500000}
                  className={inputClass}
                  placeholder="500"
                />
              </div>
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Delivery (days) <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.deliveryDays}
                  onChange={(e) => update("deliveryDays", e.target.value)}
                  type="number"
                  min={1}
                  max={90}
                  className={inputClass}
                  placeholder="7"
                />
              </div>
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Revisions
                </label>
                <input
                  value={form.revisions}
                  onChange={(e) => update("revisions", e.target.value)}
                  type="number"
                  min={0}
                  max={10}
                  className={inputClass}
                  placeholder="1"
                />
              </div>
            </div>

            {/* What's included */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                What&apos;s Included (3 bullet points) <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {form.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-emerald-500 font-bold text-lg shrink-0 w-4 text-center">✓</span>
                    <input
                      value={item}
                      onChange={(e) => updateInclude(idx, e.target.value)}
                      className={inputClass}
                      placeholder={`Benefit ${idx + 1}…`}
                      minLength={5}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm font-medium shadow-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={!canSubmit}
              onClick={onSubmit}
              className={`${primaryBtnClass} w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-40 shadow-sm`}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Publishing…
                </span>
              ) : "Publish Service →"}
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
