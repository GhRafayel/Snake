-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "Password" DROP NOT NULL,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_provider_providerId_key" ON "Users"("provider", "providerId");
