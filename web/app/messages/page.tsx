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
      <main className="min-h-screen bg-[#0f172a] px-4 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-2xl font-bold tracking-tight">Messages</h1>
            <p className="mt-1 text-slate-400 text-sm">Your secure conversations on SkillBridge.</p>
          </header>

          <section className="bg-[#1e293b] rounded-2xl border border-slate-700 p-2 overflow-hidden">
            {loading ? (
              <div className="p-4 flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse bg-slate-700/50 rounded-xl" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-400 font-medium">No conversations yet.</p>
                <p className="text-slate-500 text-sm mt-1">Start one from a job page!</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((c) => (
                  <Link
                    key={c.user.id}
                    href={`/messages/${c.user.id}`}
                    className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 hover:bg-slate-700/30 transition-colors border-b border-slate-700/50 last:border-0"
                  >
                    <div>
                      <p className="text-white font-semibold">{c.user.fullName}</p>
                      <p className="text-slate-400 text-sm mt-0.5 truncate max-w-sm">{c.lastMessage}</p>
                    </div>
                    <span className="text-slate-500 text-xs shrink-0 mt-2 sm:mt-0">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
