-- CreateIndex
CREATE UNIQUE INDEX "FarmerProfile_familyCode_village_key" ON "FarmerProfile"("familyCode", "village");

-- CreateIndex
CREATE INDEX "PurchaseRecord_familyCode_village_idx" ON "PurchaseRecord"("familyCode", "village");

-- CreateIndex
CREATE INDEX "PurchaseRecord_status_transportRecordId_idx" ON "PurchaseRecord"("status", "transportRecordId");

-- CreateIndex
CREATE INDEX "RejectionLog_entityType_entityId_status_idx" ON "RejectionLog"("entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX "SpecsRecord_familyCode_village_paddyType_selectedGrade_idx" ON "SpecsRecord"("familyCode", "village", "paddyType", "selectedGrade");

-- CreateIndex
CREATE INDEX "TransportRecord_plateNumber_idx" ON "TransportRecord"("plateNumber");

-- CreateIndex
CREATE INDEX "TransportRecord_destinationWarehouse_idx" ON "TransportRecord"("destinationWarehouse");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "Village_province_idx" ON "Village"("province");

-- CreateIndex
CREATE INDEX "Village_status_idx" ON "Village"("status");

-- CreateIndex
CREATE INDEX "WarehouseIntake_arrivedWarehouse_idx" ON "WarehouseIntake"("arrivedWarehouse");
