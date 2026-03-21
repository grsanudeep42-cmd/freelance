"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../context/AuthContext";
import { canAcceptJob, canBid, canClaimAdminJob, canSubmitAdminWork, isClient } from "../../../lib/roles";

type Job = {
  id: string;
  title: string;
  description: string;
  type: "FREE" | "BID" | "ADMIN" | string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | string;
  budget: number | null;
  creditReward?: number | null;
  assignedFreelancerId?: string | null;
  clientId: string;
  deadlineAt: string | null;
  client?: { id: string; fullName: string };
};

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

  const [amount, setAmount] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [submission, setSubmission] = useState<string>("");

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

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const jobType = (job?.type ?? "").toUpperCase();
  const jobStatus = (job?.status ?? "").toUpperCase();

  function budgetOrRewardText(): string {
    if (job?.budget !== null && job?.budget !== undefined) return `Budget: ${job.budget}`;
    if (job?.creditReward !== null && job?.creditReward !== undefined)
      return `Credit reward: ${job.creditReward}`;
    return "Budget/Reward: Not set";
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

  async function acceptJob(): Promise<void> {
    if (!job?.id || !user) return;
    setActionMessage(null);
    setActionError(null);

    // Role guard – prevent API call if not allowed
    if (!canAcceptJob(user, job)) {
      setActionError("Only freelancers can accept free jobs.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post(`/jobs/${job.id}/accept`);
      setActionMessage("Job accepted! You are now assigned.");
      // Refresh job data
      const res = await api.get(`/jobs/${job.id}`);
      const payload = res.data?.data as { job: Job; bidsCount: number };
      setJob(payload.job);
      setBidsCount(payload.bidsCount);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept job.";
      setActionError(message);
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
    const cover = coverLetter.trim();

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setActionError("Amount must be a positive number.");
      return;
    }
    if (cover.length < 10) {
      setActionError("Cover letter must be at least 10 characters.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post("/bids", { jobId: job.id, amount: amountNum, coverLetter: cover, creditsSpent: 1 });
      setActionMessage("Bid placed successfully.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to place bid.";
      setActionError(message);
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
      const res = await api.get(`/jobs/${job.id}`);
      const payload = res.data?.data as { job: Job; bidsCount: number };
      setJob(payload.job);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to claim job.";
      setActionError(message);
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

    const submissionTrimmed = submission.trim();
    if (submissionTrimmed.length < 5) {
      setActionError("Submission must be at least 5 characters.");
      return;
    }

    try {
      setActionBusy(true);
      await api.post("/admin-jobs/submit", { jobId: job.id, submission: submissionTrimmed });
      setActionMessage("Admin work submitted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit work.";
      setActionError(message);
    } finally {
      setActionBusy(false);
    }
  }

  // ─── Render action section ─────────────────────────────────────────────────

  function renderActionSection(): JSX.Element {
    if (!job || !user) return <></>;

    const isJobClient = isClient(user);
    const isOwnJob = job.clientId === user.id;
    const isAssigned = job.assignedFreelancerId === user.id;

    // CLIENT: no actions, just a message
    if (isJobClient) {
      return (
        <div className="rounded-xl border border-slate-700/60 bg-[#0b1220] p-4 flex items-center gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            {isOwnJob ? (
              <>
                <p className="text-white font-semibold text-sm">You posted this job</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Clients cannot take actions on jobs. Wait for freelancers to apply.
                </p>
              </>
            ) : (
              <>
                <p className="text-white font-semibold text-sm">Clients cannot take actions</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Only freelancers can accept, bid on, or claim jobs.
                </p>
              </>
            )}
          </div>
        </div>
      );
    }

    // FREE job
    if (jobType === "FREE") {
      const allowed = canAcceptJob(user, job);
      return (
        <div>
          {!allowed && jobStatus === "OPEN" && (
            <p className="text-slate-400 text-sm mb-3">
              {isOwnJob
                ? "You cannot accept your own job."
                : jobStatus !== "OPEN"
                  ? "This job is no longer open."
                  : "You are not eligible to accept this job."}
            </p>
          )}
          <button
            disabled={actionBusy || !allowed}
            onClick={acceptJob}
            title={!allowed ? "Only freelancers can accept free jobs" : undefined}
            className={
              allowed && !actionBusy
                ? "w-full rounded-xl bg-blue-500 py-3 text-white font-semibold hover:bg-blue-600 transition-colors"
                : "w-full rounded-xl bg-slate-700 py-3 text-white font-semibold opacity-50 cursor-not-allowed"
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

    // BID job
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
            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Amount</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500 disabled:opacity-50"
                placeholder="e.g. 500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 text-sm">Cover letter</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500 min-h-[110px] disabled:opacity-50"
                placeholder="Why you? What's your approach?"
              />
            </div>

            <button
              disabled={actionBusy || !allowed}
              onClick={placeBid}
              className={
                allowed && !actionBusy
                  ? "w-full rounded-xl bg-emerald-500 py-3 text-white font-semibold hover:bg-emerald-600 transition-colors"
                  : "w-full rounded-xl bg-slate-700 py-3 text-white font-semibold opacity-50 cursor-not-allowed"
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

    // ADMIN job
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
              disabled={actionBusy}
              onClick={claimAdmin}
              className={
                !actionBusy
                  ? "w-full rounded-xl bg-purple-600 py-3 text-white font-semibold hover:bg-purple-700 transition-colors"
                  : "w-full rounded-xl bg-slate-700 py-3 text-white font-semibold opacity-50"
              }
            >
              {actionBusy ? "Claiming…" : "Claim Job"}
            </button>
          )}

          {canSubmit && (
            <>
              <div className="space-y-1">
                <label className="text-slate-300 text-sm">Submission</label>
                <textarea
                  value={submission}
                  onChange={(e) => setSubmission(e.target.value)}
                  className="w-full rounded-xl bg-[#0f172a] text-white px-3 py-2 outline-none border border-slate-700 focus:border-slate-500 min-h-[110px]"
                  placeholder="Short summary or link (min 5 chars)"
                  disabled={actionBusy}
                />
              </div>
              <button
                disabled={actionBusy}
                onClick={submitAdmin}
                className={
                  !actionBusy
                    ? "w-full rounded-xl bg-emerald-600 py-3 text-white font-semibold hover:bg-emerald-700 transition-colors"
                    : "w-full rounded-xl bg-slate-700 py-3 text-white font-semibold opacity-50"
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

  // ─── Page layout ──────────────────────────────────────────────────────────

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
            <h1 className="text-white text-xl font-semibold">Job details</h1>
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-slate-700 px-4 py-2 text-white font-semibold bg-transparent hover:border-slate-500 transition-colors"
            >
              Back
            </button>
          </div>

          {loading ? <p className="text-slate-300">Loading…</p> : null}
          {error ? <p className="text-red-400">{error}</p> : null}

          {!loading && !error && job ? (
            <div className="space-y-4">
              {/* Job info */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <div className="space-y-4">
                  <header className="space-y-3">
                    <h2 className="text-white text-xl font-semibold">{job.title}</h2>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeClasses()}`}>
                        {jobType || job.type}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses()}`}>
                        {jobStatus || job.status}
                      </span>
                    </div>

                    <div className="text-slate-300 text-sm space-y-1">
                      <p>{budgetOrRewardText()}</p>
                      {bidsCount !== null ? <p>Bids: {bidsCount}</p> : null}
                      {job.deadlineAt ? <p>Deadline: {new Date(job.deadlineAt).toLocaleDateString()}</p> : null}
                      {job.client && (
                        <p>
                          Posted by:{" "}
                          <span className="text-white font-medium">{job.client.fullName}</span>
                        </p>
                      )}
                    </div>
                  </header>
                </div>
              </section>

              {/* Description */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <div className="rounded-xl border border-slate-700 bg-[#0b1220] p-5">
                  <p className="text-white font-semibold">Description</p>
                  <p className="text-slate-300 mt-2 whitespace-pre-wrap">{job.description}</p>
                </div>
              </section>

              {/* Action section */}
              <section className="rounded-2xl border border-slate-700 bg-[#1e293b] p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white text-lg font-bold">Action</h3>
                    <p className="text-slate-400 mt-1 text-sm">
                      Interact with this job based on your role.
                    </p>
                  </div>

                  {actionError ? (
                    <p className="text-red-400 text-sm">{actionError}</p>
                  ) : null}
                  {actionMessage ? (
                    <p className="text-emerald-300 text-sm">{actionMessage}</p>
                  ) : null}

                  {renderActionSection()}
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
