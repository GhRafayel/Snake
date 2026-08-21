/*
  Warnings:

  - You are about to drop the column `gamesPlayed` on the `UserStats` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "UserStats_Email_idx";

-- AlterTable
ALTER TABLE "UserStats" DROP COLUMN "gamesPlayed";
