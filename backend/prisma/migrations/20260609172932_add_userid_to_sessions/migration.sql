/*
  Warnings:

  - You are about to drop the column `created_at` on the `Sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `Sessions` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_hash` on the `Sessions` table. All the data in the column will be lost.
  - You are about to drop the column `revoked_at` on the `Sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Sessions` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Sessions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refreshTokenHash]` on the table `Sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `Sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshTokenHash` to the `Sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sessions" DROP CONSTRAINT "Sessions_user_id_fkey";

-- DropIndex
DROP INDEX "Sessions_refresh_token_hash_key";

-- DropIndex
DROP INDEX "Sessions_user_id_idx";

-- AlterTable
ALTER TABLE "Sessions" DROP COLUMN "created_at",
DROP COLUMN "expires_at",
DROP COLUMN "refresh_token_hash",
DROP COLUMN "revoked_at",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "refreshTokenHash" TEXT NOT NULL,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_refreshTokenHash_key" ON "Sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Sessions_userId_idx" ON "Sessions"("userId");

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
