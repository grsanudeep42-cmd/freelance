// Shared user type for the frontend.
// Backend DB enum (CUSTOMER) is mapped to "CLIENT" here for clarity.
export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  creditBalance?: number;
  avatarUrl?: string | null;
  rating?: number;
  totalRatings?: number;
  createdAt?: string;
  isVerified?: boolean;
};

export type Review = {
  id: string;
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  job?: {
    id: string;
    title: string;
  };
};
