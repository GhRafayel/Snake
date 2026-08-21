-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "color" TEXT;
ALTER TABLE "Users" ADD COLUMN     "avatar" TEXT NOT NULL DEFAULT 'default.png';
