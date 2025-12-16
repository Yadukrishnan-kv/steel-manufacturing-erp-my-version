import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';
import { inventoryService } from '../src/services/inventory.service';

describe('Inventory Service', () => {
  let authToken: string;
  let testWarehouseId: string;
  let testBranchId: string;

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.stockTransaction.deleteMany({});
    await prisma.batchRecord.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.stockTransferItem.deleteMany({});
    await prisma.stockTransfer.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.bin.deleteMany({});
    await prisma.rack.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});

    // Create test branch and warehouse with unique identifiers
    const timestamp = Date.now();
    const branch = await prisma.branch.create({
      data: {
        id: `test-branch-${timestamp}`,
        code: `TEST-BR-${timestamp}`,
        name: 'Test Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    });
    testBranchId = branch.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        id: `test-warehouse-${timestamp}`,
        code: `TEST-WH-${timestamp}`,
        name: 'Test Warehouse',
        branchId: testBranchId,
        address: 'Test Warehouse Address',
        type: 'RAW_MATERIAL'
      }
    });
    testWarehouseId = warehouse.id;

    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        id: `test-user-${timestamp}`,
        email: `test-${timestamp}@example.com`,
        username: `testuser-${timestamp}`,
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      }
    });

    // Create session for auth
    const session = await prisma.userSession.create({
      data: {
        id: `test-session-${timestamp}`,
        userId: user.id,
        token: `test-token-${timestamp}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    authToken = `Bearer test-token-${timestamp}`;
  });

  afterAll(async () => {
    // Clean up test data in correct order to avoid foreign key constraints
    await prisma.stockTransaction.deleteMany({});
    await prisma.batchRecord.deleteMany({});
    await prisma.alert.deleteMany({});
    await prisma.stockTransferItem.deleteMany({});
    await prisma.stockTransfer.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.bin.deleteMany({});
    await prisma.rack.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});
  });

  describe('Inventory Item Management', () => {
    it('should create a new inventory item', async () => {
      const itemData = {
        itemCode: 'TEST-ITEM-001',
        name: 'Test Item',
        description: 'Test item description',
        category: 'RAW_MATERIAL' as const,
        unit: 'KG',
        standardCost: 100,
        reorderLevel: 10,
        safetyStock: 5,
        leadTimeDays: 7,
        isBatchTracked: true,
        warehouseId: testWarehouseId
      };

      const inventoryItem = await inventoryService.createInventoryItem(itemData);

      expect(inventoryItem).toBeDefined();
      expect(inventoryItem.itemCode).toBe(itemData.itemCode);
      expect(inventoryItem.name).toBe(itemData.name);
      expect(inventoryItem.category).toBe(itemData.category);
      expect(inventoryItem.barcode).toBeDefined();
      expect(inventoryItem.warehouseId).toBe(testWarehouseId);
    });

    it('should get inventory items by warehouse', async () => {
      const items = await inventoryService.getInventoryItemsByWarehouse(testWarehouseId);
      
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      if (items.length > 0) {
        expect(items[0]!.warehouseId).toBe(testWarehouseId);
      }
    });

    it('should generate unique barcodes', () => {
      const barcode1 = inventoryService.generateBarcode('TEST-001');
      const barcode2 = inventoryService.generateBarcode('TEST-001');
      
      expect(barcode1).toBeDefined();
      expect(barcode2).toBeDefined();
      expect(barcode1).not.toBe(barcode2); // Should be unique due to timestamp
    });
  });

  describe('Location Assignment', () => {
    let testItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'TEST-LOCATION-ITEM',
        name: 'Test Location Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      testItemId = item.id;
    });

    it('should assign rack and bin location to inventory item', async () => {
      const locationData = {
        inventoryItemId: testItemId,
        warehouseId: testWarehouseId,
        rackCode: 'R001',
        binCode: 'B001'
      };

      const updatedItem = await inventoryService.assignLocation(locationData);

      expect(updatedItem).toBeDefined();
      expect(updatedItem.binId).toBeDefined();
      expect(updatedItem.bin?.code).toBe('B001');
      expect(updatedItem.bin?.rack?.code).toBe('R001');
    });

    it('should get locations by warehouse', async () => {
      const locations = await inventoryService.getLocationsByWarehouse(testWarehouseId);
      
      expect(Array.isArray(locations)).toBe(true);
      expect(locations.length).toBeGreaterThan(0);
      if (locations.length > 0) {
        expect(locations[0]!.warehouseId).toBe(testWarehouseId);
      }
    });
  });

  describe('Batch Tracking', () => {
    let testItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'TEST-BATCH-ITEM',
        name: 'Test Batch Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'KG',
        isBatchTracked: true,
        warehouseId: testWarehouseId
      });
      testItemId = item.id;
    });

    it('should create batch record', async () => {
      const batchData = {
        batchNumber: 'BATCH-001',
        inventoryItemId: testItemId,
        quantity: 100,
        manufactureDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        supplierLot: 'SUP-LOT-001',
        receivedDate: new Date()
      };

      const batch = await inventoryService.createBatchRecord(batchData);

      expect(batch).toBeDefined();
      expect(batch.batchNumber).toBe(batchData.batchNumber);
      expect(batch.quantity).toBe(batchData.quantity);
      expect(batch.status).toBe('ACTIVE');
    });

    it('should get batches by item', async () => {
      const batches = await inventoryService.getBatchesByItem(testItemId);
      
      expect(Array.isArray(batches)).toBe(true);
      expect(batches.length).toBeGreaterThan(0);
      if (batches.length > 0) {
        expect(batches[0]!.inventoryItemId).toBe(testItemId);
      }
    });
  });

  describe('Stock Transactions', () => {
    let testItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'TEST-STOCK-ITEM',
        name: 'Test Stock Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      testItemId = item.id;
    });

    it('should record stock IN transaction', async () => {
      const transactionData = {
        transactionType: 'IN' as const,
        inventoryItemId: testItemId,
        warehouseId: testWarehouseId,
        quantity: 50,
        unitCost: 10,
        referenceType: 'PURCHASE_ORDER',
        referenceId: 'PO-001',
        remarks: 'Initial stock'
      };

      const transaction = await inventoryService.recordStockTransaction(transactionData);

      expect(transaction).toBeDefined();
      expect(transaction.transactionType).toBe('IN');
      expect(transaction.quantity).toBe(50);
      expect(transaction.totalValue).toBe(500); // 50 * 10
    });

    it('should update stock levels after transaction', async () => {
      // Get updated item to check stock levels
      const items = await inventoryService.getMultiWarehouseStock('TEST-STOCK-ITEM');
      expect(items.length).toBeGreaterThan(0);
      
      if (items.length > 0) {
        const item = items[0]!;
        expect(item.currentStock).toBe(50);
        expect(item.availableStock).toBe(50);
      }
    });
  });

  describe('Safety Stock Monitoring', () => {
    let lowStockItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'LOW-STOCK-ITEM',
        name: 'Low Stock Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        reorderLevel: 20,
        safetyStock: 10,
        warehouseId: testWarehouseId
      });
      lowStockItemId = item.id;

      // Set current stock below safety level
      await prisma.inventoryItem.update({
        where: { id: lowStockItemId },
        data: {
          currentStock: 5,
          availableStock: 5
        }
      });
    });

    it('should identify items below safety stock', async () => {
      const lowStockItems = await inventoryService.getItemsBelowSafetyStock();
      
      expect(Array.isArray(lowStockItems)).toBe(true);
      const lowStockItem = lowStockItems.find(item => item.id === lowStockItemId);
      expect(lowStockItem).toBeDefined();
      expect(lowStockItem!.currentStock).toBeLessThanOrEqual(lowStockItem!.safetyStock);
    });

    it('should generate reorder alerts', async () => {
      const alerts = await inventoryService.checkAndGenerateReorderAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
      
      const safetyStockAlert = alerts.find(alert => 
        alert.type === 'SAFETY_STOCK_BREACH' && alert.referenceId === lowStockItemId
      );
      expect(safetyStockAlert).toBeDefined();
    });
  });

  describe('Inventory Valuation', () => {
    let valuationItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'VALUATION-ITEM',
        name: 'Valuation Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      valuationItemId = item.id;

      // Add multiple stock transactions with different costs
      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: valuationItemId,
        warehouseId: testWarehouseId,
        quantity: 10,
        unitCost: 100
      });

      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: valuationItemId,
        warehouseId: testWarehouseId,
        quantity: 20,
        unitCost: 150
      });
    });

    it('should calculate FIFO valuation', async () => {
      const valuation = await inventoryService.calculateInventoryValuation('FIFO', testWarehouseId);
      
      expect(Array.isArray(valuation)).toBe(true);
      const itemValuation = valuation.find(v => v.inventoryItemId === valuationItemId);
      expect(itemValuation).toBeDefined();
      expect(itemValuation!.method).toBe('FIFO');
      expect(itemValuation!.valuation).toBeGreaterThan(0);
    });

    it('should calculate weighted average valuation', async () => {
      const valuation = await inventoryService.calculateInventoryValuation('WEIGHTED_AVERAGE', testWarehouseId);
      
      expect(Array.isArray(valuation)).toBe(true);
      const itemValuation = valuation.find(v => v.inventoryItemId === valuationItemId);
      expect(itemValuation).toBeDefined();
      expect(itemValuation!.method).toBe('WEIGHTED_AVERAGE');
      expect(itemValuation!.valuation).toBeGreaterThan(0);
    });
  });

  describe('Order-wise Material Allocation and Reservation', () => {
    let reservationItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'RESERVATION-ITEM',
        name: 'Reservation Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      reservationItemId = item.id;

      // Add initial stock
      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: reservationItemId,
        warehouseId: testWarehouseId,
        quantity: 100
      });
    });

    it('should reserve materials for an order', async () => {
      const orderId = 'ORDER-001';
      const orderType = 'SALES_ORDER';
      const items = [{
        inventoryItemId: reservationItemId,
        quantity: 25,
        rackCode: 'R001',
        binCode: 'B001'
      }];

      const reservations = await inventoryService.reserveOrderMaterials(orderId, orderType, items);

      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBe(1);
      expect(reservations[0]!.transactionType).toBe('RESERVATION');
      expect(reservations[0]!.quantity).toBe(25);
      expect(reservations[0]!.referenceId).toBe(orderId);
    });

    it('should update stock levels after reservation', async () => {
      const items = await inventoryService.getMultiWarehouseStock('RESERVATION-ITEM');
      expect(items.length).toBeGreaterThan(0);
      
      if (items.length > 0) {
        const item = items[0]!;
        expect(item.reservedStock).toBe(25);
        expect(item.availableStock).toBe(75); // 100 - 25 reserved
      }
    });

    it('should release order reservations', async () => {
      const orderId = 'ORDER-001';
      const orderType = 'SALES_ORDER';

      const releasedCount = await inventoryService.releaseOrderReservation(orderId, orderType);

      expect(releasedCount).toBe(1);

      // Check stock levels after release
      const items = await inventoryService.getMultiWarehouseStock('RESERVATION-ITEM');
      if (items.length > 0) {
        const item = items[0]!;
        expect(item.reservedStock).toBe(0);
        expect(item.availableStock).toBe(100); // Back to original
      }
    });

    it('should throw error when insufficient stock for reservation', async () => {
      const orderId = 'ORDER-002';
      const orderType = 'SALES_ORDER';
      const items = [{
        inventoryItemId: reservationItemId,
        quantity: 150 // More than available
      }];

      await expect(
        inventoryService.reserveOrderMaterials(orderId, orderType, items)
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('Cycle Counting and Stock Adjustment', () => {
    let cycleCountItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'CYCLE-COUNT-ITEM',
        name: 'Cycle Count Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      cycleCountItemId = item.id;

      // Add initial stock
      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: cycleCountItemId,
        warehouseId: testWarehouseId,
        quantity: 50
      });
    });

    it('should perform cycle count with adjustments', async () => {
      const items = [{
        inventoryItemId: cycleCountItemId,
        countedQuantity: 48, // 2 less than system quantity
        remarks: 'Physical count variance'
      }];

      const result = await inventoryService.createCycleCount(testWarehouseId, items, 'test-user');

      expect(result.cycleCountId).toBeDefined();
      expect(result.adjustments.length).toBe(1);
      expect(result.adjustments[0]!.variance).toBe(-2);
      expect(result.adjustments[0]!.countedQuantity).toBe(48);
      expect(result.adjustments[0]!.systemQuantity).toBe(50);
    });

    it('should perform manual stock adjustment', async () => {
      const adjustment = await inventoryService.performStockAdjustment(
        cycleCountItemId,
        45,
        'Damaged goods removed',
        'test-user'
      );

      expect(adjustment.variance).toBe(-3); // 48 - 45
      expect(adjustment.newQuantity).toBe(45);
      expect(adjustment.previousQuantity).toBe(48);
    });
  });

  describe('Goods Receipt and Put-away', () => {
    let grnItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'GRN-ITEM',
        name: 'GRN Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'KG',
        isBatchTracked: true,
        warehouseId: testWarehouseId
      });
      grnItemId = item.id;
    });

    it('should process goods receipt with batch tracking', async () => {
      const grnData = {
        grnNumber: 'GRN-001',
        poId: 'PO-001',
        items: [{
          inventoryItemId: grnItemId,
          receivedQuantity: 100,
          batchNumber: 'BATCH-GRN-001',
          expiryDate: new Date('2024-12-31'),
          rackCode: 'R002',
          binCode: 'B002'
        }],
        receivedBy: 'test-user'
      };

      const receipts = await inventoryService.processGoodsReceipt(grnData);

      expect(Array.isArray(receipts)).toBe(true);
      expect(receipts.length).toBe(1);
      expect(receipts[0]!.transactionType).toBe('IN');
      expect(receipts[0]!.quantity).toBe(100);
      expect(receipts[0]!.referenceId).toBe('GRN-001');
    });

    it('should process put-away operation', async () => {
      const putAwayData = {
        inventoryItemId: grnItemId,
        fromLocation: { rackCode: 'R002', binCode: 'B002' },
        toLocation: { rackCode: 'R003', binCode: 'B003' },
        quantity: 50,
        putAwayBy: 'test-user'
      };

      const putAway = await inventoryService.processPutAway(putAwayData);

      expect(putAway.transactionType).toBe('TRANSFER');
      expect(putAway.quantity).toBe(50);
      expect(putAway.remarks).toContain('Put-away from R002-B002 to R003-B003');
    });
  });

  describe('Enhanced Stock Transfer Workflows', () => {
    let transferItemId: string;
    let transferId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'TRANSFER-ITEM',
        name: 'Transfer Item',
        category: 'RAW_MATERIAL' as const,
        unit: 'PCS',
        warehouseId: testWarehouseId
      });
      transferItemId = item.id;

      // Add initial stock
      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: transferItemId,
        warehouseId: testWarehouseId,
        quantity: 100
      });

      // Create a stock transfer
      const transfer = await inventoryService.createStockTransfer({
        fromBranchId: testBranchId,
        toBranchId: testBranchId, // Same branch for testing
        items: [{
          inventoryItemId: transferItemId,
          requestedQty: 30
        }],
        remarks: 'Test transfer',
        createdBy: 'test-user'
      });
      transferId = transfer.id;
    });

    it('should process stock transfer shipment', async () => {
      const shippedItems = [{
        inventoryItemId: transferItemId,
        shippedQty: 30
      }];

      const transfer = await inventoryService.processStockTransferShipment(
        transferId,
        shippedItems,
        'test-user'
      );

      expect(transfer!.status).toBe('IN_TRANSIT');
      expect(transfer!.shippedDate).toBeDefined();
      expect(transfer!.items[0]!.shippedQty).toBe(30);
    });

    it('should process stock transfer receipt', async () => {
      const receivedItems = [{
        inventoryItemId: transferItemId,
        receivedQty: 30,
        rackCode: 'R004',
        binCode: 'B004'
      }];

      const transfer = await inventoryService.processStockTransferReceipt(
        transferId,
        receivedItems,
        'test-user'
      );

      expect(transfer!.status).toBe('RECEIVED');
      expect(transfer!.receivedDate).toBeDefined();
      expect(transfer!.items[0]!.receivedQty).toBe(30);
    });
  });

  describe('Stock Inquiry and Reporting', () => {
    let inquiryItemId: string;

    beforeAll(async () => {
      const item = await inventoryService.createInventoryItem({
        itemCode: 'INQUIRY-ITEM',
        name: 'Inquiry Item',
        category: 'FINISHED_GOOD' as const,
        unit: 'PCS',
        reorderLevel: 20,
        safetyStock: 10,
        standardCost: 50, // Add standard cost for aging report
        warehouseId: testWarehouseId
      });
      inquiryItemId = item.id;

      // Add stock transactions for reporting
      await inventoryService.recordStockTransaction({
        transactionType: 'IN',
        inventoryItemId: inquiryItemId,
        warehouseId: testWarehouseId,
        quantity: 15, // Below reorder level
        unitCost: 50
      });
    });

    it('should perform stock inquiry with filters', async () => {
      const inquiry = await inventoryService.getStockInquiry({
        category: 'FINISHED_GOOD',
        lowStock: true,
        warehouseId: testWarehouseId
      });

      expect(inquiry.items).toBeDefined();
      expect(inquiry.summary).toBeDefined();
      expect(inquiry.summary.lowStockItems).toBeGreaterThan(0);

      const inquiryItem = inquiry.items.find(item => item.id === inquiryItemId);
      expect(inquiryItem).toBeDefined();
    });

    it('should generate stock movement report', async () => {
      const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const dateTo = new Date();

      const report = await inventoryService.getStockMovementReport({
        dateFrom,
        dateTo,
        warehouseId: testWarehouseId
      });

      expect(report.transactions).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTransactions).toBeGreaterThan(0);
      expect(report.period.from).toEqual(dateFrom);
      expect(report.period.to).toEqual(dateTo);
    });

    it('should generate inventory aging report', async () => {
      const aging = await inventoryService.getInventoryAging(testWarehouseId);

      expect(aging.items).toBeDefined();
      expect(aging.summary).toBeDefined();
      expect(aging.totalItems).toBeGreaterThan(0);
      expect(aging.totalValue).toBeGreaterThan(0);

      const agingItem = aging.items.find(item => item.inventoryItemId === inquiryItemId);
      expect(agingItem).toBeDefined();
      expect(agingItem!.agingCategory).toBeDefined();
    });
  });
});