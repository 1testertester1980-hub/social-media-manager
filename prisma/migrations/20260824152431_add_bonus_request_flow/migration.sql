-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- AlterTable
ALTER TABLE "PointsAdjustment" ADD COLUMN     "decidedAt" TIMESTAMP(3),
ADD COLUMN     "requestedByWorker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "AdjustmentStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "PointsAdjustment_status_idx" ON "PointsAdjustment"("status");
