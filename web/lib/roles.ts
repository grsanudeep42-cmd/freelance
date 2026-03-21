import type { User } from "./types";

type JobForGuard = {
  status?: string;
  clientId?: string;
  type?: string;
  assignedFreelancerId?: string | null;
};

export function isClient(user: User | null): boolean {
  return user?.role === "CLIENT";
}

export function isFreelancer(user: User | null): boolean {
  return user?.role === "FREELANCER";
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

/** Freelancer can accept a FREE job if it's OPEN and not their own. */
export function canAcceptJob(user: User | null, job: JobForGuard): boolean {
  if (!user || !isFreelancer(user)) return false;
  if ((job.status ?? "").toUpperCase() !== "OPEN") return false;
  if (job.clientId && job.clientId === user.id) return false;
  if (job.assignedFreelancerId) return false;
  return true;
}

/** Freelancer can bid on a BID job if it's OPEN and not their own. */
export function canBid(user: User | null, job: JobForGuard): boolean {
  if (!user || !isFreelancer(user)) return false;
  if ((job.status ?? "").toUpperCase() !== "OPEN") return false;
  if (job.clientId && job.clientId === user.id) return false;
  if (job.assignedFreelancerId) return false;
  return true;
}

/** Admin or Freelancer can claim an ADMIN job. */
export function canClaimAdminJob(user: User | null): boolean {
  return isAdmin(user) || isFreelancer(user);
}

/** Only the assigned freelancer can submit work for an ADMIN job. */
export function canSubmitAdminWork(user: User | null, job: JobForGuard): boolean {
  if (!user) return false;
  return job.assignedFreelancerId === user.id;
}
