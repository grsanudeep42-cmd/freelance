"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import type { Message, ConversationPreview } from "../../../lib/messageTypes";

export default function ChatPage(): JSX.Element {
  const { userId } = useParams() as { userId: string };
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputBox, setInputBox] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blockRibbon, setBlockRibbon] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [convosLoading, setConvosLoading] = useState(true);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Fetch sidebar conversations
  useEffect(() => {
    async function fetchConvos() {
      try {
        const res = await api.get("/messages/conversations");
        setConversations(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setConvosLoading(false);
      }
    }
    fetchConvos();
  }, []);

  // Poll chat every 5s
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function fetchChat() {
      if (!userId) return;
      try {
        const res = await api.get(`/messages/${userId}`);
        setMessages(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      } finally {
        setLoading(false);
      }
    }

    fetchChat();
    interval = setInterval(fetchChat, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  // Auto scroll
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setBlockRibbon(null);
    if (!inputBox.trim() || !userId) return;

    const payload = {
      receiverId: userId,
      content: inputBox.trim()
    };

    try {
      setSending(true);
      const res = await api.post("/messages", payload);
      setMessages((prev) => [...prev, res.data.data]);
      setInputBox("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { code?: string; message?: string } } }; message?: string };
      if (error.response?.data?.error?.code === "MESSAGE_BLOCKED") {
        setBlockRibbon(`⚠️ Message blocked by SkillBridge AI Guard. Reason: ${error.response.data.error.message}. This has been flagged.`);
      } else {
        alert("Failed to send message: " + (error.response?.data?.error?.message || error.message));
      }
    } finally {
      setSending(false);
    }
  }

  // Derive other user's name from conversations
  const otherUser = conversations.find((c) => c.user.id === userId)?.user;
  const otherUserName = otherUser?.fullName ?? "Chat";
  const otherUserInitial = otherUserName[0]?.toUpperCase() ?? "?";

  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-slate-100 dark:bg-[#0A0F1E] overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-80 shrink-0 flex-col bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 hidden lg:flex">

          {/* Sidebar Header */}
          <div className="shrink-0 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Messages</h2>
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
            {convosLoading ? (
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
                {conversations.map((c) => {
                  const isActive = c.user.id === userId;
                  return (
                    <Link
                      key={c.user.id}
                      href={`/messages/${c.user.id}`}
                      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0 transition-colors cursor-pointer group ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-l-2 border-l-emerald-500"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                        {c.user.fullName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate transition-colors ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                        }`}>
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
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── RIGHT CHAT PANEL ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-[#0d1117]">

          {/* Chat Header */}
          <div className="shrink-0 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <Link
                href="/messages"
                className="lg:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                ←
              </Link>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center">
                {otherUserInitial}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{otherUserName}</p>
                <p className="text-xs text-emerald-500">● Online</p>
              </div>
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full">
              🛡️ AI Protected
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-1">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm animate-pulse">Loading…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2">
                <span className="text-3xl opacity-20">💬</span>
                <p className="text-sm text-slate-400">Say something to get started.</p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isSentByMe = m.senderId === user?.id;
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
                const senderChanged = !prevMsg || prevMsg.senderId !== m.senderId;
                const isLastInGroup = !nextMsg || nextMsg.senderId !== m.senderId;

                return (
                  <div key={m.id} className={`${senderChanged && idx > 0 ? "mt-3" : ""}`}>
                    {isSentByMe ? (
                      <div className="flex justify-end mb-0.5">
                        <div className="flex flex-col max-w-[55%]">
                          <div className="w-fit px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-emerald-600 text-white rounded-2xl rounded-tr-sm ml-auto">
                            {m.content}
                          </div>
                          {isLastInGroup && (
                            <p className="text-[10px] text-slate-400 mt-1 text-right pr-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start gap-2 mb-0.5">
                        {/* Small avatar — only on last message in group */}
                        {isLastInGroup ? (
                          <div className="w-6 h-6 rounded-full shrink-0 self-end bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[10px] font-bold flex items-center justify-center">
                            {otherUserInitial}
                          </div>
                        ) : (
                          <div className="w-6 shrink-0" />
                        )}
                        <div className="flex flex-col max-w-[55%]">
                          <div className="w-fit px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm">
                            {m.content}
                          </div>
                          {isLastInGroup && (
                            <p className="text-[10px] text-slate-400 mt-1 text-left pl-1">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {blockRibbon && (
              <div className="mx-0 rounded-xl p-3 mt-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                <span className="shrink-0">🛑</span>
                <p className="flex-1">{blockRibbon}</p>
                <button onClick={() => setBlockRibbon(null)} className="shrink-0 text-red-500 hover:text-red-800 dark:hover:text-red-200 transition-colors">✕</button>
              </div>
            )}

            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="shrink-0 px-6 py-4 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex gap-3 items-center">
            <input
              value={inputBox}
              onChange={(e) => setInputBox(e.target.value)}
              disabled={sending}
              placeholder="Type your message securely…"
              className="flex-1 rounded-2xl text-sm px-5 py-3 bg-slate-100 dark:bg-slate-800/80 border border-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-0 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !inputBox.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl w-11 h-11 flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors"
            >
              {sending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-base">→</span>
              )}
            </button>
          </form>

        </div>
      </div>
    </ProtectedRoute>
  );
}
