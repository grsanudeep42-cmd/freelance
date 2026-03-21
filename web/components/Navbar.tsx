"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const ROLE_COLORS: Record<string, string> = {
  CLIENT: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  FREELANCER: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ADMIN: "bg-purple-500/20 text-purple-300 border-purple-500/30"
};

export default function Navbar(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!isAuthenticated) return <></>;

  const roleColor = user?.role ? (ROLE_COLORS[user.role] ?? ROLE_COLORS.CLIENT) : ROLE_COLORS.CLIENT;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/60 bg-[#0f172a]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <Link
          href="/dashboard"
          className="text-white font-bold text-lg tracking-tight hover:text-blue-400 transition-colors"
        >
          SkillBridge
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-slate-700/50 hover:text-purple-200 transition-colors"
            >
              Admin
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/jobs"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            Jobs
          </Link>
          {user?.role === "FREELANCER" && (
            <Link
              href="/skills"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
            >
              Skills ✅
            </Link>
          )}
          <Link
            href="/messages"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            Messages
          </Link>
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-white text-sm font-medium truncate max-w-[120px]">
                {user.fullName}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColor}`}
              >
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-red-500/50 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
