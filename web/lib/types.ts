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
};
