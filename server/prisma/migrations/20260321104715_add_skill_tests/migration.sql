-- CreateTable
CREATE TABLE "skill_tests" (
    "id" UUID NOT NULL,
    "skill" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "passMark" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_test_questions" (
    "id" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIdx" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_test_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "testId" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_badges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skill" TEXT NOT NULL,
    "testId" UUID NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_test_attempts_userId_testId_key" ON "skill_test_attempts"("userId", "testId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_badges_userId_skill_key" ON "skill_badges"("userId", "skill");

-- AddForeignKey
ALTER TABLE "skill_test_questions" ADD CONSTRAINT "skill_test_questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "skill_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_test_attempts" ADD CONSTRAINT "skill_test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_test_attempts" ADD CONSTRAINT "skill_test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "skill_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_badges" ADD CONSTRAINT "skill_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
