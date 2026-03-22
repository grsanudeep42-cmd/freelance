-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT;

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
