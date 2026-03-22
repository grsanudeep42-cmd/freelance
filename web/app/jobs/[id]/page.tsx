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
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
    if (jobType === "FREE") return "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30";
    if (jobType === "BID") return "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
    if (jobType === "ADMIN") return "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
    return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
  }

  function statusBadgeClasses(): string {
    if (jobStatus === "OPEN") return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (jobStatus === "IN_PROGRESS") return "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    if (jobStatus === "COMPLETED") return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
    return "bg-slate-100 dark:bg-slate-700/40 text-slate-500 border-slate-200 dark:border-slate-600";
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

  const [paymentLoading, setPaymentLoading] = useState(false);

  async function handlePayIntoEscrow() {
    if (!acceptedBid) return;
    setPaymentLoading(true);

    try {
      // Step 1: Create order on backend
      const orderRes = await api.post("/payments/initiate", {
        bidId: acceptedBid.id,
      });

      const { orderId, amount, currency, isMock } =
        orderRes.data.data;

      // Step 2: If mock mode, skip Razorpay and verify directly
      if (isMock) {
        await api.post("/payments/verify", {
          razorpay_order_id: orderId,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          jobId: job!.id,
        });
        const res = await api.get(`/payments/escrow/${job!.id}`);
        setEscrow(res.data?.data || null);
        setActionMessage("✅ Payment held in escrow! Freelancer can now start work.");
        await refreshJob();
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // paise
        currency,
        name: "SkillBridge",
        description: `Escrow for: ${job!.title}`,
        order_id: orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Step 4: Verify payment on backend
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              jobId: job!.id,
            });
            const res = await api.get(`/payments/escrow/${job!.id}`);
            setEscrow(res.data?.data || null);
            setActionMessage(
              "✅ Payment held in escrow! Freelancer can now start work."
            );
            await refreshJob();
          } catch {
            setActionError("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user?.email ?? "",
        },
        theme: {
          color: "#10b981", // emerald-500
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        setActionError("Payment failed. Please try again.");
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || "Failed to initiate payment. Please try again.");
    } finally {
      setPaymentLoading(false);
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
      await refreshJob();
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
    "w-full rounded-xl px-4 py-3 text-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors disabled:opacity-50";

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
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors py-3 disabled:opacity-50"
                >
                  {actionBusy ? "Processing…" : "Mark as Complete"}
                </button>
            )}

            {jobType === "BID" && jobStatus === "IN_PROGRESS" && !escrowLoading && (
               <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                  {!escrow ? (
                    <>
                       <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                          <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide">Pay into Escrow</h4>
                       </div>
                       {acceptedBid ? (
                         <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                           <div className="flex justify-between">
                             <span>Freelancer:</span>
                             <span className="font-semibold text-slate-900 dark:text-white">{acceptedBid.freelancer?.fullName || "Assigned"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>Bid Amount:</span>
                             <span className="font-semibold text-slate-900 dark:text-white">₹{acceptedBid.amount}</span>
                           </div>
                           <div className="flex justify-between text-slate-500 dark:text-slate-400">
                             <span>Platform Fee (5%):</span>
                             <span>₹{(Math.round(acceptedBid.amount * 5) / 100).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold border-t border-slate-200 dark:border-slate-700/50 pt-2 pb-1 mt-1">
                             <span>Freelancer Receives:</span>
                             <span>₹{(acceptedBid.amount - (Math.round(acceptedBid.amount * 5) / 100)).toFixed(2)}</span>
                           </div>
                           <button
                             onClick={handlePayIntoEscrow}
                             disabled={paymentLoading || actionBusy}
                             className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3 disabled:opacity-50"
                           >
                             {paymentLoading || actionBusy ? "Opening payment..." : `Pay ₹${acceptedBid.amount} into Escrow`}
                           </button>
                         </div>
                       ) : (
                         <p className="text-slate-500 dark:text-slate-400 text-sm italic">No accepted bid found.</p>
                       )}
                    </>
                  ) : escrow.status === "HELD" ? (
                    <>
                       <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700/50">
                          <h4 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide">Escrow Status</h4>
                          <span className="bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded text-xs font-bold">HELD</span>
                       </div>
                       <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <p>🔒 ₹{escrow.amount} held in escrow</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Freelancer receives: ₹{escrow.netAmount} after {Math.round((escrow.platformFee / escrow.amount) * 100)}% platform fee</p>
                          <button
                            onClick={releaseEscrowPayment}
                            disabled={actionBusy}
                            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3 disabled:opacity-50"
                          >
                            {actionBusy ? "Releasing…" : "Release Payment"}
                          </button>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] text-center uppercase tracking-widest mt-2">Releasing payment marks this Job Complete</p>
                       </div>
                    </>
                  ) : escrow.status === "RELEASED" ? (
                     <div className="text-center py-2 space-y-2">
                        <span className="text-4xl text-emerald-500">✅</span>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Payment of ₹{escrow.netAmount} released to freelancer</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Job completed successfully.</p>
                     </div>
                  ) : null}
               </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">You posted this job</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Review proposals from freelancers below.
                </p>
              </div>
            </div>
            {/* Message Controls */}
            {user && user.id !== job.clientId && (
               <Link
                 href={`/messages/${job.clientId}`}
                 className="mt-4 block w-full text-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl py-2.5 text-sm font-semibold transition-colors"
               >
                 Message Client
               </Link>
            )}
            {user && user.id === job.clientId && job.assignedFreelancerId && (
               <Link
                 href={`/messages/${job.assignedFreelancerId}`}
                 className="mt-4 block w-full text-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl py-2.5 text-sm font-semibold transition-colors"
               >
                 Message Freelancer
               </Link>
            )}
            {jobType === "BID" && (
              <Link
                id="view-bids-btn"
                href={`/jobs/${job.id}/bids`}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3"
              >
                View Bids
                {bidsCount !== null && (
                  <span className="bg-white/20 dark:bg-black/20 rounded-full px-2 py-0.5 text-xs text-white">
                    {bidsCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        );
      }

      return (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row items-center md:items-start gap-3">
          <span className="text-2xl mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Clients cannot act</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              {isOwnJob ? "You cannot accept your own job." : "This job is no longer open."}
            </p>
          )}
          <button
            id="accept-job-btn"
            disabled={actionBusy || !allowed}
            onClick={acceptJob}
            className={
              allowed && !actionBusy
                ? "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3"
                : "w-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-semibold rounded-xl transition-colors py-3 cursor-not-allowed opacity-50"
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
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isOwnJob ? "You cannot bid on your own job." : "This job is not open for bidding."}
            </p>
          )}
          <fieldset disabled={actionBusy || !allowed} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Your price (₹)</label>
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
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Cover letter</label>
              <textarea
                id="bid-cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className={`${inputClass} min-h-[110px] resize-y`}
                placeholder="Why you? What's your approach? (min 10 chars)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Credits to spend</label>
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
                  ? "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3"
                  : "w-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-semibold rounded-xl transition-colors py-3 cursor-not-allowed opacity-50"
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
          <p className="text-slate-500 dark:text-slate-400 text-sm">
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
                  ? "w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl transition-colors py-3"
                  : "w-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-semibold rounded-xl transition-colors py-3 cursor-not-allowed opacity-50"
              }
            >
              {actionBusy ? "Claiming…" : "Claim Job"}
            </button>
          )}

          {canSubmit && (
            <>
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium">Submission</label>
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
                    ? "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors py-3"
                    : "w-full bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-semibold rounded-xl transition-colors py-3 cursor-not-allowed opacity-50"
                }
              >
                {actionBusy ? "Submitting…" : "Submit Work"}
              </button>
            </>
          )}
        </div>
      );
    }

    return <p className="text-slate-500 dark:text-slate-400 text-sm">No actions available for this job type.</p>;
  }

  // ─── Page layout ─────────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white dark:bg-[#0A0F1E] px-4 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-6">

          {/* Header */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Job details</h1>
            <button
              onClick={() => router.back()}
              className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors px-4 py-2 text-sm font-medium"
            >
              ← Back
            </button>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16" />
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            </div>
          ) : null}

          {error ? (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : null}

          {!loading && !error && job ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job info */}
                <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{job.title}</h2>

                  <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full border ${typeBadgeClasses()}`}>
                      {jobType || job.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border ${statusBadgeClasses()}`}>
                      {jobStatus || job.status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{budgetOrRewardText()}</p>
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
                        <span className="text-slate-900 dark:text-white font-medium">{job.client.fullName}</span>
                      </p>
                    )}
                  </div>
                </section>

                {/* Description */}
                <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Description</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {job.description}
                  </p>
                </section>

                {/* Reviews Section */}
                {jobStatus === "COMPLETED" && (
                  <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reviews</h3>
                    
                    {user && (user.id === job.clientId || user.id === job.assignedFreelancerId) && !userHasReviewed ? (
                      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">Leave a review for your experience:</p>
                        
                        <div className="space-y-1.5 flex flex-col items-start">
                           <label className="block text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">Rating</label>
                           <StarRating value={reviewRating} onChange={setReviewRating} />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-semibold">Comment (optional)</label>
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            maxLength={500}
                            className={`${inputClass} min-h-[80px]`}
                            placeholder="How was working with them?"
                          />
                        </div>

                        <button
                          onClick={submitReviewAction}
                          disabled={actionBusy}
                          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors px-6 py-2.5 text-sm disabled:opacity-50"
                        >
                           {actionBusy ? "Submitting…" : "Submit Review"}
                        </button>
                      </div>
                    ) : (userHasReviewed && user && (user.id === job.clientId || user.id === job.assignedFreelancerId)) ? (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                        <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">You have submitted your review for this completed job.</p>
                      </div>
                    ) : null}

                    {reviews.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {reviews.map(r => (
                          <div key={r.id} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                               {r.reviewer?.avatarUrl ? (
                                 <img src={r.reviewer.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
                               ) : (
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                                    {r.reviewer?.fullName?.[0]}
                                 </div>
                               )}
                               <div className="flex flex-col">
                                 <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.reviewer?.fullName}</span>
                                 <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className="mb-2">
                              <StarRating value={r.rating} readonly />
                            </div>
                            {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.comment}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                       <p className="text-slate-500 dark:text-slate-400 text-sm italic">No reviews yet.</p>
                    )}
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-1">
                <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Action</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                      Interact with this job based on your role.
                    </p>
                  </div>

                  {actionError ? (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                      {actionError}
                    </div>
                  ) : null}
                  {actionMessage ? (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-700 dark:text-emerald-300 text-sm">
                      {actionMessage}
                    </div>
                  ) : null}

                  {renderActionSection()}
                </section>
              </div>

            </div>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
