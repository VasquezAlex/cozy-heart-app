/*
  Warnings:

  - You are about to drop the column `geoLocation` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `sessionToken` on the `MetaData` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `MetaData` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[SessionToken]` on the table `MetaData` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MetaData_sessionToken_idx";

-- DropIndex
DROP INDEX "MetaData_sessionToken_key";

-- AlterTable
ALTER TABLE "MetaData" DROP COLUMN "geoLocation",
DROP COLUMN "sessionToken",
DROP COLUMN "userAgent",
ADD COLUMN     "GeoLocation" JSONB,
ADD COLUMN     "SessionToken" TEXT,
ADD COLUMN     "UserAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MetaData_SessionToken_key" ON "MetaData"("SessionToken");

-- CreateIndex
CREATE INDEX "MetaData_SessionToken_idx" ON "MetaData"("SessionToken");
