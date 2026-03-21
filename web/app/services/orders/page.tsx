"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { api } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOrder {
  id: string;
  price: number;
  status: string;
  requirements: string | null;
  deliverable: string | null;
  createdAt: string;
  service: { title: string; category: string };
  client?: { id: string; fullName: string };
  freelancer?: { id: string; fullName: string };
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:           "bg-slate-500/15 text-slate-400 border-slate-500/30",
  IN_PROGRESS:       "bg-blue-500/15 text-blue-400 border-blue-500/30",
  DELIVERED:         "bg-amber-500/15 text-amber-400 border-amber-500/30",
  REVISION_REQUESTED:"bg-orange-500/15 text-orange-400 border-orange-500/30",
  COMPLETED:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CANCELLED:         "bg-red-500/15 text-red-400 border-red-500/30",
};

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  isAsClient,
  onDeliver,
  onComplete,
}: {
  order: ServiceOrder;
  isAsClient: boolean;
  onDeliver?: (id: string) => void;
  onComplete?: (id: string) => void;
}) {
  const [deliverable, setDeliverable] = useState("");
  const [showDeliverForm, setShowDeliverForm] = useState(false);
  const statusStyle = STATUS_STYLES[order.status] ?? STATUS_STYLES.PENDING;
  const otherParty = isAsClient
    ? order.freelancer?.fullName ?? "Freelancer"
    : order.client?.fullName ?? "Client";

  return (
    <div className="glass-card p-5 space-y-3 card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">{order.service.title}</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {isAsClient ? "Freelancer" : "Client"}: <span className="text-slate-300">{otherParty}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${statusStyle}`}>
            {order.status.replace("_", " ")}
          </span>
          <p className="font-mono text-emerald-400 font-bold text-sm mt-1">₹{order.price.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {order.requirements && (
        <p className="text-slate-400 text-xs bg-white/2 rounded-lg px-3 py-2 border border-white/5">
          <span className="text-slate-500 font-semibold">Requirements: </span>
          {order.requirements}
        </p>
      )}

      {order.deliverable && (
        <p className="text-slate-300 text-xs bg-emerald-500/5 border border-emerald-500/15 rounded-lg px-3 py-2">
          <span className="text-emerald-400 font-semibold">Deliverable: </span>
          {order.deliverable}
        </p>
      )}

      {/* Freelancer: deliver work */}
      {!isAsClient && order.status === "IN_PROGRESS" && onDeliver && (
        <>
          {!showDeliverForm ? (
            <button
              onClick={() => setShowDeliverForm(true)}
              className="btn-primary py-1.5 px-4 text-xs rounded-lg"
            >
              Deliver Work →
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                rows={2}
                className="input-field resize-none text-sm"
                placeholder="Paste your work link, output, or description…"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeliverForm(false); setDeliverable(""); }}
                  className="btn-ghost py-1.5 px-4 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={deliverable.trim().length < 10}
                  onClick={() => onDeliver(order.id + "||" + deliverable)}
                  className="btn-primary py-1.5 px-4 text-xs rounded-lg disabled:opacity-40"
                >
                  Submit Delivery
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Client: mark complete */}
      {isAsClient && order.status === "DELIVERED" && onComplete && (
        <button
          onClick={() => onComplete(order.id)}
          className="btn-primary py-1.5 px-4 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500"
        >
          ✓ Mark Complete
        </button>
      )}

      <p className="text-slate-600 text-xs font-mono">
        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyOrdersPage(): JSX.Element {
  const [clientOrders, setClientOrders] = useState<ServiceOrder[]>([]);
  const [freelancerOrders, setFreelancerOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/services/orders/my");
      const { clientOrders: co, freelancerOrders: fo } = res.data?.data as {
        clientOrders: ServiceOrder[];
        freelancerOrders: ServiceOrder[];
      };
      setClientOrders(co ?? []);
      setFreelancerOrders(fo ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleDeliver(payload: string) {
    const [orderId, ...rest] = payload.split("||");
    const deliverable = rest.join("||");
    try {
      await api.put(`/services/orders/${orderId}/deliver`, { deliverable });
      await fetchOrders();
    } catch { alert("Failed to deliver. Please try again."); }
  }

  async function handleComplete(orderId: string) {
    try {
      await api.put(`/services/orders/${orderId}/complete`);
      await fetchOrders();
    } catch { alert("Failed to complete order. Please try again."); }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-appBg px-4 py-8 page-enter">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="glass-card p-6">
            <h1 className="font-display text-2xl font-bold text-white">My Orders</h1>
            <p className="text-slate-400 text-sm mt-1">Track orders you&apos;ve placed and received.</p>
          </header>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-28" />
              ))}
            </div>
          ) : (
            <>
              {/* Orders I Placed (as client) */}
              {clientOrders.length > 0 && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                    <span className="w-1 h-4 rounded bg-blue-500 inline-block" />
                    Orders I Placed
                    <span className="font-mono text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-slate-400">
                      {clientOrders.length}
                    </span>
                  </h2>
                  {clientOrders.map((o) => (
                    <OrderRow key={o.id} order={o} isAsClient onComplete={handleComplete} />
                  ))}
                </section>
              )}

              {/* Orders I Received (as freelancer) */}
              {freelancerOrders.length > 0 && (
                <section className="space-y-4">
                  <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                    <span className="w-1 h-4 rounded bg-violet-500 inline-block" />
                    Orders I Received
                    <span className="font-mono text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-slate-400">
                      {freelancerOrders.length}
                    </span>
                  </h2>
                  {freelancerOrders.map((o) => (
                    <OrderRow key={o.id} order={o} isAsClient={false} onDeliver={handleDeliver} />
                  ))}
                </section>
              )}

              {clientOrders.length === 0 && freelancerOrders.length === 0 && (
                <div className="glass-card p-12 text-center space-y-3">
                  <p className="text-slate-500">No orders yet.</p>
                  <Link href="/services" className="inline-block btn-primary px-6 py-2 rounded-xl text-sm">
                    Browse Services →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
