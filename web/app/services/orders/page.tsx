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
  PENDING:           "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600",
  IN_PROGRESS:       "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  DELIVERED:         "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  REVISION_REQUESTED:"bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
  COMPLETED:         "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  CANCELLED:         "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30",
};

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

const primaryBtnClass =
  "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors";

const ghostBtnClass =
  "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors";

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
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-3 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{order.service.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAsClient ? "Freelancer" : "Client"}: <span className="font-semibold text-slate-700 dark:text-slate-300">{otherParty}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold border ${statusStyle}`}>
            {order.status.replace("_", " ")}
          </span>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-1">₹{order.price.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {order.requirements && (
        <p className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-300">Requirements: </span>
          {order.requirements}
        </p>
      )}

      {order.deliverable && (
        <p className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Deliverable: </span>
          {order.deliverable}
        </p>
      )}

      {/* Freelancer: deliver work */}
      {!isAsClient && order.status === "IN_PROGRESS" && onDeliver && (
        <div className="pt-2">
          {!showDeliverForm ? (
            <button
              onClick={() => setShowDeliverForm(true)}
              className={`${primaryBtnClass} py-1.5 px-4 text-xs rounded-lg inline-block`}
            >
              Deliver Work →
            </button>
          ) : (
            <div className="space-y-2 mt-2">
              <textarea
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none min-h-[60px]`}
                placeholder="Paste your work link, output, or description…"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeliverForm(false); setDeliverable(""); }}
                  className={`${ghostBtnClass} py-1.5 px-4 text-xs rounded-lg font-medium`}
                >
                  Cancel
                </button>
                <button
                  disabled={deliverable.trim().length < 10}
                  onClick={() => onDeliver(order.id + "||" + deliverable)}
                  className={`${primaryBtnClass} py-1.5 px-4 text-xs rounded-lg disabled:opacity-40`}
                >
                  Submit Delivery
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client: mark complete */}
      {isAsClient && order.status === "DELIVERED" && onComplete && (
        <div className="pt-2">
          <button
            onClick={() => onComplete(order.id)}
            className={`${primaryBtnClass} py-1.5 px-4 text-xs rounded-lg inline-block`}
          >
            ✓ Mark Complete
          </button>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-2">Marking complete releases payment from escrow.</p>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono pt-1">
        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Orders</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track orders you&apos;ve placed and received.</p>
          </header>

          {loading ? (
            <div className="space-y-4 animate-pulse pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-28 shadow-sm" />
              ))}
            </div>
          ) : (
            <div className="space-y-8 pt-2">
              {/* Orders I Placed (as client) */}
              {clientOrders.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-blue-500 inline-block" />
                    Orders I Placed
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                      {clientOrders.length}
                    </span>
                  </h2>
                  <div className="space-y-4">
                     {clientOrders.map((o) => (
                       <OrderRow key={o.id} order={o} isAsClient onComplete={handleComplete} />
                     ))}
                  </div>
                </section>
              )}

              {/* Orders I Received (as freelancer) */}
              {freelancerOrders.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-emerald-500 inline-block" />
                    Orders I Received
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">
                      {freelancerOrders.length}
                    </span>
                  </h2>
                  <div className="space-y-4">
                     {freelancerOrders.map((o) => (
                       <OrderRow key={o.id} order={o} isAsClient={false} onDeliver={handleDeliver} />
                     ))}
                  </div>
                </section>
              )}

              {clientOrders.length === 0 && freelancerOrders.length === 0 && (
                <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-12 text-center space-y-4 flex flex-col items-center">
                  <span className="text-4xl block opacity-30 grayscale saturate-0">🤝</span>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No orders yet.</p>
                  <Link href="/services" className={`${primaryBtnClass} px-6 py-2.5 text-sm inline-block`}>
                    Browse Services →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
