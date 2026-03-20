export type ID = string;

export type MoneyAmount = {
  amount: number; // in minor currency units (e.g. cents)
  currency: string; // ISO 4217 code
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

export type SkillCategory =
  | "design"
  | "development"
  | "writing"
  | "marketing"
  | "video"
  | "data";

export type Skill = {
  id: ID;
  title: string;
  category: SkillCategory;
  hourlyRate: MoneyAmount;
  rating: number; // 0-5
  verified: boolean;
};

export type ApiError = {
  message: string;
  code?: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

