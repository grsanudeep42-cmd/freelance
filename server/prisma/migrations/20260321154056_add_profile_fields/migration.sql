/*
  Warnings:

  - You are about to drop the column `portfolioUrl` on the `freelancer_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "freelancer_profiles" DROP COLUMN "portfolioUrl",
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "isAgeVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "portfolioLinks" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "profileStrength" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "websiteUrl" TEXT,
ALTER COLUMN "bio" SET DEFAULT '',
ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "isAgeVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinUrl" TEXT;
