/*
  Warnings:

  - You are about to drop the column `userId` on the `UserStats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Email]` on the table `UserStats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Email` to the `UserStats` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_userId_fkey";

-- DropIndex
DROP INDEX "UserStats_userId_key";

-- AlterTable
ALTER TABLE "UserStats" DROP COLUMN "userId",
ADD COLUMN     "Email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_Email_key" ON "UserStats"("Email");

-- CreateIndex
CREATE INDEX "UserStats_Email_idx" ON "UserStats"("Email");

-- AddForeignKey
ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_Email_fkey" FOREIGN KEY ("Email") REFERENCES "Users"("Email") ON DELETE CASCADE ON UPDATE CASCADE;
