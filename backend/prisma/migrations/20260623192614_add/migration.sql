-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'PLAYING', 'FINISHED');

-- AlterTable
ALTER TABLE "GameRoom" ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
ALTER COLUMN "name" SET DEFAULT 'Room';
