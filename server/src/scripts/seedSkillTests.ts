/**
 * Seed script: populates starter SkillTest records with questions.
 * Safe to run multiple times — skips existing tests by skill.
 *
 * Usage:  npx tsx src/scripts/seedSkillTests.ts
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

interface TestSeed {
  skill: string;
  title: string;
  description: string;
  passMark: number;
  questions: {
    question: string;
    options: string[];
    correctIdx: number;
  }[];
}

const TESTS: TestSeed[] = [
  {
    skill: "React",
    title: "React Fundamentals",
    description:
      "Prove your understanding of React hooks, component lifecycle, and core patterns. Pass this test to earn a ✅ React Verified badge on your profile.",
    passMark: 70,
    questions: [
      {
        question: "Which hook lets you run a side-effect after every render?",
        options: ["useState", "useEffect", "useRef", "useCallback"],
        correctIdx: 1,
      },
      {
        question:
          "What is the correct way to pass data from a parent component to a child component in React?",
        options: [
          "Using global state only",
          "Using props",
          "Using the Context API only",
          "Directly mutating the child's state",
        ],
        correctIdx: 1,
      },
      {
        question:
          "What is the difference between `state` and `props` in React?",
        options: [
          "Props are mutable; state is immutable",
          "State is managed internally by the component; props are passed from the parent",
          "State and props are the same thing",
          "Props trigger re-renders; state does not",
        ],
        correctIdx: 1,
      },
      {
        question:
          "Which of the following `useEffect` dependency arrays causes the effect to run only once, on mount?",
        options: [
          "No dependency array at all",
          "[undefined]",
          "[]",
          "[null]",
        ],
        correctIdx: 2,
      },
      {
        question:
          "Why should each item in a React list have a unique `key` prop?",
        options: [
          "To apply CSS styles to list items",
          "To give the element a DOM id attribute",
          "To help React identify which items changed, added, or removed for efficient re-rendering",
          "To enforce alphabetical ordering of list items",
        ],
        correctIdx: 2,
      },
    ],
  },
  {
    skill: "Node.js",
    title: "Node.js Basics",
    description:
      "Validate your server-side JavaScript knowledge covering the event loop, async patterns, modules, and Express fundamentals. Pass to earn a ✅ Node.js Verified badge.",
    passMark: 70,
    questions: [
      {
        question:
          "What mechanism allows Node.js to handle many concurrent requests without creating a new thread for each one?",
        options: [
          "Multi-threading via worker threads only",
          "The event loop and non-blocking I/O",
          "Forking a new process for every request",
          "Synchronous request queuing",
        ],
        correctIdx: 1,
      },
      {
        question:
          "Which of the following correctly awaits the result of an async function?",
        options: [
          "const result = async fetchData();",
          "const result = await fetchData();",
          "const result = promise fetchData();",
          "const result = fetchData().sync();",
        ],
        correctIdx: 1,
      },
      {
        question:
          "What is the key difference between `require()` and `import` in Node.js?",
        options: [
          "They are completely identical",
          "`require` is CommonJS (synchronous); `import` is ES Modules (static, allows tree-shaking)",
          "`import` only works for JSON files",
          "`require` is async; `import` is synchronous",
        ],
        correctIdx: 1,
      },
      {
        question:
          "In Express.js, a middleware function with the signature `(err, req, res, next)` is a…",
        options: [
          "Route handler",
          "Request parser",
          "Error-handling middleware",
          "Authentication guard",
        ],
        correctIdx: 2,
      },
      {
        question:
          "Which npm command installs all dependencies listed in `package.json` without updating the lockfile?",
        options: [
          "npm install --save",
          "npm update",
          "npm ci",
          "npm add",
        ],
        correctIdx: 2,
      },
    ],
  },
];

async function main(): Promise<void> {
  console.log("🌱  Seeding skill tests…");

  for (const seed of TESTS) {
    // Skip if this skill already exists
    const existing = await prisma.skillTest.findFirst({
      where: { skill: seed.skill },
    });

    if (existing) {
      console.log(`  ⏭  Skipping "${seed.title}" — already seeded.`);
      continue;
    }

    await prisma.skillTest.create({
      data: {
        skill: seed.skill,
        title: seed.title,
        description: seed.description,
        passMark: seed.passMark,
        questions: {
          create: seed.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctIdx: q.correctIdx,
          })),
        },
      },
    });

    console.log(`  ✅  Seeded "${seed.title}" (${seed.questions.length} questions).`);
  }

  console.log("✔  Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
