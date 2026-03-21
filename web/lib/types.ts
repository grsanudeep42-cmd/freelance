// Shared user type for the frontend.
// Backend DB enum (CUSTOMER) is mapped to "CLIENT" here for clarity.
export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";

export type SkillBadge = {
  id: string;
  skill: string;
  earnedAt: string;
};

export type FreelancerProfile = {
  id: string;
  bio: string;
  skills: string[];
  hourlyRate: number | null;
  portfolioLinks: { title: string; url: string }[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  isAgeVerified: boolean;
  profileStrength: number;
  skillPassportScore: number;
  completedJobs: number;
};

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
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  isAgeVerified?: boolean;
  freelancerProfile?: FreelancerProfile | null;
  skillBadges?: SkillBadge[];
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
