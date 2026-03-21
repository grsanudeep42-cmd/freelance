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
  CLIENT:     { label: "Client",     color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  FREELANCER: { label: "Freelancer", color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" },
  ADMIN:      { label: "Admin",      color: "text-violet-400 bg-violet-500/15 border-violet-500/30" },
};

export default function Navbar(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) {
    // Show minimal nav for public pages
    if (pathname === "/") {
      return (
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-appBg/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
            <Link href="/" className="font-display font-bold text-xl">
              <span className="text-white">Skill</span>
              <span className="gradient-text">Bridge</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="btn-ghost py-2 px-4 text-sm">Sign In</Link>
              <Link href="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
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

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-appBg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* Brand */}
        <Link href="/dashboard" className="font-display font-bold text-lg shrink-0">
          <span className="text-white">Skill</span>
          <span className="gradient-text">Bridge</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/admin"
                  ? "text-violet-400 bg-violet-500/10"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
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
                pathname === link.href || pathname?.startsWith(link.href + "/")
                  ? "text-white bg-indigo/15"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
              {(pathname === link.href || pathname?.startsWith(link.href + "/")) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full gradient-bg opacity-70" />
              )}
            </Link>
          ))}
          {user?.role === "FREELANCER" && (
            <Link
              href="/skills"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                pathname === "/skills" || pathname?.startsWith("/skills/")
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/5"
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
                <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-600 object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold select-none shrink-0">
                  {user.fullName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="hidden md:block text-white text-sm font-medium max-w-[100px] truncate">
                {user.fullName?.split(" ")[0]}
              </span>
              <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleConf.color}`}>
                {roleConf.label}
              </span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 border border-white/8 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
