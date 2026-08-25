-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "PointsAdjustment" ADD COLUMN     "goalId" TEXT;

-- CreateTable
CREATE TABLE "MarketingGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" INTEGER,
    "currentValue" INTEGER,
    "unit" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MarketingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingGoal_userId_idx" ON "MarketingGoal"("userId");

-- CreateIndex
CREATE INDEX "MarketingGoal_status_idx" ON "MarketingGoal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PointsAdjustment_goalId_key" ON "PointsAdjustment"("goalId");

-- AddForeignKey
ALTER TABLE "PointsAdjustment" ADD CONSTRAINT "PointsAdjustment_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MarketingGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingGoal" ADD CONSTRAINT "MarketingGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
