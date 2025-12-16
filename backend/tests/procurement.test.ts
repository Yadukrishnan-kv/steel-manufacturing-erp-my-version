import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';
import { procurementService } from '../src/services/procurement.service';

describe('Procurement Service', () => {
  let authToken: string;
  let testBranchId: string;
  let testWarehouseId: string;
  let testSupplierId: string;
  let testInventoryItemId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.gRNItem.deleteMany({});
    await prisma.gRNRecord.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.rFQResponseItem.deleteMany({});
    await prisma.rFQResponse.deleteMany({});
    await prisma.rFQItem.deleteMany({});
    await prisma.rFQ.deleteMany({});
    await prisma.pRItem.deleteMany({});
    await prisma.purchaseRequisition.deleteMany({});
    await prisma.stockTransaction.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});

    // Create test data with unique identifiers
    const timestamp = Date.now();
    
    // Create test branch
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

    // Create test warehouse
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

    // Create test supplier
    const supplier = await prisma.supplier.create({
      data: {
        id: `test-supplier-${timestamp}`,
        code: `TEST-SUP-${timestamp}`,
        name: 'Test Supplier',
        phone: '1234567890',
        address: 'Test Supplier Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        branchId: testBranchId,
        rating: 4.5
      }
    });
    testSupplierId = supplier.id;

    // Create test inventory item
    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        id: `test-item-${timestamp}`,
        itemCode: `TEST-ITEM-${timestamp}`,
        name: 'Test Raw Material',
        category: 'RAW_MATERIAL',
        unit: 'KG',
        standardCost: 100,
        reorderLevel: 50,
        safetyStock: 20,
        warehouseId: testWarehouseId,
        currentStock: 10, // Low stock to trigger reorder
        availableStock: 10
      }
    });
    testInventoryItemId = inventoryItem.id;

    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        id: `test-user-${timestamp}`,
        email: `test-${timestamp}@example.com`,
        username: `testuser${timestamp}`,
        password: '$2b$10$hashedpassword',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    testUserId = user.id;

    // Create auth session
    const session = await prisma.userSession.create({
      data: {
        id: `test-session-${timestamp}`,
        userId: user.id,
        token: `test-token-${timestamp}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // Generate proper JWT token
    const { generateAccessToken } = await import('../src/auth/jwt');
    authToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: [],
      sessionId: session.id
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.gRNItem.deleteMany({});
    await prisma.gRNRecord.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.rFQResponseItem.deleteMany({});
    await prisma.rFQResponse.deleteMany({});
    await prisma.rFQItem.deleteMany({});
    await prisma.rFQ.deleteMany({});
    await prisma.pRItem.deleteMany({});
    await prisma.purchaseRequisition.deleteMany({});
    await prisma.stockTransaction.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.userSession.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});
    
    await prisma.$disconnect();
  });

  describe('Purchase Requisition Management', () => {
    test('should create a purchase requisition', async () => {
      const prData = {
        requestedBy: testUserId,
        department: 'PRODUCTION',
        priority: 'HIGH',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        remarks: 'Urgent requirement for production',
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100,
            estimatedCost: 10000,
            justification: 'Stock running low'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/procurement/requisitions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(prData)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.prNumber).toBeDefined();
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.items).toHaveLength(1);
    });

    test('should generate automatic PR from stock-outs', async () => {
      const stockOutData = {
        stockOutItems: [
          {
            inventoryItemId: testInventoryItemId,
            requiredQuantity: 50,
            urgency: 'HIGH'
          }
        ],
        requestedBy: testUserId,
        department: 'PROCUREMENT'
      };

      const response = await request(app)
        .post('/api/v1/procurement/requisitions/auto-generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockOutData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.prNumber).toBeDefined();
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.remarks).toContain('Auto-generated');
    });

    test('should approve a purchase requisition', async () => {
      // First create a PR
      const pr = await procurementService.createPurchaseRequisition({
        requestedBy: testUserId,
        department: 'PRODUCTION',
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 50
          }
        ]
      });

      const response = await request(app)
        .put(`/api/v1/procurement/requisitions/${pr.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.approvedBy).toBe(testUserId);
    });

    test('should get purchase requisitions with filters', async () => {
      const response = await request(app)
        .get('/api/v1/procurement/requisitions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'PENDING', department: 'PRODUCTION' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('RFQ Management', () => {
    test('should create an RFQ', async () => {
      const rfqData = {
        title: 'RFQ for Raw Materials',
        description: 'Request for quotation for steel materials',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100,
            specifications: 'Grade A steel, 10mm thickness'
          }
        ],
        supplierIds: [testSupplierId]
      };

      const response = await request(app)
        .post('/api/v1/procurement/rfq')
        .set('Authorization', `Bearer ${authToken}`)
        .send(rfqData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rfqNumber).toBeDefined();
      expect(response.body.data.status).toBe('SENT');
      expect(response.body.data.items).toHaveLength(1);
    });

    test('should submit RFQ response', async () => {
      // First create an RFQ
      const rfq = await procurementService.createRFQ({
        title: 'Test RFQ',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100
          }
        ],
        supplierIds: [testSupplierId]
      });

      const rfqItem = rfq.items[0];
      if (!rfqItem) {
        throw new Error('No RFQ item found');
      }

      const responseData = {
        rfqId: rfq.id,
        supplierId: testSupplierId,
        totalAmount: 12000,
        deliveryDays: 15,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: 'Payment within 30 days',
        items: [
          {
            rfqItemId: rfqItem.id,
            unitPrice: 120,
            totalPrice: 12000,
            remarks: 'Best quality materials'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/procurement/rfq/responses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(responseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('SUBMITTED');
      expect(response.body.data.totalAmount).toBe(12000);
    });

    test('should compare RFQ responses', async () => {
      // Create RFQ and response first
      const rfq = await procurementService.createRFQ({
        title: 'Test RFQ for Comparison',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100
          }
        ],
        supplierIds: [testSupplierId]
      });

      await procurementService.submitRFQResponse({
        rfqId: rfq.id,
        supplierId: testSupplierId,
        totalAmount: 10000,
        deliveryDays: 10,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            rfqItemId: rfq.items[0]!.id,
            unitPrice: 100,
            totalPrice: 10000
          }
        ]
      });

      const response = await request(app)
        .get(`/api/v1/procurement/rfq/${rfq.id}/comparison`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalResponses).toBe(1);
      expect(response.body.data.comparison).toHaveLength(1);
      expect(response.body.data.recommendation).toBeDefined();
    });
  });

  describe('Purchase Order Management', () => {
    test('should create a purchase order', async () => {
      const poData = {
        supplierId: testSupplierId,
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        terms: 'Payment within 30 days',
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100,
            unitPrice: 110,
            totalPrice: 11000
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/procurement/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(poData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.poNumber).toBeDefined();
      expect(response.body.data.finalAmount).toBeGreaterThan(11000); // Including tax
      expect(response.body.data.items).toHaveLength(1);
    });

    test('should approve a purchase order', async () => {
      // Create a PO that requires approval (high value)
      const po = await procurementService.createPurchaseOrder({
        supplierId: testSupplierId,
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 1000,
            unitPrice: 100,
            totalPrice: 100000 // High value requiring approval
          }
        ]
      }, testUserId);

      const response = await request(app)
        .put(`/api/v1/procurement/orders/${po.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
      expect(response.body.data.approvedBy).toBe(testUserId);
    });

    test('should get purchase order status', async () => {
      const po = await procurementService.createPurchaseOrder({
        supplierId: testSupplierId,
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 50,
            unitPrice: 100,
            totalPrice: 5000
          }
        ]
      }, testUserId);

      const response = await request(app)
        .get(`/api/v1/procurement/orders/${po.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveryStatus).toBeDefined();
      expect(response.body.data.deliveryStatus.totalQuantity).toBe(50);
      expect(response.body.data.deliveryStatus.pendingQuantity).toBe(50);
    });

    test('should get overdue purchase orders', async () => {
      // Create an overdue PO (past delivery date)
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      await procurementService.createPurchaseOrder({
        supplierId: testSupplierId,
        deliveryDate: pastDate,
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 25,
            unitPrice: 100,
            totalPrice: 2500
          }
        ]
      }, testUserId);

      const response = await request(app)
        .get('/api/v1/procurement/orders/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GRN Processing', () => {
    test('should create a GRN', async () => {
      // First create a PO
      const po = await procurementService.createPurchaseOrder({
        supplierId: testSupplierId,
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 100,
            unitPrice: 100,
            totalPrice: 10000
          }
        ]
      }, testUserId);

      const poItem = po.items[0];
      if (!poItem) {
        throw new Error('No PO item found');
      }

      const grnData = {
        poId: po.id,
        items: [
          {
            poItemId: poItem.id,
            receivedQty: 95,
            acceptedQty: 90,
            rejectedQty: 5,
            batchNumber: 'BATCH001',
            remarks: 'Minor quality issues with 5 units'
          }
        ],
        qcRemarks: 'Overall good quality'
      };

      const response = await request(app)
        .post('/api/v1/procurement/grn')
        .set('Authorization', `Bearer ${authToken}`)
        .send(grnData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grnNumber).toBeDefined();
      expect(response.body.data.qcStatus).toBe('PENDING');
      expect(response.body.data.items).toHaveLength(1);
    });

    test('should update GRN QC status', async () => {
      // Create PO and GRN first
      const po = await procurementService.createPurchaseOrder({
        supplierId: testSupplierId,
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 50,
            unitPrice: 100,
            totalPrice: 5000
          }
        ]
      }, testUserId);

      const grn = await procurementService.createGRN({
        poId: po.id,
        receivedBy: testUserId,
        items: [
          {
            poItemId: po.items[0]!.id,
            receivedQty: 50,
            acceptedQty: 50,
            rejectedQty: 0
          }
        ]
      });

      const response = await request(app)
        .put(`/api/v1/procurement/grn/${grn.id}/qc-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qcStatus: 'PASSED',
          qcRemarks: 'All items passed quality check'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.qcStatus).toBe('PASSED');
      expect(response.body.data.status).toBe('ACCEPTED');
    });
  });

  describe('Supplier Evaluation', () => {
    test('should evaluate supplier performance', async () => {
      const evaluationData = {
        supplierId: testSupplierId,
        deliveryRating: 4,
        qualityRating: 5,
        pricingRating: 3,
        evaluationPeriod: '2024-12',
        comments: 'Good quality but pricing could be better'
      };

      const response = await request(app)
        .post('/api/v1/procurement/suppliers/evaluate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(evaluationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ratings.overall).toBe(4); // Average of 4, 5, 3
    });

    test('should get supplier performance metrics', async () => {
      const response = await request(app)
        .get(`/api/v1/procurement/suppliers/${testSupplierId}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ months: 6 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.supplierId).toBe(testSupplierId);
      expect(response.body.data.metrics).toBeDefined();
    });
  });

  describe('Dashboard and Reporting', () => {
    test('should get procurement dashboard', async () => {
      const response = await request(app)
        .get('/api/v1/procurement/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.alerts).toBeDefined();
    });

    test('should get purchase requisitions with filters', async () => {
      const response = await request(app)
        .get('/api/v1/procurement/requisitions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          status: 'PENDING',
          priority: 'HIGH'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get purchase orders with filters', async () => {
      const response = await request(app)
        .get('/api/v1/procurement/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          status: 'APPROVED',
          supplierId: testSupplierId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get GRN records with filters', async () => {
      const response = await request(app)
        .get('/api/v1/procurement/grn')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          qcStatus: 'PENDING'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Inter-branch Transfer', () => {
    test('should request inter-branch transfer', async () => {
      // Create another branch for transfer
      const timestamp = Date.now();
      const toBranch = await prisma.branch.create({
        data: {
          id: `test-branch-to-${timestamp}`,
          code: `TEST-BR-TO-${timestamp}`,
          name: 'Test Branch To',
          address: 'Test Address To',
          city: 'Test City To',
          state: 'Test State',
          pincode: '654321'
        }
      });

      const transferData = {
        fromBranchId: testBranchId,
        toBranchId: toBranch.id,
        items: [
          {
            inventoryItemId: testInventoryItemId,
            requestedQty: 25,
            justification: 'Required for production at destination branch'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/procurement/inter-branch-transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transferNumber).toBeDefined();
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid PR creation', async () => {
      const invalidPRData = {
        requestedBy: '',
        department: '',
        items: []
      };

      const response = await request(app)
        .post('/api/v1/procurement/requisitions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPRData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent PO approval', async () => {
      const response = await request(app)
        .put('/api/v1/procurement/orders/non-existent-id/approve')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid GRN QC status update', async () => {
      const response = await request(app)
        .put('/api/v1/procurement/grn/non-existent-id/qc-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qcStatus: 'INVALID_STATUS'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Procurement Service Unit Tests', () => {
  let testBranchId: string;
  let testWarehouseId: string;
  let testSupplierId: string;
  let testInventoryItemId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create minimal test data for unit tests
    const timestamp = Date.now();
    
    const branch = await prisma.branch.create({
      data: {
        id: `unit-branch-${timestamp}`,
        code: `UNIT-BR-${timestamp}`,
        name: 'Unit Test Branch',
        address: 'Unit Test Address',
        city: 'Unit Test City',
        state: 'Unit Test State',
        pincode: '123456'
      }
    });
    testBranchId = branch.id;

    const warehouse = await prisma.warehouse.create({
      data: {
        id: `unit-warehouse-${timestamp}`,
        code: `UNIT-WH-${timestamp}`,
        name: 'Unit Test Warehouse',
        branchId: testBranchId,
        address: 'Unit Test Warehouse Address',
        type: 'RAW_MATERIAL'
      }
    });
    testWarehouseId = warehouse.id;

    const supplier = await prisma.supplier.create({
      data: {
        id: `unit-supplier-${timestamp}`,
        code: `UNIT-SUP-${timestamp}`,
        name: 'Unit Test Supplier',
        phone: '1234567890',
        address: 'Unit Test Supplier Address',
        city: 'Unit Test City',
        state: 'Unit Test State',
        pincode: '123456',
        branchId: testBranchId,
        rating: 4.0
      }
    });
    testSupplierId = supplier.id;

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        id: `unit-item-${timestamp}`,
        itemCode: `UNIT-ITEM-${timestamp}`,
        name: 'Unit Test Raw Material',
        category: 'RAW_MATERIAL',
        unit: 'KG',
        standardCost: 100,
        reorderLevel: 50,
        safetyStock: 20,
        warehouseId: testWarehouseId,
        currentStock: 5, // Very low stock
        availableStock: 5
      }
    });
    testInventoryItemId = inventoryItem.id;

    const user = await prisma.user.create({
      data: {
        id: `unit-user-${timestamp}`,
        email: `unit-${timestamp}@example.com`,
        username: `unituser${timestamp}`,
        password: '$2b$10$hashedpassword',
        firstName: 'Unit',
        lastName: 'User'
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up unit test data
    await prisma.gRNItem.deleteMany({});
    await prisma.gRNRecord.deleteMany({});
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.rFQResponseItem.deleteMany({});
    await prisma.rFQResponse.deleteMany({});
    await prisma.rFQItem.deleteMany({});
    await prisma.rFQ.deleteMany({});
    await prisma.pRItem.deleteMany({});
    await prisma.purchaseRequisition.deleteMany({});
    await prisma.stockTransaction.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.supplier.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.branch.deleteMany({});
  });

  test('should calculate overall score correctly in RFQ comparison', () => {
    // Test the private method through public interface
    const service = procurementService as any;
    
    // Test with good values
    const score1 = service.calculateOverallScore(50000, 10, 4.5);
    expect(score1).toBeGreaterThan(0);
    
    // Test with poor values
    const score2 = service.calculateOverallScore(200000, 25, 2.0);
    expect(score2).toBeLessThan(score1);
  });

  test('should determine PR priority correctly', () => {
    const service = procurementService as any;
    
    const urgentPriority = service.determinePRPriority([{ urgency: 'URGENT' }, { urgency: 'LOW' }]);
    expect(urgentPriority).toBe('URGENT');
    
    const mediumPriority = service.determinePRPriority([{ urgency: 'MEDIUM' }, { urgency: 'LOW' }]);
    expect(mediumPriority).toBe('MEDIUM');
    
    const lowPriority = service.determinePRPriority([{ urgency: 'LOW' }]);
    expect(lowPriority).toBe('LOW');
  });

  test('should calculate required date based on priority', () => {
    const service = procurementService as any;
    const baseDate = new Date();
    
    const urgentDate = service.calculateRequiredDate([{ urgency: 'URGENT' }]);
    const daysDiff = Math.ceil((urgentDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(1); // Next day for urgent
    
    const lowDate = service.calculateRequiredDate([{ urgency: 'LOW' }]);
    const lowDaysDiff = Math.ceil((lowDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(lowDaysDiff).toBe(14); // 2 weeks for low priority
  });

  test('should require approval for high-value POs', () => {
    const service = procurementService as any;
    
    expect(service.requiresApproval(60000)).toBe(true); // Above threshold
    expect(service.requiresApproval(30000)).toBe(false); // Below threshold
  });

  test('should calculate tax correctly', () => {
    const service = procurementService as any;
    
    const items = [
      { totalPrice: 10000 },
      { totalPrice: 5000 }
    ];
    
    const tax = service.calculateTax(items);
    expect(tax).toBe(2700); // 18% of 15000
  });
});