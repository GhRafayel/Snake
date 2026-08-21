/*
  Warnings:

  - You are about to drop the `Friends` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('ACCEPTED', 'PENDING', 'REJECTED');

-- AlterEnum
ALTER TYPE "RoomStatus" ADD VALUE 'STARTING';

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_friendId_fkey";

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropTable
DROP TABLE "Friends";

-- DropTable
DROP TABLE "Message";

-- CreateTable
CREATE TABLE "FriendsRequest" (
    "id" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendsRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameResults" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "winnerId" INTEGER,
    "ticks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameParticipants" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "alive" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "GameParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendsRequest_senderId_receiverId_key" ON "FriendsRequest"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipants_gameId_userId_key" ON "GameParticipants"("gameId", "userId");

-- AddForeignKey
ALTER TABLE "FriendsRequest" ADD CONSTRAINT "FriendsRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendsRequest" ADD CONSTRAINT "FriendsRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResults" ADD CONSTRAINT "GameResults_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResults" ADD CONSTRAINT "GameResults_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipants" ADD CONSTRAINT "GameParticipants_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameResults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipants" ADD CONSTRAINT "GameParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
