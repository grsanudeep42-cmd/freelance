"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import { canAcceptJob, canBid, canClaimAdminJob, canSubmitAdminWork, isClient } from "../../../lib/roles";
import type { Job } from "../../../lib/jobTypes";
import StarRating from "../../../components/StarRating";
import type { Review } from "../../../lib/types";
import type { Bid } from "../../../lib/jobTypes";

export default function JobDetailsPage(): JSX.Element {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [bidsCount, setBidsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Bid form state
  const [amount, setAmount] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [creditsSpent, setCreditsSpent] = useState<string>("1");

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // Admin submission state
  const [submission, setSubmission] = useState<string>("");

  // Escrow state
  const [escrow, setEscrow] = useState<any>(null);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [acceptedBid, setAcceptedBid] = useState<Bid | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJob(): Promise<void> {
      try {
        setLoading(true);
        setError(null);
        if (!jobId) return;

        const res = await api.get(`/jobs/${jobId}`);
        const payload = res.data?.data as { job: Job; bidsCount: number };

        if (!cancelled) {
          setJob(payload.job);
          setBidsCount(payload.bidsCount);
        }
      } catch {
        if (!cancelled) setError("Failed to load job details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJob();
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => {
    if (job?.status === "COMPLETED") {
      api.get(`/reviews/job/${job.id}`).then(res => {
        const fetched = res.data?.data || [];
        setReviews(fetched);
        if (user && fetched.some((r: Review) => r.reviewerId === user.id)) {
          setUserHasReviewed(true);
        }
      }).catch(console.error);
    }
  }, [job?.status, job?.id, user]);

  useEffect(() => {
    if (user && job?.id && job.type === "BID" && (user.id === job.clientId || user.id === job.assignedFreelancerId)) {
      setEscrowLoading(true);
      Promise.all([
        api.get(`/payments/escrow/${job.id}`).catch(() => ({ data: { data: null } })),
        api.get(`/bids/job/${job.id}`).catch(() => ({ data: { data: [] } }))
      ]).then(([escRes, bidsRes]) => {
        setEscrow(escRes.data?.data || null);
        const bids = bidsRes.data?.data || [];
        const accepted = bids.find((b: any) => b.status === "ACCEPTED");
        if (accepted) setAcceptedBid(accepted);
      }).finally(() => setEscrowLoading(false));
    }
  }, [user, job?.id, job?.type, job?.clientId, job?.assignedFreelancerId]);

  const jobType = (job?.type ?? "").toString().toUpperCase();
  const jobStatus = (job?.status ?? "").toString().toUpperCase();

  function budgetOrRewardText(): string {
    if (job?.budget !== null && job?.budget !== undefined)
      return `₹${Number(job.budget).toLocaleString("en-IN")}`;
    if (job?.creditReward !== null && job?.creditReward !== undefined)
      return `${job.creditReward} credits reward`;
    return "Budget / Reward: Not set";
  }

  function typeBadgeClasses(): string {
    if (jobType === "FREE") return "bg-blue-500/20 text-blue-200 border border-blue-500/30";
    if (jobType === "BID") return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";
    if (jobType === "ADMIN") return "bg-purple-500/20 text-purple-200 border border-purple-500/30";
    return "bg-slate-900/30 text-slate-200 border border-slate-700/50";
  }

  function statusBadgeClasses(): string {
    if (jobStatus === "OPEN") return "bg-slate-900/30 text-slate-200 border border-slate-700/50";
    if (jobStatus === "IN_PROGRESS") return "bg-amber-500/20 text-amber-200 border border-amber-500/30";
    if (jobStatus === "COMPLETED") return "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30";
    return "bg-slate-900/30 text-slate-200 border border-slate-700/50";
  }

  async function refreshJob(): Promise<void> {
    if (!jobId) return;
    const res = await api.get(`/jobs/${jobId}`);
    const payload = res.data?.data as { job: Job; bidsCount: number };
    setJob(payload.job);
    setBidsCount(payload.bidsCount);
  }

  async function completeJobAction(): Promise<void> {
    if (!job?.id) return;
    try {
      setActionBusy(true);
      await api.post(`/jobs/${job.id}/complete`);
      setActionMessage("Job marked as complete!");
      await refreshJob();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || "Failed to complete job.");
    } finally {
      setActionBusy(false);
    }
  }

  async function initiateEscrowPayment(): Promise<void> {
    if (!job?.id || !acceptedBid?.id) return;
    try {
      setActionBusy(true);
      await api.post("/payments/initiate", { bidId: acceptedBid.id });
      setActionMessage("✅ Payment held in escrow! Freelancer can now start work.");
      const res = await api.get(`/payments/escrow/${job.id}`);
      setEscrow(res.data?.data || null);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || "Failed to initiate payment.");
    } finally {
      setActionBusy(false);
    }
  }

  async function releaseEscrowPayment(): Promise<void> {
    if (!job?.id) return;
    try {
      setActionBusy(true);
      await api.post("/payments/release", { jobId: job.id });
      setActionMessage("✅ Payment released to freelancer!");
      const res = await api.get(`/payments/escrow/${job.id}`);
      setEscrow(res.data?.data || null);
      await refreshJob(); // updates to COMPLETED state and opens the review block intuitively natively!
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || "Failed to release payment.");
    } finally {
      setActionBusy(false);
    }
  }

  async function submitReviewAction(): Promise<void> {
    if (!job?.id) return;
    try {
      setActionBusy(true);
      await api.post("/reviews", {
        jobId: job.id,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      setActionMessage("Review submitted!");
      setReviewComment("");
      setUserHasReviewed(true);
      const res = await api.get(`/reviews/job/${job.id}`);
      setReviews(res.data?.data || []);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || "Failed to submit review.");
    } finally {
      setActionBusy(false);
    }
  }

  async function acceptJob(): Promise<void> {
    if (!job?.id || !user) return;
    setActionMessage(null);
    setActionError(null);

    if (!canAcceptJob(user, job)) {
      setActionError("Only freelancers can accept free jobs.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post(`/jobs/${job.id}/accept`);
      setActionMessage("Job accepted! You are now assigned.");
      await refreshJob();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept job.");
    } finally {
      setActionBusy(false);
    }
  }

  async function placeBid(): Promise<void> {
    if (!job?.id || !user) return;
    setActionMessage(null);
    setActionError(null);

    if (!canBid(user, job)) {
      setActionError("Only freelancers can bid on jobs.");
      return;
    }

    const amountNum = Number(amount);
    const creditsNum = Number(creditsSpent);
    const cover = coverLetter.trim();

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setActionError("Amount must be a positive number.");
      return;
    }
    if (cover.length < 10) {
      setActionError("Cover letter must be at least 10 characters.");
      return;
    }
    if (!Number.isFinite(creditsNum) || creditsNum < 0 || !Number.isInteger(creditsNum)) {
      setActionError("Credits spent must be a whole non-negative number.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post("/bids", {
        jobId: job.id,
        amount: amountNum,
        coverLetter: cover,
        creditsSpent: creditsNum,
      });
      setActionMessage("Bid placed successfully!");
      setAmount("");
      setCoverLetter("");
      setCreditsSpent("1");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to place bid.");
    } finally {
      setActionBusy(false);
    }
  }

  async function claimAdmin(): Promise<void> {
    if (!job?.id || !user) return;
    setActionMessage(null);
    setActionError(null);

    if (!canClaimAdminJob(user)) {
      setActionError("You do not have permission to claim this job.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post("/admin-jobs/claim", { jobId: job.id });
      setActionMessage("Admin job claimed.");
      await refreshJob();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to claim job.");
    } finally {
      setActionBusy(false);
    }
  }

  async function submitAdmin(): Promise<void> {
    if (!job?.id || !user) return;
    setActionMessage(null);
    setActionError(null);

    if (!canSubmitAdminWork(user, job)) {
      setActionError("Only the assigned freelancer can submit work.");
      return;
    }

    const trimmed = submission.trim();
    if (trimmed.length < 5) {
      setActionError("Submission must be at least 5 characters.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post("/admin-jobs/submit", { jobId: job.id, submission: trimmed });
      setActionMessage("Work submitted! Awaiting admin review.");
      await refreshJob();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to submit work.");
    } finally {
      setActionBusy(false);
    }
  }

  // ─── Input class ──────────────────────────────────────────────────────────────

  const inputClass =
    "w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 text-sm outline-none border border-slate-700 focus:border-slate-500 disabled:opacity-50 transition-colors";

  // ─── Action section ───────────────────────────────────────────────────────────

  function renderActionSection(): JSX.Element {
    if (!job || !user) return <></>;

    const isJobClient = isClient(user);
    const isOwnJob = job.clientId === user.id;
    const isAssigned = job.assignedFreelancerId === user.id;

    // CLIENT: owner gets "View Bids" button; non-owner gets informational message
    if (isJobClient) {
      if (isOwnJob) {
        return (
          <div className="space-y-3">
            {jobStatus === "IN_PROGRESS" && jobType !== "BID" && (
                <button
                  disabled={actionBusy}
                  onClick={completeJobAction}
                  className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-500 transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {actionBusy ? "Processing…" : "Mark as Complete"}
                </button>
            )}

            {jobType === "BID" && jobStatus === "IN_PROGRESS" && !escrowLoading && (
               <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-5 space-y-4">
                  {!escrow ? (
                    <>
                       <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide">Pay into Escrow</h4>
                       </div>
                       {acceptedBid ? (
                         <div className="space-y-2 text-sm text-slate-300">
                           <div className="flex justify-between">
                             <span>Freelancer:</span>
                             <span className="font-semibold text-white">{acceptedBid.freelancer?.fullName || "Assigned"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>Bid Amount:</span>
                             <span className="font-semibold text-white">₹{acceptedBid.amount}</span>
                           </div>
                           <div className="flex justify-between text-slate-400">
                             <span>Platform Fee (5%):</span>
                             <span>₹{(Math.round(acceptedBid.amount * 5) / 100).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-emerald-400 font-semibold border-t border-slate-700/50 pt-2 pb-1 mt-1">
                             <span>Freelancer Receives:</span>
                             <span>₹{(acceptedBid.amount - (Math.round(acceptedBid.amount * 5) / 100)).toFixed(2)}</span>
                           </div>
                           <button
                             onClick={initiateEscrowPayment}
                             disabled={actionBusy}
                             className="w-full mt-3 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                           >
                             {actionBusy ? "Processing…" : `Pay ₹${acceptedBid.amount} into Escrow`}
                           </button>
                         </div>
                       ) : (
                         <p className="text-slate-500 text-sm italic">No accepted bid found.</p>
                       )}
                    </>
                  ) : escrow.status === "HELD" ? (
                    <>
                       <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <h4 className="text-white font-bold text-sm uppercase tracking-wide">Escrow Status</h4>
                          <span className="bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded text-xs font-bold">HELD</span>
                       </div>
                       <div className="space-y-2 text-sm text-slate-300">
                          <p>🔒 ₹{escrow.amount} held in escrow</p>
                          <p className="text-slate-400 text-xs">Freelancer receives: ₹{escrow.netAmount} after {Math.round((escrow.platformFee / escrow.amount) * 100)}% platform fee</p>
                          <button
                            onClick={releaseEscrowPayment}
                            disabled={actionBusy}
                            className="w-full mt-3 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                          >
                            {actionBusy ? "Releasing…" : "Release Payment"}
                          </button>
                          <p className="text-slate-500 text-[10px] text-center uppercase tracking-widest mt-2">Releasing payment marks this Job Complete</p>
                       </div>
                    </>
                  ) : escrow.status === "RELEASED" ? (
                     <div className="text-center py-2 space-y-2">
                        <span className="text-4xl">✅</span>
                        <p className="text-emerald-400 font-bold text-sm">Payment of ₹{escrow.netAmount} released to freelancer</p>
                        <p className="text-slate-400 text-xs font-medium">Job completed successfully.</p>
                     </div>
                  ) : null}
               </div>
            )}

            <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-white font-semibold text-sm">You posted this job</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Review proposals from freelancers below.
                </p>
              </div>
              
              {/* Message Controls */}
              {user && user.id !== job.clientId && (
                 <Link
                   href={`/messages/${job.clientId}`}
                   className="mt-4 block w-full text-center rounded-xl bg-slate-700 py-2.5 font-semibold text-white hover:bg-slate-600 transition-colors"
                 >
                   Message Client
                 </Link>
              )}
              {user && user.id === job.clientId && job.assignedFreelancerId && (
                 <Link
                   href={`/messages/${job.assignedFreelancerId}`}
                   className="mt-4 block w-full text-center rounded-xl bg-slate-700 py-2.5 font-semibold text-white hover:bg-slate-600 transition-colors"
                 >
                   Message Freelancer
                 </Link>
              )}
            </div>
            {jobType === "BID" && (
              <Link
                id="view-bids-btn"
                href={`/jobs/${job.id}/bids`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
              >
                View Bids
                {bidsCount !== null && (
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs">
                    {bidsCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="text-white font-semibold text-sm">Clients cannot take actions</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Only freelancers can accept, bid on, or claim jobs.
            </p>
          </div>
        </div>
      );
    }

    // ── FREE job ──────────────────────────────────────────────────────────────
    if (jobType === "FREE") {
      const allowed = canAcceptJob(user, job);
      return (
        <div>
          {!allowed && jobStatus === "OPEN" && (
            <p className="text-slate-400 text-sm mb-3">
              {isOwnJob ? "You cannot accept your own job." : "This job is no longer open."}
            </p>
          )}
          <button
            id="accept-job-btn"
            disabled={actionBusy || !allowed}
            onClick={acceptJob}
            className={
              allowed && !actionBusy
                ? "w-full rounded-xl bg-blue-500 py-3 text-sm text-white font-semibold hover:bg-blue-600 transition-colors"
                : "w-full rounded-xl bg-slate-700 py-3 text-sm text-white font-semibold opacity-50 cursor-not-allowed"
            }
          >
            {actionBusy ? "Accepting…" : "Accept Job"}
          </button>
          {!allowed && (
            <p className="text-slate-500 text-xs mt-1.5 text-center">
              Only freelancers can accept free jobs
            </p>
          )}
        </div>
      );
    }

    // ── BID job ───────────────────────────────────────────────────────────────
    if (jobType === "BID") {
      const allowed = canBid(user, job);
      return (
        <div className="space-y-4">
          {!allowed && (
            <p className="text-slate-400 text-sm">
              {isOwnJob ? "You cannot bid on your own job." : "This job is not open for bidding."}
            </p>
          )}
          <fieldset disabled={actionBusy || !allowed} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-300 text-sm font-medium">Your price (₹)</label>
              <input
                id="bid-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min="1"
                step="0.01"
                className={inputClass}
                placeholder="e.g. 5000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 text-sm font-medium">Cover letter</label>
              <textarea
                id="bid-cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="Why you? What's your approach? (min 10 chars)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 text-sm font-medium">Credits to spend</label>
              <input
                id="bid-credits-spent"
                value={creditsSpent}
                onChange={(e) => setCreditsSpent(e.target.value)}
                type="number"
                min="0"
                step="1"
                className={inputClass}
                placeholder="e.g. 1"
              />
              <p className="text-slate-500 text-xs">
                Spending more credits can boost your bid visibility.
              </p>
            </div>

            <button
              id="submit-bid-btn"
              disabled={actionBusy || !allowed}
              onClick={placeBid}
              className={
                allowed && !actionBusy
                  ? "w-full rounded-xl bg-emerald-500 py-3 text-sm text-white font-semibold hover:bg-emerald-600 transition-colors"
                  : "w-full rounded-xl bg-slate-700 py-3 text-sm text-white font-semibold opacity-50 cursor-not-allowed"
              }
            >
              {actionBusy ? "Submitting…" : "Place Bid"}
            </button>
          </fieldset>
          {!allowed && (
            <p className="text-slate-500 text-xs text-center">Only freelancers can bid on jobs</p>
          )}
        </div>
      );
    }

    // ── ADMIN job ─────────────────────────────────────────────────────────────
    if (jobType === "ADMIN") {
      const canClaim = canClaimAdminJob(user) && !job.assignedFreelancerId;
      const canSubmit = canSubmitAdminWork(user, job);

      if (!canClaim && !canSubmit && !isAssigned) {
        return (
          <p className="text-slate-400 text-sm">
            {job.assignedFreelancerId
              ? "This admin job is already claimed by another freelancer."
              : "You do not have permission to act on this admin job."}
          </p>
        );
      }

      return (
        <div className="space-y-4">
          {canClaim && (
            <button
              id="claim-admin-btn"
              disabled={actionBusy}
              onClick={claimAdmin}
              className={
                !actionBusy
                  ? "w-full rounded-xl bg-purple-600 py-3 text-sm text-white font-semibold hover:bg-purple-700 transition-colors"
                  : "w-full rounded-xl bg-slate-700 py-3 text-sm text-white font-semibold opacity-50"
              }
            >
              {actionBusy ? "Claiming…" : "Claim Job"}
            </button>
          )}

          {canSubmit && (
            <>
              <div className="space-y-1.5">
                <label className="block text-slate-300 text-sm font-medium">Submission</label>
                <textarea
                  id="admin-submission"
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  className={`${inputClass} min-h-[110px] resize-y`}
                  placeholder="Short summary or link to deliverable (min 5 chars)"
                  disabled={actionBusy}
                />
              </div>
              <button
                id="submit-admin-btn"
                disabled={actionBusy}
                onClick={submitAdmin}
                className={
                  !actionBusy
                    ? "w-full rounded-xl bg-emerald-600 py-3 text-sm text-white font-semibold hover:bg-emerald-700 transition-colors"
                    : "w-full rounded-xl bg-slate-700 py-3 text-sm text-white font-semibold opacity-50"
                }
              >
                {actionBusy ? "Submitting…" : "Submit Work"}
              </button>
            </>
          )}
        </div>
      );
    }

    return <p className="text-slate-400 text-sm">No actions available for this job type.</p>;
  }

  // ─── Page layout ─────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-2xl space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-5">
            <h1 className="text-white text-xl font-semibold">Job details</h1>
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-white font-semibold hover:border-slate-500 transition-colors"
            >
              ← Back
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl bg-[#1e293b] border border-slate-700/60 p-8 animate-pulse space-y-4">
              <div className="h-5 bg-slate-600/60 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-5 bg-slate-600/40 rounded-full w-16" />
                <div className="h-5 bg-slate-600/40 rounded-full w-16" />
              </div>
              <div className="h-3 bg-slate-600/40 rounded w-1/2" />
              <div className="h-3 bg-slate-600/40 rounded w-1/3" />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          ) : null}

          {!loading && !error && job ? (
            <>
              {/* Job info */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <h2 className="text-white text-xl font-semibold">{job.title}</h2>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeBadgeClasses()}`}>
                    {jobType || job.type}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClasses()}`}>
                    {jobStatus || job.status}
                  </span>
                </div>

                <div className="text-slate-300 text-sm space-y-1.5">
                  <p>{budgetOrRewardText()}</p>
                  {bidsCount !== null ? (
                    <p>
                      {bidsCount} bid{bidsCount !== 1 ? "s" : ""}
                    </p>
                  ) : null}
                  {job.deadlineAt ? (
                    <p>
                      Deadline:{" "}
                      {new Date(job.deadlineAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  ) : null}
                  {job.client && (
                    <p>
                      Posted by{" "}
                      <span className="text-white font-medium">{job.client.fullName}</span>
                    </p>
                  )}
                </div>
              </section>

              {/* Description */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <p className="text-slate-400 text-xs font-medium mb-2">Description</p>
                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </section>

              {/* Action section */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-4">
                <div>
                  <h3 className="text-white text-lg font-bold">Action</h3>
                  <p className="text-slate-400 mt-1 text-sm">
                    Interact with this job based on your role.
                  </p>
                </div>

                {actionError ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                    {actionError}
                  </div>
                ) : null}
                {actionMessage ? (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-300 text-sm">
                    {actionMessage}
                  </div>
                ) : null}

                {renderActionSection()}
              </section>

              {/* Reviews Section */}
              {jobStatus === "COMPLETED" && (
                <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6 space-y-6">
                  <h3 className="text-white text-lg font-bold">Reviews</h3>
                  
                  {user && (user.id === job.clientId || user.id === job.assignedFreelancerId) && !userHasReviewed ? (
                    <div className="bg-[#0b1220] border border-slate-700/60 p-5 rounded-xl space-y-4">
                      <p className="text-slate-300 font-medium text-sm">Leave a review for your experience:</p>
                      
                      <div className="space-y-1.5 flex flex-col items-start">
                         <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold">Rating</label>
                         <StarRating value={reviewRating} onChange={setReviewRating} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold">Comment (optional)</label>
                        <textarea
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          maxLength={500}
                          className={`${inputClass} min-h-[80px] bg-[#1e293b]`}
                          placeholder="How was working with them?"
                        />
                      </div>

                      <button
                        onClick={submitReviewAction}
                        disabled={actionBusy}
                        className="rounded-xl px-5 py-2.5 w-full sm:w-auto bg-emerald-600 font-semibold text-white text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                         {actionBusy ? "Submitting…" : "Submit Review"}
                      </button>
                    </div>
                  ) : (userHasReviewed && user && (user.id === job.clientId || user.id === job.assignedFreelancerId)) ? (
                    <div className="p-4 bg-emerald-900/10 border border-emerald-900/40 rounded-xl">
                      <p className="text-emerald-400 text-sm font-medium">You have submitted your review for this completed job.</p>
                    </div>
                  ) : null}

                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map(r => (
                        <div key={r.id} className="p-5 bg-[#0b1220] shadow-md shadow-black/20 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3 mb-3">
                             {r.reviewer?.avatarUrl ? (
                               <img src={r.reviewer.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-600" />
                             ) : (
                               <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                  {r.reviewer?.fullName?.[0]}
                               </div>
                             )}
                             <div>
                               <span className="text-white font-medium text-sm block">{r.reviewer?.fullName}</span>
                               <span className="text-slate-500 text-xs block">{new Date(r.createdAt).toLocaleDateString()}</span>
                             </div>
                             <div className="ml-auto">
                                <StarRating value={r.rating} readonly />
                             </div>
                          </div>
                          {r.comment && <p className="text-slate-300 text-sm leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic bg-[#0b1220] p-4 text-center rounded-xl border border-slate-700/30">No reviews yet.</p>
                  )}
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
