"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs",      label: "Jobs" },
  { href: "/services",  label: "Services" },
  { href: "/services/orders", label: "Orders" },
  { href: "/messages",  label: "Messages" },
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  CLIENT:     { label: "Client",     color: "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40" },
  FREELANCER: { label: "Freelancer", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40" },
  ADMIN:      { label: "Admin",      color: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/40" },
};

export default function Navbar(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) {
    // Show minimal nav for public pages — match landing PublicNavbar
    if (pathname === "/") {
      return (
        <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0F1E]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
            <Link href="/" className="font-bold text-xl">
              <span className="text-slate-900 dark:text-white">Skill</span>
              <span className="text-emerald-500">Bridge</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      );
    }
    return <></>;
  }

  const role = user?.role ?? "CLIENT";
  const roleConf = ROLE_CONFIG[role] ?? ROLE_CONFIG.CLIENT;

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  function isActive(href: string): boolean {
    return pathname === href || (pathname?.startsWith(href + "/") ?? false);
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0F1E]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <Link href="/dashboard" className="font-bold text-xl shrink-0">
          <span className="text-slate-900 dark:text-white">Skill</span>
          <span className="text-emerald-500">Bridge</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/admin"
                  ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              Admin
            </Link>
          )}
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full bg-emerald-500 opacity-70" />
              )}
            </Link>
          ))}
          {user?.role === "FREELANCER" && (
            <Link
              href="/skills"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/skills" || pathname?.startsWith("/skills/")
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-emerald-600/70 dark:text-emerald-500/70 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5"
              }`}
            >
              Skills ✅
              {(pathname === "/skills" || pathname?.startsWith("/skills/")) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full bg-emerald-500 opacity-70" />
              )}
            </Link>
          )}
        </div>

        {/* User info + logout */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <Link href="/profile/edit" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              {/* Avatar */}
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
                  {user.fullName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="hidden md:block text-slate-900 dark:text-white text-sm font-medium max-w-[100px] truncate">
                {user.fullName?.split(" ")[0]}
              </span>
              <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConf.color}`}>
                {roleConf.label}
              </span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
