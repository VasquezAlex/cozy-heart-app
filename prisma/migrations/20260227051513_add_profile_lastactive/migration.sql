/*
  Warnings:

  - You are about to drop the column `IsBanned` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `IsBanned` on the `IPAddress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "DeviceFingerprint_IsBanned_idx";

-- DropIndex
DROP INDEX "IPAddress_IsBanned_idx";

-- DropIndex
DROP INDEX "User_UserID_idx";

-- AlterTable
ALTER TABLE "DeviceFingerprint" DROP COLUMN "IsBanned";

-- AlterTable
ALTER TABLE "IPAddress" DROP COLUMN "IsBanned";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "DiscordNickname" TEXT,
ADD COLUMN     "DiscordRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "Email" TEXT,
ADD COLUMN     "EmailVerified" TIMESTAMP(3),
ADD COLUMN     "Image" TEXT,
ADD COLUMN     "IsBooster" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Name" TEXT,
ALTER COLUMN "UserID" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "Type" TEXT NOT NULL,
    "Provider" TEXT NOT NULL,
    "ProviderAccountID" TEXT NOT NULL,
    "RefreshToken" TEXT,
    "AccessToken" TEXT,
    "ExpiresAt" INTEGER,
    "TokenType" TEXT,
    "Scope" TEXT,
    "IDToken" TEXT,
    "SessionState" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "SessionToken" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "Expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Age" INTEGER,
    "Photos" TEXT[],
    "Bio" TEXT,
    "Tags" TEXT[],
    "Verified" BOOLEAN NOT NULL DEFAULT false,
    "Region" TEXT,
    "IsVisible" BOOLEAN NOT NULL DEFAULT true,
    "LastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ban" (
    "ID" TEXT NOT NULL,
    "TargetType" TEXT NOT NULL,
    "TargetID" TEXT NOT NULL,
    "Reason" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP(3),
    "RevokedAt" TIMESTAMP(3),
    "RevokedBy" TEXT,
    "BannedBy" TEXT,
    "Details" JSONB,
    "UserID" TEXT,

    CONSTRAINT "Ban_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "Identifier" TEXT NOT NULL,
    "Token" TEXT NOT NULL,
    "Expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_Provider_ProviderAccountID_key" ON "Account"("Provider", "ProviderAccountID");

-- CreateIndex
CREATE UNIQUE INDEX "Session_SessionToken_key" ON "Session"("SessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_UserID_key" ON "Profile"("UserID");

-- CreateIndex
CREATE INDEX "Ban_TargetType_TargetID_idx" ON "Ban"("TargetType", "TargetID");

-- CreateIndex
CREATE INDEX "Ban_TargetType_TargetID_CreatedAt_idx" ON "Ban"("TargetType", "TargetID", "CreatedAt");

-- CreateIndex
CREATE INDEX "Ban_RevokedAt_idx" ON "Ban"("RevokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_Token_key" ON "VerificationToken"("Token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_Identifier_Token_key" ON "VerificationToken"("Identifier", "Token");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;
