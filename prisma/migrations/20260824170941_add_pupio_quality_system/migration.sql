-- CreateEnum
CREATE TYPE "AdjustmentCategory" AS ENUM ('GENERAL', 'PUPIO_QUALITY');

-- AlterTable
ALTER TABLE "PointsAdjustment" ADD COLUMN     "category" "AdjustmentCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "decidedAmount" INTEGER,
ADD COLUMN     "prepMinutes" INTEGER,
ADD COLUMN     "taskId" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "dailyReelCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualityTracked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PointsAdjustment_taskId_idx" ON "PointsAdjustment"("taskId");

-- AddForeignKey
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "ContentTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
