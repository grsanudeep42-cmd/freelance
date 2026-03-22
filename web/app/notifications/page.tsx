"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { api } from "../../lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  NEW_BID:          "💼",
  BID_ACCEPTED:     "✅",
  PAYMENT_RELEASED: "💰",
  JOB_COMPLETED:    "🎉",
  NEW_ORDER:        "📦",
  ORDER_DELIVERED:  "🚚",
  MISSION_APPROVED: "⚡",
  NEW_REVIEW:       "⭐",
  NEW_MESSAGE:      "💬",
  default:          "🔔",
};

export default function NotificationsPage(): JSX.Element {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data?.notifications ?? []);
      setUnreadCount(res.data?.data?.unreadCount ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function handleClick(n: Notification) {
    if (!n.isRead) {
      await api.patch(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) router.push(n.link);
  }

  async function handleMarkAllRead() {
    await api.patch("/notifications/read-all").catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 shadow-sm flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <span className="text-4xl block mb-3 opacity-30">🔔</span>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
                <p className="text-sm text-slate-400 mt-1">Activity from jobs, bids, and messages appears here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-4 ${
                      !n.isRead ? "bg-emerald-50/50 dark:bg-emerald-500/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-xl shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] ?? TYPE_ICONS.default}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{n.title}</p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1.5">
                        {new Date(n.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Arrow if has link */}
                    {n.link && (
                      <span className="text-slate-300 dark:text-slate-600 shrink-0 self-center text-sm">→</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}
