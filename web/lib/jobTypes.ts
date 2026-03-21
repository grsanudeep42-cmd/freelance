/**
 * Shared job and bid types for the SkillBridge frontend.
 * These mirror the Prisma DB schema and the backend API response shapes.
 */

export type JobType = "FREE" | "BID" | "ADMIN";
export type JobStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED";
export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface JobClient {
  id: string;
  fullName: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  type: JobType | string;
  status: JobStatus | string;
  budget: number | null;
  creditReward: number | null;
  clientId: string;
  assignedFreelancerId: string | null;
  adminId?: string | null;
  deadlineAt: string | null;
  platformFeePercent?: number;
  client?: JobClient;
  _count?: { bids: number };
  /** Injected by GET /jobs/:id — not present in list endpoints */
  bidsCount?: number;
}

export interface BidFreelancer {
  id: string;
  fullName: string;
}

export interface Bid {
  id: string;
  jobId: string;
  freelancerId: string;
  amount: number;
  coverLetter: string;
  status: BidStatus | string;
  creditsSpent: number;
  createdAt: string;
  freelancer?: BidFreelancer;
}
