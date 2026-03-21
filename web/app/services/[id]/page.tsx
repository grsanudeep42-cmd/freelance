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
      <main className="min-h-screen bg-appBg px-4 py-8 page-enter">
        <div className="mx-auto max-w-4xl">
          <Link href="/services" className="inline-flex items-center gap-1.5 text-slate-400 text-sm hover:text-white transition-colors mb-6">
            ← Back to Services
          </Link>

          {loading ? (
            <div className="glass-card p-10 animate-pulse">
              <div className="h-8 bg-white/8 rounded w-2/3 mb-4" />
              <div className="h-4 bg-white/5 rounded w-full mb-2" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
            </div>
          ) : error ? (
            <div className="glass-card p-10 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Link href="/services" className="btn-ghost px-6 py-2 rounded-xl">Browse Services</Link>
            </div>
          ) : service ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* ── Left: Service Info ── */}
              <div className="lg:col-span-2 space-y-5">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-indigo/12 text-indigo-light border-indigo/30">
                      {getCategoryLabel(service.category)}
                    </span>
                    {service.subcategory && (
                      <span className="text-slate-500 text-xs">{service.subcategory}</span>
                    )}
                  </div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight mb-4">
                    {service.title}
                  </h1>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {service.description}
                  </p>
                </div>

                {/* What's included */}
                <div className="glass-card p-6">
                  <h2 className="font-display font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded bg-emerald-500 inline-block" />
                    What&apos;s Included
                  </h2>
                  <ul className="space-y-2">
                    {includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-slate-300 text-sm">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order success */}
                {orderSuccess && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
                    <p className="text-emerald-400 font-semibold">🎉 Order placed! The freelancer will start shortly.</p>
                    <Link href="/services/orders" className="inline-block mt-3 btn-ghost px-6 py-2 rounded-xl text-sm">
                      View My Orders
                    </Link>
                  </div>
                )}
              </div>

              {/* ── Right: Sticky Order Panel ── */}
              <div className="lg:sticky lg:top-20 space-y-4">
                <div className="gradient-border">
                  <div className="glass-card-accent rounded-2xl p-6 space-y-4">
                    <div>
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Starting at</p>
                      <p className="font-mono text-3xl font-bold text-emerald-400">
                        ₹{service.price.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm border-t border-white/8 pt-4">
                      <div className="flex justify-between text-slate-300">
                        <span>Delivery</span>
                        <span className="font-semibold text-white">{service.deliveryDays} days</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Revisions</span>
                        <span className="font-semibold text-white">
                          {service.revisions === 0 ? "None" : service.revisions}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Orders completed</span>
                        <span className="font-semibold text-white">{service._count.orders}</span>
                      </div>
                    </div>

                    {canOrder && !orderSuccess && (
                      <button
                        onClick={() => setShowOrderModal(true)}
                        className="btn-primary w-full py-3 rounded-xl text-base"
                      >
                        Order Now →
                      </button>
                    )}
                    {isOwner && (
                      <p className="text-center text-slate-500 text-xs">This is your service</p>
                    )}
                    {!user && (
                      <Link href="/login" className="btn-primary w-full py-3 rounded-xl text-base text-center block">
                        Sign in to Order
                      </Link>
                    )}
                  </div>
                </div>

                {/* Freelancer card */}
                <div className="glass-card p-5">
                  <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">About the Freelancer</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold shrink-0">
                      {service.freelancer.fullName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{service.freelancer.fullName}</p>
                      <p className="text-slate-500 text-xs">
                        Member since {new Date(service.freelancer.createdAt).getFullYear()}
                      </p>
                    </div>
                  </div>
                  {service.freelancer.rating && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
                      <span className="font-mono text-sm text-amber-400">{service.freelancer.rating.toFixed(1)}</span>
                      <span className="text-slate-500 text-xs">({service.freelancer.totalRatings} reviews)</span>
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
          <div className="glass-card-accent rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-display text-xl font-bold text-white">Place Order</h3>
            <p className="text-slate-400 text-sm">
              Service: <span className="text-white font-medium">{service?.title}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Requirements (optional)
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                className="input-field resize-none"
                placeholder="Describe what you need — any specific instructions, references, or preferences…"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="btn-ghost flex-1 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleOrder}
                disabled={ordering}
                className="btn-primary flex-1 py-2.5 rounded-xl"
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
