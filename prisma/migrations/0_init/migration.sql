-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FIELD', 'WAREHOUSE', 'INVENTORY', 'FINANCE', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FIELD',
    "assignedProvinces" TEXT DEFAULT 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RejectionLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "targetModule" TEXT NOT NULL,
    "rejectedBy" TEXT NOT NULL,
    "rejectedByName" TEXT NOT NULL,
    "rejectedByRole" "Role" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REJECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByName" TEXT,

    CONSTRAINT "RejectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Village" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "district" TEXT,
    "province" TEXT DEFAULT 'Preah Vihear',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Village_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationRegistry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FleetVehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT,
    "maxWeightKg" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FleetVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaddyPriceSpec" (
    "id" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "maxMoisture" DOUBLE PRECISION NOT NULL DEFAULT 14.0,
    "maxForeignMatter" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "minWholeGrain" DOUBLE PRECISION DEFAULT 70.0,
    "maxBrokenRice" DOUBLE PRECISION DEFAULT 30.0,
    "impurity" DOUBLE PRECISION,
    "moistureRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaddyPriceSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerProfile" (
    "id" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "phone" TEXT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'Bank Transfer',
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolder" TEXT,
    "relationship" TEXT NOT NULL DEFAULT 'Self',
    "bankDocumentUrl" TEXT,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecsRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyCode" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "paddyType" TEXT NOT NULL,
    "selectedGrade" TEXT NOT NULL,
    "isOrganic" BOOLEAN NOT NULL DEFAULT true,
    "moisture" DOUBLE PRECISION NOT NULL,
    "foreignMatter" DOUBLE PRECISION NOT NULL,
    "purity" DOUBLE PRECISION,
    "impurity" DOUBLE PRECISION,
    "wholeGrain" DOUBLE PRECISION,
    "brokenRice" DOUBLE PRECISION,
    "isValid" BOOLEAN NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "bestQualifyingGrade" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "familyCode" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "totalPayment" DOUBLE PRECISION NOT NULL,
    "seedBorrowed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seedRepayment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seedDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalPremium" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayment" DOUBLE PRECISION NOT NULL,
    "signatureFarmer" TEXT,
    "signatureStaff" TEXT,
    "purchasingStaffId" TEXT,
    "purchasingStaffName" TEXT,
    "specsRecordId" TEXT,
    "transportRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "standardPrice" DOUBLE PRECISION NOT NULL,
    "additionalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalPrice" DOUBLE PRECISION NOT NULL,
    "sacks" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "sackWeights" TEXT,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRecord" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverName" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "truckCleaned" BOOLEAN NOT NULL DEFAULT false,
    "fieldStaffName" TEXT,
    "fieldStaffDate" TEXT,
    "fieldStaffTime" TEXT,
    "driverWitnessName" TEXT,
    "driverWitnessDate" TEXT,
    "driverWitnessTime" TEXT,
    "loadingLocation" TEXT,
    "destinationWarehouse" TEXT,
    "notes" TEXT,
    "totalSacks" INTEGER NOT NULL,
    "totalFieldWeight" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_ROUTE',
    "truckPhotoUrl" TEXT,
    "driverSignature" TEXT,
    "paymentReceiptUrl" TEXT,
    "paymentMethod" TEXT,
    "paymentBatchNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidByStaffName" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportLot" (
    "id" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "familyCode" TEXT NOT NULL,
    "farmerName" TEXT,
    "village" TEXT NOT NULL,
    "sacks" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "purchaseRecordId" TEXT,

    CONSTRAINT "TransportLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseIntake" (
    "id" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseGrossWeight" DOUBLE PRECISION NOT NULL,
    "warehouseTareWeight" DOUBLE PRECISION NOT NULL,
    "warehouseNetWeight" DOUBLE PRECISION NOT NULL,
    "weightDiffKg" DOUBLE PRECISION NOT NULL,
    "weightDiffPercent" DOUBLE PRECISION DEFAULT 0,
    "grossScalePhotoUrl" TEXT,
    "tareScalePhotoUrl" TEXT,
    "transportInvoiceUrl" TEXT,
    "receivingStaffId" TEXT NOT NULL,
    "receivingStaffName" TEXT,
    "arrivedWarehouse" TEXT,
    "notes" TEXT,
    "inventoryStatus" TEXT NOT NULL DEFAULT 'WAITING_FOR_INVENTORY',
    "inventoryStaffId" TEXT,
    "inventoryStaffName" TEXT,
    "inventoryConfirmedAt" TIMESTAMP(3),
    "inventoryLocation" TEXT,
    "inventoryNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RejectionLog_entityType_entityId_idx" ON "RejectionLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Village_name_key" ON "Village"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LocationRegistry_name_key" ON "LocationRegistry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FleetVehicle_plateNumber_key" ON "FleetVehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaddyPriceSpec_variety_grade_key" ON "PaddyPriceSpec"("variety", "grade");

-- CreateIndex
CREATE INDEX "FarmerProfile_familyCode_idx" ON "FarmerProfile"("familyCode");

-- CreateIndex
CREATE INDEX "FarmerProfile_farmerName_idx" ON "FarmerProfile"("farmerName");

-- CreateIndex
CREATE INDEX "FarmerProfile_village_idx" ON "FarmerProfile"("village");

-- CreateIndex
CREATE INDEX "FarmerProfile_createdBy_idx" ON "FarmerProfile"("createdBy");

-- CreateIndex
CREATE INDEX "SpecsRecord_familyCode_idx" ON "SpecsRecord"("familyCode");

-- CreateIndex
CREATE INDEX "SpecsRecord_farmerName_idx" ON "SpecsRecord"("farmerName");

-- CreateIndex
CREATE INDEX "SpecsRecord_village_idx" ON "SpecsRecord"("village");

-- CreateIndex
CREATE INDEX "SpecsRecord_createdBy_idx" ON "SpecsRecord"("createdBy");

-- CreateIndex
CREATE INDEX "SpecsRecord_createdAt_idx" ON "SpecsRecord"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRecord_familyCode_idx" ON "PurchaseRecord"("familyCode");

-- CreateIndex
CREATE INDEX "PurchaseRecord_farmerName_idx" ON "PurchaseRecord"("farmerName");

-- CreateIndex
CREATE INDEX "PurchaseRecord_village_idx" ON "PurchaseRecord"("village");

-- CreateIndex
CREATE INDEX "PurchaseRecord_createdBy_idx" ON "PurchaseRecord"("createdBy");

-- CreateIndex
CREATE INDEX "PurchaseRecord_specsRecordId_idx" ON "PurchaseRecord"("specsRecordId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_transportRecordId_idx" ON "PurchaseRecord"("transportRecordId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_status_idx" ON "PurchaseRecord"("status");

-- CreateIndex
CREATE INDEX "PurchaseRecord_createdAt_idx" ON "PurchaseRecord"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE INDEX "TransportRecord_createdBy_idx" ON "TransportRecord"("createdBy");

-- CreateIndex
CREATE INDEX "TransportRecord_status_idx" ON "TransportRecord"("status");

-- CreateIndex
CREATE INDEX "TransportRecord_createdAt_idx" ON "TransportRecord"("createdAt");

-- CreateIndex
CREATE INDEX "TransportLot_transportId_idx" ON "TransportLot"("transportId");

-- CreateIndex
CREATE INDEX "TransportLot_purchaseRecordId_idx" ON "TransportLot"("purchaseRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseIntake_transportId_key" ON "WarehouseIntake"("transportId");

-- CreateIndex
CREATE INDEX "WarehouseIntake_status_idx" ON "WarehouseIntake"("status");

-- CreateIndex
CREATE INDEX "WarehouseIntake_inventoryStatus_idx" ON "WarehouseIntake"("inventoryStatus");

-- CreateIndex
CREATE INDEX "WarehouseIntake_createdAt_idx" ON "WarehouseIntake"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "RejectionLog" ADD CONSTRAINT "RejectionLog_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmerProfile" ADD CONSTRAINT "FarmerProfile_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecsRecord" ADD CONSTRAINT "SpecsRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_transportRecordId_fkey" FOREIGN KEY ("transportRecordId") REFERENCES "TransportRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PurchaseRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRecord" ADD CONSTRAINT "TransportRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportLot" ADD CONSTRAINT "TransportLot_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "TransportRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseIntake" ADD CONSTRAINT "WarehouseIntake_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "TransportRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
