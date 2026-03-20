import type { ApiResult, Skill } from "../types";
import { getJson } from "./http";

export async function fetchSkills(): Promise<ApiResult<Skill[]>> {
  return getJson<Skill[]>("/api/skills");
}

