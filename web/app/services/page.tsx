"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { getCategoryLabel, SERVICE_CATEGORIES } from "../../lib/categories";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  title: string;
  category: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  includes: string[];
  createdAt: string;
  freelancer: { id: string; fullName: string; rating: number | null; totalRatings: number };
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, canOrder }: { service: Service; canOrder: boolean }) {
  const stars = service.freelancer.rating ? Math.round(service.freelancer.rating) : 0;
  const includes = Array.isArray(service.includes) ? service.includes : [];

  return (
    <article className="glass-card card-hover p-5 flex flex-col gap-3 group">
      <div>
        <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold border bg-indigo/12 text-indigo-light border-indigo/30">
          {getCategoryLabel(service.category)}
        </span>
        <h3 className="font-display font-semibold text-white text-base leading-tight line-clamp-1 mt-2">
          {service.title}
        </h3>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-medium text-white">{service.freelancer.fullName}</span>
        {service.freelancer.rating && (
          <>
            <span>·</span>
            <span className="text-amber-400">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
            <span>({service.freelancer.totalRatings})</span>
          </>
        )}
      </div>

      {includes.slice(0, 2).map((item, i) => (
        <p key={i} className="text-slate-400 text-xs flex items-center gap-1.5">
          <span className="text-emerald-400">✓</span> {item}
        </p>
      ))}

      <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
        <div>
          <p className="font-mono font-bold text-emerald-400 text-lg">
            ₹{service.price.toLocaleString("en-IN")}
          </p>
          <p className="text-slate-500 text-xs">Delivery in {service.deliveryDays}d · {service.revisions} revision{service.revisions !== 1 ? "s" : ""}</p>
        </div>
        {canOrder ? (
          <Link href={`/services/${service.id}`} className="btn-primary py-2 px-4 text-xs rounded-xl">
            Order Now →
          </Link>
        ) : (
          <Link href={`/services/${service.id}`} className="btn-ghost py-2 px-4 text-xs rounded-xl">
            View →
          </Link>
        )}
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage(): JSX.Element {
  const { user } = useAuth();
  const canOrder = user?.role === "CLIENT";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/services");
      setServices((res.data?.data ?? []) as Service[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-appBg px-4 py-8 page-enter">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Freelancer <span className="gradient-text">Services</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Browse and order services from verified freelancers.
              </p>
            </div>
            {user?.role === "FREELANCER" && (
              <Link href="/services/new" className="btn-primary py-2 px-4 text-sm rounded-xl shrink-0">
                + Create Service
              </Link>
            )}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field flex-1"
              placeholder="Search services…"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field w-auto min-w-[180px]"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card h-44 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-slate-500">No services found.</p>
              {user?.role === "FREELANCER" && (
                <Link href="/services/new" className="inline-block mt-4 btn-primary px-6 py-2 rounded-xl text-sm">
                  Create your first service
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} canOrder={canOrder} />
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
