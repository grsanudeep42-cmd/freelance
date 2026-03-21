"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import type { Message } from "../../../lib/messageTypes";

export default function ChatPage(): JSX.Element {
  const { userId } = useParams() as { userId: string };
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputBox, setInputBox] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blockRibbon, setBlockRibbon] = useState<string | null>(null);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

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
      // Success
      setMessages((prev) => [...prev, res.data.data]);
      setInputBox("");
    } catch (err: any) {
      if (err.response?.data?.error?.code === "MESSAGE_BLOCKED") {
        setBlockRibbon(`⚠️ Message blocked by SkillBridge AI Guard. Reason: ${err.response.data.error.message}. This has been flagged.`);
      } else {
        alert("Failed to send message: " + (err.response?.data?.error?.message || err.message));
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] flex flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <header className="px-6 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
            <h1 className="text-white font-semibold">Conversation</h1>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col bg-[#0b1220]">
            {loading ? (
              <p className="text-slate-400 text-sm text-center my-auto animate-pulse">Loading chat history…</p>
            ) : messages.length === 0 ? (
              <p className="text-slate-500 text-sm text-center my-auto">Start the conversation securely below.</p>
            ) : (
              messages.map(m => {
                const isSentByMe = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex w-full ${isSentByMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                      ${isSentByMe 
                        ? "bg-purple-600 text-white rounded-tr-sm" 
                        : "bg-slate-700/60 text-slate-100 border border-slate-600 rounded-tl-sm w-fit"
                      }`}
                    >
                      {m.content}
                      <p className={`text-[10px] mt-2 block opacity-60 ${isSentByMe ? "text-right" : "text-left"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            {blockRibbon && (
              <div className="w-full bg-red-900/40 border border-red-500/50 rounded-xl p-3 text-sm text-red-300 flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
                <span className="shrink-0 mt-0.5">🛑</span>
                <p className="flex-1">{blockRibbon}</p>
                <button 
                  onClick={() => setBlockRibbon(null)}
                  className="shrink-0 text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div ref={endOfMessagesRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-[#1e293b] border-t border-slate-700 shrink-0 flex gap-3">
            <input
              value={inputBox}
              onChange={(e) => setInputBox(e.target.value)}
              disabled={sending}
              placeholder="Type your message securely…"
              className="flex-1 rounded-xl bg-[#0f172a] border border-slate-700 text-white px-4 py-2.5 outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !inputBox.trim()}
              className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px]"
            >
              {sending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </main>
    </ProtectedRoute>
  );
}
