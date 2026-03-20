import { z } from "zod";
import type { Skill } from "../../../shared/types";
import { env } from "../config/env";

export type SkillFilter = {
  category?: Skill["category"];
  verifiedOnly?: boolean;
};

const hourlyRateSchema = z.object({
  amount: z.number(),
  currency: z.string().min(1)
});

const skillSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["design", "development", "writing", "marketing", "video", "data"]),
  hourlyRate: hourlyRateSchema,
  rating: z.number(),
  verified: z.boolean()
});

const skillsSchema = z.array(skillSchema);

let cachedSampleSkills: Skill[] | null = null;

function loadSampleSkills(): Skill[] {
  if (cachedSampleSkills) return cachedSampleSkills;

  if (!env.SKILLS_SAMPLE_JSON) {
    throw new Error("SKILLS_SAMPLE_JSON must be set to use the sample /api/skills endpoint");
  }

  const raw = JSON.parse(env.SKILLS_SAMPLE_JSON) as unknown;
  cachedSampleSkills = skillsSchema.parse(raw);
  return cachedSampleSkills;
}

export function getSampleSkills(filter: SkillFilter | undefined): Skill[] {
  const sampleSkills = loadSampleSkills();

  if (!filter) return sampleSkills;

  return sampleSkills.filter((s) => {
    if (filter.category && s.category !== filter.category) return false;
    if (filter.verifiedOnly && !s.verified) return false;
    return true;
  });
}

