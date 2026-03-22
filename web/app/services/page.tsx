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

// ─── Constants ────────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

const primaryBtnClass =
  "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors";

const ghostBtnClass =
  "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors";

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ service, canOrder }: { service: Service; canOrder: boolean }) {
  const stars = service.freelancer.rating ? Math.round(service.freelancer.rating) : 0;
  const includes = Array.isArray(service.includes) ? service.includes : [];

  return (
    <article className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 flex flex-col gap-3 group hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div>
        <span className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-0.5 rounded-lg text-xs font-bold shrink-0">
          {getCategoryLabel(service.category)}
        </span>
        <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 mt-2">
          {service.title}
        </h3>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{service.freelancer.fullName}</span>
        {service.freelancer.rating && (
          <>
            <span>·</span>
            <span className="text-amber-500">{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
            <span>({service.freelancer.totalRatings})</span>
          </>
        )}
      </div>

      {includes.slice(0, 2).map((item, i) => (
        <p key={i} className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5 line-clamp-1">
           <span className="text-emerald-500 font-bold shrink-0">✓</span>
           <span>{item}</span>
        </p>
      ))}

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg">
            ₹{service.price.toLocaleString("en-IN")}
          </p>
          <p className="text-slate-400 text-xs mt-0.5">Delivery in {service.deliveryDays}d · {service.revisions} revision{service.revisions !== 1 ? "s" : ""}</p>
        </div>
        {canOrder ? (
          <Link href={`/services/${service.id}`} className={`${primaryBtnClass} py-2 px-4 text-xs`}>
            Order Now →
          </Link>
        ) : (
          <Link href={`/services/${service.id}`} className={`${ghostBtnClass} py-2 px-4 text-xs font-semibold`}>
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
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Freelancer Services
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Browse and order services from verified freelancers.
              </p>
            </div>
            {user?.role === "FREELANCER" && (
              <Link href="/services/new" className={`${primaryBtnClass} flex items-center justify-center px-5 py-2.5 text-sm shrink-0`}>
                + Create Service
              </Link>
            )}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClass}
              placeholder="Search services…"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${inputClass} sm:w-64 shrink-0`}
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-44 animate-pulse shadow-sm" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
              <span className="text-4xl block opacity-30">📦</span>
              <p className="text-slate-400 font-medium">No services found.</p>
              {user?.role === "FREELANCER" && (
                <Link href="/services/new" className={`${primaryBtnClass} px-6 py-2.5 text-sm`}>
                  Create your first service
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
