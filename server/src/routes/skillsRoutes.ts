import { Router } from "express";
import type { Skill, ApiResult } from "../../../shared/types";
import { getSampleSkills } from "../models/skill";

type SkillsResponse = ApiResult<Skill[]>;

export const skillsRoutes = Router();

skillsRoutes.get("/skills", (req, res): void => {
  const category =
    typeof req.query.category === "string" ? (req.query.category as Skill["category"]) : undefined;

  const verifiedOnly =
    typeof req.query.verifiedOnly === "string"
      ? req.query.verifiedOnly.toLowerCase() === "true"
      : undefined;

  const data = getSampleSkills({
    category,
    verifiedOnly
  });

  const response: SkillsResponse = { ok: true, data };
  res.status(200).json(response);
});

