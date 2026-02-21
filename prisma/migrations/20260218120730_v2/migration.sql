/*
  Warnings:

  - You are about to drop the column `BanReason` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `BannedAt` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `IsBanned` on the `DeviceFingerprint` table. All the data in the column will be lost.
  - You are about to drop the column `BanReason` on the `IPAddress` table. All the data in the column will be lost.
  - You are about to drop the column `BannedAt` on the `IPAddress` table. All the data in the column will be lost.
  - You are about to drop the column `IsBanned` on the `IPAddress` table. All the data in the column will be lost.
  - You are about to drop the column `AttemptType` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `Meta` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `Success` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `VerifiedAt` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `BanReason` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `BannedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `IsBanned` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DetectionEvent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionToken]` on the table `MetaData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[UserID,IPID,DeviceID,FirstSeenAt]` on the table `MetaData` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `LastSeenAt` to the `MetaData` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MetaData" DROP CONSTRAINT "MetaData_DeviceID_fkey";

-- DropForeignKey
ALTER TABLE "MetaData" DROP CONSTRAINT "MetaData_IPID_fkey";

-- DropIndex
DROP INDEX "DeviceFingerprint_IsBanned_idx";

-- DropIndex
DROP INDEX "IPAddress_IsBanned_idx";

-- DropIndex
DROP INDEX "MetaData_DeviceID_idx";

-- DropIndex
DROP INDEX "MetaData_IPID_idx";

-- DropIndex
DROP INDEX "MetaData_UserID_idx";

-- DropIndex
DROP INDEX "MetaData_VerifiedAt_idx";

-- DropIndex
DROP INDEX "User_IsBanned_idx";

-- DropIndex
DROP INDEX "User_TrustLevel_idx";

-- AlterTable
ALTER TABLE "DeviceFingerprint" DROP COLUMN "BanReason",
DROP COLUMN "BannedAt",
DROP COLUMN "IsBanned";

-- AlterTable
ALTER TABLE "IPAddress" DROP COLUMN "BanReason",
DROP COLUMN "BannedAt",
DROP COLUMN "IsBanned";

-- AlterTable
ALTER TABLE "MetaData" DROP COLUMN "AttemptType",
DROP COLUMN "Meta",
DROP COLUMN "Success",
DROP COLUMN "VerifiedAt",
ADD COLUMN     "BlockReason" TEXT,
ADD COLUMN     "ExpiresAt" TIMESTAMP(3),
ADD COLUMN     "ExtraData" JSONB,
ADD COLUMN     "FirstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "Headers" JSONB,
ADD COLUMN     "IsBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "LastSeenAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "RiskFlags" TEXT[],
ADD COLUMN     "TrustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "VerificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "geoLocation" JSONB,
ADD COLUMN     "sessionToken" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "BanReason",
DROP COLUMN "BannedAt",
DROP COLUMN "IsBanned";

-- DropTable
DROP TABLE "DetectionEvent";

-- CreateIndex
CREATE UNIQUE INDEX "MetaData_sessionToken_key" ON "MetaData"("sessionToken");

-- CreateIndex
CREATE INDEX "MetaData_UserID_LastSeenAt_idx" ON "MetaData"("UserID", "LastSeenAt");

-- CreateIndex
CREATE INDEX "MetaData_IPID_LastSeenAt_idx" ON "MetaData"("IPID", "LastSeenAt");

-- CreateIndex
CREATE INDEX "MetaData_DeviceID_LastSeenAt_idx" ON "MetaData"("DeviceID", "LastSeenAt");

-- CreateIndex
CREATE INDEX "MetaData_UserID_IPID_DeviceID_idx" ON "MetaData"("UserID", "IPID", "DeviceID");

-- CreateIndex
CREATE INDEX "MetaData_TrustScore_idx" ON "MetaData"("TrustScore");

-- CreateIndex
CREATE INDEX "MetaData_IsBlocked_idx" ON "MetaData"("IsBlocked");

-- CreateIndex
CREATE INDEX "MetaData_RiskFlags_idx" ON "MetaData"("RiskFlags");

-- CreateIndex
CREATE INDEX "MetaData_sessionToken_idx" ON "MetaData"("sessionToken");

-- CreateIndex
CREATE INDEX "MetaData_FirstSeenAt_idx" ON "MetaData"("FirstSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetaData_UserID_IPID_DeviceID_FirstSeenAt_key" ON "MetaData"("UserID", "IPID", "DeviceID", "FirstSeenAt");

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_IPID_fkey" FOREIGN KEY ("IPID") REFERENCES "IPAddress"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_DeviceID_fkey" FOREIGN KEY ("DeviceID") REFERENCES "DeviceFingerprint"("ID") ON DELETE CASCADE ON UPDATE CASCADE;
