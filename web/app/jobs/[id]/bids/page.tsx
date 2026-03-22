"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/api";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { useAuth } from "../../../../context/AuthContext";
import type { Bid } from "../../../../lib/jobTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

type BidPageJob = {
  id: string;
  status: string;
  clientId: string;
};

// ─── Badge helpers ─────────────────────────────────────────────────────────────

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "ACCEPTED") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
  if (s === "REJECTED") return "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30";
  return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBid(): JSX.Element {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-5 animate-pulse shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
      </div>
      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function BidsPage(): JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const { user } = useAuth();

  const [job, setJob] = useState<BidPageJob | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null); // bidId being accepted
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const [jobRes, bidsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/bids/job/${jobId}`),
      ]);

      const jobPayload = jobRes.data?.data as { job: BidPageJob; bidsCount: number };
      const bidsPayload = (bidsRes.data?.data ?? []) as Bid[];

      setJob(jobPayload.job);
      setBids(bidsPayload);
    } catch (err) {
      console.error("Failed to load bids list data:", err);
      if (typeof err === "object" && err !== null && "response" in err) {
        // @ts-expect-error ignoring typed axios error for quick logging
        console.error("API response details:", err.response?.data);
      }
      setError("Failed to load bids. You may not have permission to view them.");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guard: redirect if current user is not the job owner
  useEffect(() => {
    if (!loading && job && user && job.clientId !== user.id) {
      router.replace("/jobs");
    }
  }, [loading, job, user, router]);

  async function acceptBid(bidId: string): Promise<void> {
    setAcceptError(null);
    try {
      setAccepting(bidId);
      await api.post(`/bids/${bidId}/accept`);
      // Refresh the list optimistically and then re-fetch
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to accept bid.";
      setAcceptError(msg);
    } finally {
      setAccepting(null);
    }
  }

  const jobIsOpen = job?.status?.toUpperCase() === "OPEN";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto w-full max-w-2xl space-y-6">

          {/* Header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bids received</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Review proposals and accept the best fit.
              </p>
            </div>
            <Link
              href={`/jobs/${jobId}`}
              className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors px-4 py-2 text-sm font-medium"
            >
              ← Back to Job
            </Link>
          </div>

          {/* Error */}
          {error ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : null}

          {acceptError ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {acceptError}
            </div>
          ) : null}

          {/* Loading skeletons */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonBid key={i} />)}
            </div>
          ) : null}

          {/* Bid list */}
          {!loading && !error ? (
            bids.length === 0 ? (
              <div className="bg-white dark:bg-[#111827] border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl px-6 py-12 text-center shadow-sm">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">No bids yet.</h3>
                <p className="mt-1 text-slate-400 text-sm">
                  Freelancers will appear here once they submit proposals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => {
                  const status = (bid.status ?? "PENDING").toString().toUpperCase();
                  const isPending = status === "PENDING";
                  const canAccept = isPending && jobIsOpen;
                  const isAccepting = accepting === bid.id;

                  return (
                    <div
                      key={bid.id}
                      className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors hover:border-emerald-300 dark:hover:border-emerald-500/30"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {bid.freelancer?.fullName ?? "Freelancer"}
                          </p>
                          <p className="font-mono font-bold text-2xl text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ₹{Number(bid.amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClass(status)}`}>
                            {status}
                          </span>
                          {bid.creditsSpent > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30">
                              {bid.creditsSpent} credit{bid.creditsSpent !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cover letter */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Cover letter</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {bid.coverLetter}
                        </p>
                      </div>

                      {/* Accept button */}
                      {canAccept ? (
                        <button
                          id={`accept-bid-${bid.id}`}
                          disabled={isAccepting || accepting !== null}
                          onClick={() => acceptBid(bid.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isAccepting ? "Accepting…" : "Accept Bid"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
