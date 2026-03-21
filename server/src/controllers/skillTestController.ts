import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../services/postgres";
import { logger } from "../utils/logger";

// ─── GET /api/skill-tests (public) ──────────────────────────────────────────

export async function getSkillTests(_req: Request, res: Response): Promise<void> {
  try {
    const tests = await prisma.skillTest.findMany({
      select: {
        id: true,
        skill: true,
        title: true,
        description: true,
        passMark: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ ok: true, data: tests });
  } catch (err) {
    logger.error("getSkillTests error", err);
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

// ─── GET /api/skill-tests/:testId/attempt-status (auth required) ───────────

export async function getAttemptStatus(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { testId } = req.params;

  try {
    const attempt = await prisma.skillTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });

    const badge = attempt?.passed
      ? await prisma.skillBadge.findFirst({ where: { userId, testId } })
      : null;

    res.json({
      ok: true,
      data: {
        attempted: !!attempt,
        passed: attempt?.passed ?? null,
        score: attempt?.score ?? null,
        badgeEarned: !!badge,
      },
    });
  } catch (err) {
    logger.error("getAttemptStatus error", err);
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

// ─── GET /api/skill-tests/:testId/questions (auth required) ─────────────────
// Returns questions WITHOUT correctIdx — never expose correct answers to client

export async function getTestQuestions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { testId } = req.params;

  try {
    // Guard: test must exist
    const test = await prisma.skillTest.findUnique({
      where: { id: testId },
      select: { id: true, title: true, description: true, passMark: true },
    });

    if (!test) {
      res.status(404).json({ ok: false, error: { message: "Test not found", code: "NOT_FOUND" } });
      return;
    }

    // Guard: user must not have already attempted
    const existing = await prisma.skillTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });

    if (existing) {
      res.status(403).json({
        ok: false,
        error: {
          message: "You have already attempted this test. One attempt per test is allowed.",
          code: "ALREADY_ATTEMPTED",
        },
      });
      return;
    }

    // Return questions without correctIdx — select explicitly
    const questions = await prisma.skillTestQuestion.findMany({
      where: { testId },
      select: {
        id: true,
        question: true,
        options: true,
        // correctIdx is intentionally EXCLUDED
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ ok: true, data: { test, questions } });
  } catch (err) {
    logger.error("getTestQuestions error", err);
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

// ─── POST /api/skill-tests/:testId/submit (auth required) ───────────────────

const SubmitAnswersSchema = z.object({
  answers: z
    .array(z.number().int().min(0).max(3))
    .min(1, "At least one answer required"),
});

export async function submitTest(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const { testId } = req.params;

  const parsed = SubmitAnswersSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: { message: parsed.error.errors[0].message, code: "BAD_REQUEST" },
    });
    return;
  }

  const { answers } = parsed.data;

  try {
    // 1. Check not already attempted (DB unique will also enforce, but return a friendly error)
    const existing = await prisma.skillTestAttempt.findUnique({
      where: { userId_testId: { userId, testId } },
    });

    if (existing) {
      res.status(403).json({
        ok: false,
        error: {
          message: "You have already attempted this test. One attempt per test is allowed.",
          code: "ALREADY_ATTEMPTED",
        },
      });
      return;
    }

    // 2. Fetch test metadata
    const test = await prisma.skillTest.findUnique({
      where: { id: testId },
      select: { id: true, skill: true, passMark: true },
    });

    if (!test) {
      res.status(404).json({ ok: false, error: { message: "Test not found", code: "NOT_FOUND" } });
      return;
    }

    // 3. Fetch questions WITH correctIdx — server-side only, never returned to client
    const questions = await prisma.skillTestQuestion.findMany({
      where: { testId },
      select: { id: true, correctIdx: true },
      orderBy: { createdAt: "asc" },
    });

    if (answers.length !== questions.length) {
      res.status(400).json({
        ok: false,
        error: {
          message: `Expected ${questions.length} answers, got ${answers.length}`,
          code: "BAD_REQUEST",
        },
      });
      return;
    }

    // 4. Score calculation
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIdx) correct++;
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= test.passMark;

    // 5. Prisma transaction: create attempt + badge if passed
    await prisma.$transaction(async (tx) => {
      await tx.skillTestAttempt.create({
        data: { userId, testId, score, passed },
      });

      if (passed) {
        await tx.skillBadge.upsert({
          where: { userId_skill: { userId, skill: test.skill } },
          create: { userId, skill: test.skill, testId },
          update: { testId, earnedAt: new Date() },
        });
      }
    });

    // Never return correctIdx or reveal correct answers
    res.json({
      ok: true,
      data: {
        score,
        passed,
        passMark: test.passMark,
        badgeEarned: passed,
      },
    });
  } catch (err) {
    logger.error("submitTest error", err);
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}

// ─── GET /api/skill-tests/badges/:userId (public) ───────────────────────────

export async function getUserBadges(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;

  try {
    const badges = await prisma.skillBadge.findMany({
      where: { userId },
      select: { skill: true, earnedAt: true },
      orderBy: { earnedAt: "desc" },
    });

    res.json({ ok: true, data: badges });
  } catch (err) {
    logger.error("getUserBadges error", err);
    res.status(500).json({ ok: false, error: { message: "Internal server error", code: "INTERNAL_SERVER_ERROR" } });
  }
}
