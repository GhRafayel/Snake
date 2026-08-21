/*
  Warnings:

  - The values [FRIEND] on the enum `FriendStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,friendId]` on the table `Friend` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Friend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FriendStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
ALTER TABLE "public"."Friend" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Friend" ALTER COLUMN "status" TYPE "FriendStatus_new" USING ("status"::text::"FriendStatus_new");
ALTER TYPE "FriendStatus" RENAME TO "FriendStatus_old";
ALTER TYPE "FriendStatus_new" RENAME TO "FriendStatus";
DROP TYPE "public"."FriendStatus_old";
ALTER TABLE "Friend" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Friend" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Friend_userId_friendId_key" ON "Friend"("userId", "friendId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
