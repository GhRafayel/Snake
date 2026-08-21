/*
  Warnings:

  - You are about to drop the column `mode` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "mode",
ADD COLUMN     "theme" BOOLEAN NOT NULL DEFAULT true;
