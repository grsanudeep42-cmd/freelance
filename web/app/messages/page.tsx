"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import type { ConversationPreview } from "../../lib/messageTypes";

export default function MessagesPage(): JSX.Element {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConvos() {
      try {
        const res = await api.get("/messages/conversations");
        setConversations(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConvos();
  }, []);

  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-slate-100 dark:bg-[#0A0F1E] overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-80 shrink-0 flex flex-col bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 hidden lg:flex">

          {/* Sidebar Header */}
          <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Messages</h1>
            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full">
              🛡️ AI Protected
            </span>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              placeholder="Search conversations…"
              className="w-full bg-slate-100 dark:bg-slate-800/80 border-0 rounded-xl px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-slate-900 dark:text-white"
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3 flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-2.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
                <span className="text-4xl mb-3 opacity-30">💬</span>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No conversations</p>
                <p className="text-xs text-slate-400 mt-1">Messages from jobs appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((c) => (
                  <Link
                    key={c.user.id}
                    href={`/messages/${c.user.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                      {c.user.fullName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {c.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.lastMessage}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 self-start pt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Mobile: show list inline ── */}
        <div className="flex-1 flex flex-col lg:hidden">
          <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-between">
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Messages</h1>
            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full">
              🛡️ AI Protected
            </span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111827]">
            {loading ? (
              <div className="flex flex-col">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="px-4 py-3 flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-2.5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <span className="text-4xl mb-3 opacity-30">💬</span>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No conversations</p>
                <p className="text-xs text-slate-400 mt-1">Messages from jobs appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((c) => (
                  <Link
                    key={c.user.id}
                    href={`/messages/${c.user.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                      {c.user.fullName[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {c.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {c.lastMessage}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 self-start pt-0.5">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (empty state) ── */}
        <div className="flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-[#0d1117] hidden lg:flex">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full mx-auto bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-3xl">
              💬
            </div>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">Select a conversation</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Choose from the list on the left to start chatting.</p>
            <span className="inline-block bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mt-2">
              🛡️ Every message is AI scanned for safety
            </span>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
