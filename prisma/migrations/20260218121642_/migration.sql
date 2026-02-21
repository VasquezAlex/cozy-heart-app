-- AlterTable
ALTER TABLE "DeviceFingerprint" ADD COLUMN     "IsBanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "IPAddress" ADD COLUMN     "IsBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DeviceFingerprint_IsBanned_idx" ON "DeviceFingerprint"("IsBanned");

-- CreateIndex
CREATE INDEX "IPAddress_IsBanned_idx" ON "IPAddress"("IsBanned");
