"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import { api } from "../../../lib/api";
import { getCategoryLabel } from "../../../lib/categories";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  price: number;
  deliveryDays: number;
  revisions: number;
  includes: string[];
  freelancerId: string;
  freelancer: {
    id: string; fullName: string; rating: number | null;
    totalRatings: number; createdAt: string;
  };
  _count: { orders: number };
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

const primaryBtnClass =
  "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors";

const ghostBtnClass =
  "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors font-semibold";

export default function ServiceDetailPage(): JSX.Element {
  const { id } = (useParams() ?? {}) as { id?: string };
  const router = useRouter();
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const fetchService = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/services/${id}`);
      setService(res.data?.data as Service);
    } catch {
      setError("Service not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchService(); }, [fetchService]);

  async function handleOrder() {
    if (!id) return;
    setOrdering(true);
    try {
      await api.post(`/services/${id}/order`, { requirements: requirements.trim() || undefined });
      setOrderSuccess(true);
      setShowOrderModal(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      alert(e?.response?.data?.error?.message ?? "Failed to place order.");
    } finally {
      setOrdering(false);
    }
  }

  const isOwner = user?.id === service?.freelancerId;
  const canOrder = user?.role === "CLIENT" && !isOwner;
  const stars = service?.freelancer.rating ? Math.round(service.freelancer.rating) : 0;
  const includes = Array.isArray(service?.includes) ? service!.includes : [];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-900 dark:hover:text-white transition-colors mb-6 font-medium">
            ← Back to Services
          </Link>

          {loading ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-10 animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-10 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
              <Link href="/services" className={`${ghostBtnClass} px-6 py-2 rounded-xl inline-block`}>Browse Services</Link>
            </div>
          ) : service ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* ── Left: Service Info ── */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30">
                      {getCategoryLabel(service.category)}
                    </span>
                    {service.subcategory && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{service.subcategory}</span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-4 tracking-tight">
                    {service.title}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>

                {/* What's included */}
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-emerald-500 inline-block" />
                    What&apos;s Included
                  </h2>
                  <ul className="space-y-2.5">
                    {includes.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 text-sm">
                        <span className="text-emerald-500 font-bold shrink-0 text-base mt-[-2px]">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order success */}
                {orderSuccess && (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5 p-5 text-center shadow-sm">
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold mb-3">🎉 Order placed! The freelancer will start shortly.</p>
                    <Link href="/services/orders" className={`${ghostBtnClass} px-6 py-2 rounded-xl text-sm inline-block`}>
                      View My Orders
                    </Link>
                  </div>
                )}
              </div>

              {/* ── Right: Sticky Order Panel ── */}
              <div className="lg:sticky lg:top-20 space-y-5">
                 <div className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl shadow-sm p-6 space-y-4 relative overflow-hidden">
                    {/* Tiny accent decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />

                    <div>
                       <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Starting at</p>
                       <p className="font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{service.price.toLocaleString("en-IN")}
                       </p>
                    </div>

                    <div className="space-y-2.5 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                       <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>Delivery</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{service.deliveryDays} days</span>
                       </div>
                       <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>Revisions</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                             {service.revisions === 0 ? "None" : service.revisions}
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>Orders completed</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{service._count.orders}</span>
                       </div>
                    </div>

                    {canOrder && !orderSuccess && (
                       <button
                          onClick={() => setShowOrderModal(true)}
                          className={`${primaryBtnClass} w-full py-3 rounded-xl text-sm block mt-2 shadow-sm`}
                       >
                          Order Now →
                       </button>
                    )}
                    {isOwner && (
                       <p className="text-center text-slate-400 text-xs font-medium pt-2">This is your service</p>
                    )}
                    {!user && (
                       <Link href="/login" className={`${primaryBtnClass} w-full py-3 rounded-xl text-base text-center block shadow-sm mt-2`}>
                          Sign in to Order
                       </Link>
                    )}
                 </div>

                 {/* Freelancer card */}
                 <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5">
                    <h3 className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">About the Freelancer</h3>
                    <div className="flex items-center gap-3 mb-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold shrink-0">
                          {service.freelancer.fullName[0]?.toUpperCase()}
                       </div>
                       <div>
                          <p className="text-slate-900 dark:text-white font-semibold text-sm">{service.freelancer.fullName}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                             Member since {new Date(service.freelancer.createdAt).getFullYear()}
                          </p>
                       </div>
                    </div>
                    {service.freelancer.rating && (
                       <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-amber-500 text-sm">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
                          <span className="font-mono text-sm text-amber-500 font-semibold">{service.freelancer.rating.toFixed(1)}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-xs">({service.freelancer.totalRatings} reviews)</span>
                       </div>
                    )}
                 </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* ─── Order Modal ──────────────────────────────────────────────── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111827] border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Place Order</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Service: <span className="text-slate-900 dark:text-white font-semibold">{service?.title}</span>
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Requirements (optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                className={`${inputClass} resize-none min-h-[100px]`}
                placeholder="Describe what you need — any specific instructions, references, or preferences…"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowOrderModal(false)}
                className={`${ghostBtnClass} flex-1 py-2.5 rounded-xl`}
              >
                Cancel
              </button>
              <button
                onClick={handleOrder}
                disabled={ordering}
                className={`${primaryBtnClass} flex-1 py-2.5 rounded-xl disabled:opacity-40 shadow-sm`}
              >
                {ordering ? "Placing…" : `Confirm — ₹${service?.price.toLocaleString("en-IN")}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
