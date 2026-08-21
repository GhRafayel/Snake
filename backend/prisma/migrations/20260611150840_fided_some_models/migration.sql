/*
  Warnings:

  - You are about to drop the column `email` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Email]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Email` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Password` to the `Users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `Username` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Users_email_key";

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "password",
ADD COLUMN     "Email" TEXT NOT NULL,
ADD COLUMN     "Password" TEXT NOT NULL,
ADD COLUMN     "Username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");
