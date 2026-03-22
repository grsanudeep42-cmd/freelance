"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs",      label: "Jobs"       },
  { href: "/services",  label: "Services"   },
  { href: "/services/orders", label: "Orders" },
  { href: "/analytics", label: "Analytics"  },
  { href: "/messages",  label: "Messages"   },
];

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  CLIENT:     { label: "Client",     color: "text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/40" },
  FREELANCER: { label: "Freelancer", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40" },
  ADMIN:      { label: "Admin",      color: "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/40" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Navbar(): JSX.Element {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  // Poll notifications every 30s
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCount() {
      try {
        const res = await api.get("/notifications");
        setUnreadCount(res.data?.data?.unreadCount ?? 0);
        setNotifications(res.data?.data?.notifications ?? []);
      } catch { /* ignore */ }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Mark a single notification read + navigate
  async function handleNotifClick(notif: NotifItem) {
    if (!notif.isRead) {
      await api.patch(`/notifications/${notif.id}/read`).catch(() => {});
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setBellOpen(false);
    if (notif.link) router.push(notif.link);
  }

  // Mark all read
  async function handleMarkAllRead() {
    await api.patch("/notifications/read-all").catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  // ── Public / unauthenticated nav ──
  if (!isAuthenticated) {
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

  // ── Authenticated nav ──
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

        {/* Right side: Bell + User + Logout */}
        <div className="flex items-center gap-3 shrink-0">

          {/* ── Notification Bell ── */}
          <div className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>

              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#0A0F1E]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* ── Bell Dropdown ── */}
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-semibold transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <span className="text-2xl block mb-2 opacity-30">🔔</span>
                        <p className="text-sm text-slate-400">No notifications yet.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            !n.isRead ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? "bg-emerald-500" : "bg-transparent"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{n.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-1">
                                {new Date(n.createdAt).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 dark:border-slate-800 p-3">
                    <Link
                      href="/notifications"
                      onClick={() => setBellOpen(false)}
                      className="block text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── User info + logout ── */}
          {user && (
            <Link href="/profile/edit" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
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
