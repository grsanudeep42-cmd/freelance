"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../lib/types";

const ROLE_BADGES: Record<UserRole, { label: string; className: string }> = {
  CLIENT: {
    label: "Client",
    className: "bg-blue-500/20 text-blue-300 border border-blue-500/40"
  },
  FREELANCER: {
    label: "Freelancer",
    className: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
  },
  ADMIN: {
    label: "Admin",
    className: "bg-purple-500/20 text-purple-300 border border-purple-500/40"
  }
};

const DEV_ROLES: UserRole[] = ["CLIENT", "FREELANCER"];

export default function DashboardPage(): JSX.Element {
  const router = useRouter();
  const { user, logout, setUserRole, isLoading } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const badge = user?.role ? ROLE_BADGES[user.role] : ROLE_BADGES.CLIENT;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {/* Header */}
          <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold">Profile</h1>
            <p className="mt-1 text-slate-400 text-sm">Your SkillBridge account details.</p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
              <p className="text-slate-400 animate-pulse">Loading profile…</p>
            </div>
          ) : user ? (
            <>
              {/* User info card */}
              <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold select-none">
                      {user.fullName[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-white text-lg font-semibold">{user.fullName}</p>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Credits */}
                {user.creditBalance !== undefined && (
                  <div className="mt-4 rounded-xl bg-[#0b1220] border border-slate-700/60 px-4 py-3 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Credit balance</span>
                    <span className="text-white font-bold tabular-nums">{user.creditBalance}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-3">
                <Link
                  href="/jobs"
                  className="flex w-full items-center justify-center rounded-xl bg-blue-500 py-3 text-white font-semibold hover:bg-blue-600 transition-colors"
                >
                  Browse Jobs
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-slate-700 py-3 text-red-400 font-semibold hover:border-red-500/50 hover:bg-red-500/5 transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* DEV role switch — only for development use */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wide mb-3">
                  ⚡ Dev Tools — Switch Role Locally
                </p>
                <div className="flex gap-2">
                  {DEV_ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRole(r)}
                      className={
                        user.role === r
                          ? "flex-1 rounded-xl border-2 border-amber-400 bg-amber-400/10 text-amber-300 py-2 text-sm font-semibold"
                          : "flex-1 rounded-xl border-2 border-slate-700 bg-transparent text-slate-400 py-2 text-sm font-semibold hover:border-slate-500 transition-colors"
                      }
                    >
                      {r === "CLIENT" ? "Client" : "Freelancer"}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Role changes are local only — no backend change. Refresh page to reset.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
