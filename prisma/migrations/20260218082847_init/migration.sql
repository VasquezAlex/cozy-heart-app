-- CreateTable
CREATE TABLE "User" (
    "ID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "Username" TEXT,
    "TrustLevel" TEXT NOT NULL DEFAULT 'NEW',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastActive" TIMESTAMP(3),
    "IsBanned" BOOLEAN NOT NULL DEFAULT false,
    "BanReason" TEXT,
    "BannedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "MetaData" (
    "ID" TEXT NOT NULL,
    "UserID" TEXT NOT NULL,
    "IPID" TEXT NOT NULL,
    "DeviceID" TEXT NOT NULL,
    "VerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AttemptType" TEXT NOT NULL DEFAULT 'INITIAL',
    "Success" BOOLEAN NOT NULL DEFAULT true,
    "Meta" JSONB,

    CONSTRAINT "MetaData_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "IPAddress" (
    "ID" TEXT NOT NULL,
    "IPHash" TEXT NOT NULL,
    "Details" JSONB,
    "IsBanned" BOOLEAN NOT NULL DEFAULT false,
    "BanReason" TEXT,
    "BannedAt" TIMESTAMP(3),

    CONSTRAINT "IPAddress_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "ID" TEXT NOT NULL,
    "Fingerprint" TEXT NOT NULL,
    "Details" JSONB,
    "IsBanned" BOOLEAN NOT NULL DEFAULT false,
    "BanReason" TEXT,
    "BannedAt" TIMESTAMP(3),

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "DetectionEvent" (
    "ID" TEXT NOT NULL,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TargetUserID" TEXT NOT NULL,
    "TargetUsername" TEXT,
    "Severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "Evidence" JSONB,
    "Action" JSONB,

    CONSTRAINT "DetectionEvent_pkey" PRIMARY KEY ("ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UserID_key" ON "User"("UserID");

-- CreateIndex
CREATE INDEX "User_UserID_idx" ON "User"("UserID");

-- CreateIndex
CREATE INDEX "User_TrustLevel_idx" ON "User"("TrustLevel");

-- CreateIndex
CREATE INDEX "User_IsBanned_idx" ON "User"("IsBanned");

-- CreateIndex
CREATE INDEX "MetaData_UserID_idx" ON "MetaData"("UserID");

-- CreateIndex
CREATE INDEX "MetaData_IPID_idx" ON "MetaData"("IPID");

-- CreateIndex
CREATE INDEX "MetaData_DeviceID_idx" ON "MetaData"("DeviceID");

-- CreateIndex
CREATE INDEX "MetaData_VerifiedAt_idx" ON "MetaData"("VerifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IPAddress_IPHash_key" ON "IPAddress"("IPHash");

-- CreateIndex
CREATE INDEX "IPAddress_IPHash_idx" ON "IPAddress"("IPHash");

-- CreateIndex
CREATE INDEX "IPAddress_IsBanned_idx" ON "IPAddress"("IsBanned");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFingerprint_Fingerprint_key" ON "DeviceFingerprint"("Fingerprint");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_Fingerprint_idx" ON "DeviceFingerprint"("Fingerprint");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_IsBanned_idx" ON "DeviceFingerprint"("IsBanned");

-- CreateIndex
CREATE INDEX "DetectionEvent_TargetUserID_idx" ON "DetectionEvent"("TargetUserID");

-- CreateIndex
CREATE INDEX "DetectionEvent_Timestamp_idx" ON "DetectionEvent"("Timestamp");

-- CreateIndex
CREATE INDEX "DetectionEvent_Severity_idx" ON "DetectionEvent"("Severity");

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_IPID_fkey" FOREIGN KEY ("IPID") REFERENCES "IPAddress"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetaData" ADD CONSTRAINT "MetaData_DeviceID_fkey" FOREIGN KEY ("DeviceID") REFERENCES "DeviceFingerprint"("ID") ON DELETE RESTRICT ON UPDATE CASCADE;
