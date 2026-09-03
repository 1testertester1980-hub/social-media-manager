-- CreateEnum
CREATE TYPE "PointsMode" AS ENUM ('STANDARD', 'SIMPLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pointsMode" "PointsMode" NOT NULL DEFAULT 'STANDARD';
