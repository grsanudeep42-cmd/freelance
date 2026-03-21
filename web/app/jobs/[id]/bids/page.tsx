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
  if (s === "ACCEPTED") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  if (s === "REJECTED") return "bg-red-500/20 text-red-200 border-red-500/30";
  return "bg-slate-700/40 text-slate-300 border-slate-600/40";
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBid(): JSX.Element {
  return (
    <div className="rounded-xl bg-[#1e293b] border border-slate-700/60 p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-600/60 rounded w-1/3" />
        <div className="h-5 bg-slate-600/40 rounded-full w-20" />
      </div>
      <div className="h-3 bg-slate-600/40 rounded w-full" />
      <div className="h-3 bg-slate-600/40 rounded w-4/5" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-600/40 rounded w-1/4" />
        <div className="h-8 bg-slate-600/40 rounded-xl w-28" />
      </div>
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
      // Let's log the specific Axios error response if available
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
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-white text-2xl font-bold tracking-tight">Bids received</h1>
              <p className="mt-1 text-slate-400 text-sm">
                Review proposals and accept the best fit.
              </p>
            </div>
            <Link
              href={`/jobs/${jobId}`}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-400 hover:text-white transition-colors"
            >
              ← Back to Job
            </Link>
          </div>

          {/* Error */}
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          ) : null}

          {acceptError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
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
              <div className="rounded-xl border border-slate-700 bg-[#1e293b] px-6 py-10 text-center">
                <p className="text-slate-300 font-medium">No bids yet.</p>
                <p className="mt-2 text-slate-500 text-sm">
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
                      className="rounded-xl border border-slate-700/60 bg-[#1e293b] p-5 space-y-4"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {bid.freelancer?.fullName ?? "Freelancer"}
                          </p>
                          <p className="text-blue-300 font-bold text-lg mt-0.5">
                            ₹{Number(bid.amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClass(status)}`}>
                            {status}
                          </span>
                          {bid.creditsSpent > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-amber-500/15 text-amber-300 border-amber-500/30">
                              {bid.creditsSpent} credit{bid.creditsSpent !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cover letter */}
                      <div className="rounded-xl bg-[#0b1220] border border-slate-700/60 px-4 py-3">
                        <p className="text-slate-400 text-xs font-medium mb-1.5">Cover letter</p>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                          {bid.coverLetter}
                        </p>
                      </div>

                      {/* Accept button */}
                      {canAccept ? (
                        <button
                          id={`accept-bid-${bid.id}`}
                          disabled={isAccepting || accepting !== null}
                          onClick={() => acceptBid(bid.id)}
                          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
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
