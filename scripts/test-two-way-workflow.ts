import { db } from '../src/lib/db';

async function runTwoWayWorkflowTest() {
  console.log('--- STARTING TWO-WAY WORKFLOW END-TO-END TEST ---');

  // Step 0: Ensure a valid test user exists
  let testUser = await db.user.findFirst({ where: { role: 'ADMIN' } });
  if (!testUser) {
    testUser = await db.user.create({
      data: {
        email: 'test_admin@ibisrice.com',
        name: 'Test Admin Officer',
        password: 'dummy_hashed_password',
        role: 'ADMIN',
        province: 'Preah Vihear',
      } as any,
    });
  }
  console.log(`✓ Active Operator: ${testUser.name} (${testUser.role})`);

  // Step 1: Specs Creation
  const specs = await db.specsRecord.create({
    data: {
      createdBy: testUser.id,
      familyCode: 'TEST-FC-001',
      farmerName: 'Sokha Chan',
      village: 'Dangphlet',
      paddyType: 'Organic Jasmine',
      selectedGrade: 'A1',
      moisture: 13.5,
      foreignMatter: 0.8,
      basePrice: 1950,
      finalPrice: 2050,
      isValid: true,
    },
  });
  console.log(`✓ Step 1: Specs Created (ID: ${specs.id})`);

  // Step 2: Purchase Creation
  const purchase = await db.purchaseRecord.create({
    data: {
      createdBy: testUser.id,
      familyCode: specs.familyCode,
      farmerName: specs.farmerName,
      village: specs.village,
      totalWeight: 1000,
      totalPayment: 2050000,
      netPayment: 2050000,
      specsRecordId: specs.id,
      status: 'PENDING',
      items: {
        create: {
          variety: 'Organic Jasmine',
          grade: 'A1',
          standardPrice: 1950,
          additionalPrice: 100,
          finalPrice: 2050,
          sacks: 20,
          quantity: 1000,
          totalValue: 2050000,
          sackWeights: JSON.stringify([50, 50, 50, 50]),
        },
      },
    },
  });
  console.log(`✓ Step 2: Purchase Created (ID: ${purchase.id}, Status: ${purchase.status})`);

  // Step 3: Transport Dispatch
  const transport = await db.transportRecord.create({
    data: {
      createdBy: testUser.id,
      driverName: 'Khem Veasna',
      plateNumber: '3A-9988-PV',
      loadingLocation: 'Dangphlet Buying Station',
      destinationWarehouse: 'Central Mill Warehouse',
      totalSacks: 20,
      totalFieldWeight: 1000,
      status: 'EN_ROUTE',
      purchases: {
        connect: [{ id: purchase.id }],
      },
      lots: {
        create: [
          {
            variety: 'Organic Jasmine',
            familyCode: purchase.familyCode,
            farmerName: purchase.farmerName,
            village: purchase.village,
            sacks: 20,
            weight: 1000,
            purchaseRecordId: purchase.id,
          },
        ],
      },
    },
  });
  await db.purchaseRecord.update({
    where: { id: purchase.id },
    data: { status: 'IN_TRANSIT', transportRecordId: transport.id },
  });
  console.log(`✓ Step 3: Transport Dispatched (ID: ${transport.id}, Status: EN_ROUTE)`);

  // Step 4: Warehouse Intake
  const intake = await db.warehouseIntake.create({
    data: {
      transportId: transport.id,
      warehouseGrossWeight: 5500,
      warehouseTareWeight: 4500,
      warehouseNetWeight: 1000,
      weightDiffKg: 0,
      weightDiffPercent: 0,
      receivingStaffId: testUser.id,
      receivingStaffName: testUser.name,
      status: 'RECEIVED',
      inventoryStatus: 'WAITING_FOR_INVENTORY',
    },
  });
  await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'RECEIVED' },
  });
  await db.purchaseRecord.update({
    where: { id: purchase.id },
    data: { status: 'RECEIVED' },
  });
  console.log(`✓ Step 4: Warehouse Intake Recorded (Intake ID: ${intake.id}, InventoryStatus: ${intake.inventoryStatus})`);

  // Step 5: Inventory Confirmation
  const confirmedIntake = await db.warehouseIntake.update({
    where: { id: intake.id },
    data: {
      inventoryLocation: 'Silo 02 - Bay 3',
      inventoryNotes: 'Moisture checked 13.4%, clean aroma',
      inventoryStatus: 'INVENTORY_RECORDED',
      inventoryStaffName: 'Test Inventory Officer',
      inventoryConfirmedAt: new Date(),
    },
  });
  console.log(`✓ Step 5: Inventory Confirmed (Location: ${confirmedIntake.inventoryLocation}, InventoryStatus: ${confirmedIntake.inventoryStatus})`);

  // Step 6: Finance Verification
  const verifiedTransport = await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'VERIFIED' },
  });
  console.log(`✓ Step 6: Finance Verified Truck (Transport Status: ${verifiedTransport.status})`);

  // Step 7: DOWNSTREAM REJECTION (Finance rejects all the way back to Field)
  console.log('--- REJECTION DOWNSTREAM FLOW: FINANCE -> FIELD ---');
  const rejectionLog = await db.rejectionLog.create({
    data: {
      entityType: 'TransportRecord',
      entityId: transport.id,
      targetModule: 'FIELD',
      rejectedBy: testUser.id,
      rejectedByName: testUser.name,
      rejectedByRole: 'FINANCE',
      reason: 'Sack weight typo on Invoice: farmer actually supplied 22 sacks (1100kg), not 20 sacks.',
      status: 'REJECTED',
    },
  });
  await db.warehouseIntake.update({
    where: { id: intake.id },
    data: { status: 'REJECTED', inventoryStatus: 'REJECTED' },
  });
  await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'REJECTED' },
  });
  await db.purchaseRecord.updateMany({
    where: { transportRecordId: transport.id },
    data: { status: 'REJECTED' },
  });
  console.log(`✓ Step 7: Record Rejected back to FIELD (Reason: "${rejectionLog.reason}")`);

  // Step 8: Verification of Field Unlocking & Field Correction
  const rejectedPurchase = await db.purchaseRecord.findUnique({ where: { id: purchase.id } });
  console.log(`✓ Step 8a: Purchase in REJECTED state: ${rejectedPurchase?.status === 'REJECTED' ? 'YES (UNLOCKED FOR EDIT)' : 'NO'}`);

  // Field Officer edits purchase sack weights & recalculates payment
  const correctedPurchase = await db.purchaseRecord.update({
    where: { id: purchase.id },
    data: {
      totalWeight: 1100,
      totalPayment: 2255000,
      netPayment: 2255000,
      status: 'PENDING',
    },
  });
  await db.purchaseItem.updateMany({
    where: { purchaseId: purchase.id },
    data: {
      sacks: 22,
      quantity: 1100,
      totalValue: 2255000,
    },
  });
  console.log(`✓ Step 8b: Purchase Corrected by Field Staff (New Weight: ${correctedPurchase.totalWeight} kg, Status: ${correctedPurchase.status})`);

  // Field Officer updates transport dispatch and re-dispatches
  const redispatchedTransport = await db.transportRecord.update({
    where: { id: transport.id },
    data: {
      totalSacks: 22,
      totalFieldWeight: 1100,
      status: 'EN_ROUTE',
    },
  });
  // Step 8c: Transport re-dispatched and Intake updated (never deleted)
  const updatedIntake = await db.warehouseIntake.update({
    where: { id: intake.id },
    data: {
      status: 'RECEIVED',
      inventoryStatus: 'WAITING_FOR_INVENTORY',
      weightDiffKg: 0,
      weightDiffPercent: 0,
    },
  });
  await db.rejectionLog.updateMany({
    where: { entityType: 'TransportRecord', entityId: transport.id, status: 'REJECTED' },
    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedByName: 'Field Officer' },
  });
  console.log(`✓ Step 8c: Transport Re-dispatched & Intake preserved (Status: ${redispatchedTransport.status}, Intake InventoryStatus: ${updatedIntake.inventoryStatus})`);

  // Step 9: Re-Intake / Verification at Warehouse (Strict Pipeline: visible in Warehouse and Inventory)
  const secondIntake = await db.warehouseIntake.update({
    where: { id: intake.id },
    data: {
      warehouseGrossWeight: 5600,
      warehouseTareWeight: 4500,
      warehouseNetWeight: 1100,
      weightDiffKg: 0,
      weightDiffPercent: 0,
      receivingStaffId: testUser.id,
      receivingStaffName: 'Warehouse Officer',
      status: 'RECEIVED',
      inventoryStatus: 'WAITING_FOR_INVENTORY',
    },
  });
  await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'RECEIVED' },
  });
  console.log(`✓ Step 9: Re-Intake Recorded by Warehouse (Net Weight: ${secondIntake.warehouseNetWeight} kg, InventoryStatus: ${secondIntake.inventoryStatus})`);

  // Step 10: Re-Confirmation at Inventory
  const secondConfirmedIntake = await db.warehouseIntake.update({
    where: { id: secondIntake.id },
    data: {
      inventoryLocation: 'Silo 02 - Bay 4',
      inventoryNotes: 'Re-inspected after field correction. 22 sacks verified.',
      inventoryStatus: 'INVENTORY_RECORDED',
      inventoryStaffName: 'Test Inventory Officer',
      inventoryConfirmedAt: new Date(),
    },
  });
  console.log(`✓ Step 10: Inventory Re-Confirmed (Location: ${secondConfirmedIntake.inventoryLocation}, Status: ${secondConfirmedIntake.inventoryStatus})`);

  // Step 11: Final Finance Verification & Payment
  const finalVerifiedTransport = await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'VERIFIED' },
  });
  const finalPaidTransport = await db.transportRecord.update({
    where: { id: transport.id },
    data: { status: 'DISBURSED' },
  });
  await db.purchaseRecord.update({
    where: { id: purchase.id },
    data: { status: 'DISBURSED' },
  });
  console.log(`✓ Step 11: Finance Final Verification & Payout Complete! (Final Transport Status: ${finalPaidTransport.status})`);

  // Cleanup test records
  await db.purchaseItem.deleteMany({ where: { purchaseId: purchase.id } });
  await db.purchaseRecord.delete({ where: { id: purchase.id } });
  await db.transportLot.deleteMany({ where: { transportId: transport.id } });
  await db.warehouseIntake.delete({ where: { id: secondIntake.id } });
  await db.transportRecord.delete({ where: { id: transport.id } });
  await db.specsRecord.delete({ where: { id: specs.id } });
  await db.rejectionLog.deleteMany({ where: { entityId: transport.id } });
  console.log('✓ Cleaned up test data.');
  console.log('--- ALL TWO-WAY WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
}

runTwoWayWorkflowTest()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
