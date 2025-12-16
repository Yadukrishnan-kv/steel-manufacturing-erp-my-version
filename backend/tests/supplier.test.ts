import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/database/connection';
import { supplierService } from '../src/services/supplier.service';

// Mock authentication middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      roles: ['ADMIN'],
      sessionId: 'test-session-id'
    };
    next();
  },
  authorize: () => (req: any, res: any, next: any) => next(),
  authorizeRoles: () => (req: any, res: any, next: any) => next()
}));

describe('Supplier Management', () => {
  let authToken: string;
  let testBranchId: string;
  let testSupplierId: string;

  beforeAll(async () => {
    // Create test branch
    const branch = await prisma.branch.create({
      data: {
        id: 'test-branch-supplier',
        code: 'TSB',
        name: 'Test Supplier Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    });
    testBranchId = branch.id;

    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        id: 'test-user-supplier',
        email: 'supplier.test@example.com',
        username: 'suppliertest',
        password: 'hashedpassword',
        firstName: 'Supplier',
        lastName: 'Test'
      }
    });

    // Mock authentication for tests
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.supplier.deleteMany({
      where: { branchId: testBranchId }
    });
    await prisma.user.deleteMany({
      where: { email: 'supplier.test@example.com' }
    });
    await prisma.branch.deleteMany({
      where: { id: testBranchId }
    });
  });

  describe('Supplier Master Data Management', () => {
    test('should create a new supplier with complete details', async () => {
      const supplierData = {
        code: 'SUP001',
        name: 'Test Supplier Ltd',
        email: 'contact@testsupplier.com',
        phone: '9876543210',
        address: '123 Supplier Street',
        city: 'Supplier City',
        state: 'Supplier State',
        pincode: '654321',
        gstNumber: '29ABCDE1234F1Z5',
        branchId: testBranchId,
        rating: 4.5,
        isActive: true
      };

      const supplier = await supplierService.createSupplier(supplierData, 'test-user');
      testSupplierId = supplier.id;

      expect(supplier).toBeDefined();
      expect(supplier.code).toBe(supplierData.code);
      expect(supplier.name).toBe(supplierData.name);
      expect(supplier.email).toBe(supplierData.email);
      expect(supplier.branchId).toBe(testBranchId);
      expect(supplier.isActive).toBe(true);
    });

    test('should not create supplier with duplicate code', async () => {
      const supplierData = {
        code: 'SUP001', // Same code as above
        name: 'Another Supplier',
        phone: '9876543210',
        address: '456 Another Street',
        city: 'Another City',
        state: 'Another State',
        pincode: '654322',
        branchId: testBranchId
      };

      await expect(
        supplierService.createSupplier(supplierData, 'test-user')
      ).rejects.toThrow('Supplier with code SUP001 already exists');
    });

    test('should get supplier with complete details', async () => {
      const supplier = await supplierService.getSupplier(testSupplierId);

      expect(supplier).toBeDefined();
      expect(supplier.id).toBe(testSupplierId);
      expect(supplier.branch).toBeDefined();
      expect(supplier.purchaseOrders).toBeDefined();
      expect(supplier.rfqResponses).toBeDefined();
    });

    test('should update supplier information', async () => {
      const updateData = {
        name: 'Updated Supplier Ltd',
        email: 'updated@testsupplier.com',
        phone: '9876543299',
        rating: 4.8
      };

      const updatedSupplier = await supplierService.updateSupplier(
        testSupplierId,
        updateData,
        'test-user'
      );

      expect(updatedSupplier.name).toBe(updateData.name);
      expect(updatedSupplier.email).toBe(updateData.email);
      expect(updatedSupplier.phone).toBe(updateData.phone);
      expect(updatedSupplier.rating).toBe(updateData.rating);
    });

    test('should get all suppliers with filters', async () => {
      const suppliers = await supplierService.getAllSuppliers({
        branchId: testBranchId,
        isActive: true
      });

      expect(suppliers).toBeDefined();
      expect(suppliers.length).toBeGreaterThan(0);
      if (suppliers.length > 0) {
        expect(suppliers[0]?.branchId).toBe(testBranchId);
        expect(suppliers[0]?.isActive).toBe(true);
      }
    });

    test('should search suppliers by name', async () => {
      const suppliers = await supplierService.getAllSuppliers({
        search: 'Updated Supplier'
      });

      expect(suppliers).toBeDefined();
      expect(suppliers.length).toBeGreaterThan(0);
      if (suppliers.length > 0) {
        expect(suppliers[0]?.name).toContain('Updated Supplier');
      }
    });
  });

  describe('Vendor Performance Tracking', () => {
    test('should calculate supplier performance metrics', async () => {
      // Create test purchase order and GRN for performance calculation
      const po = await prisma.purchaseOrder.create({
        data: {
          id: 'test-po-supplier',
          poNumber: 'PO-TEST-001',
          supplierId: testSupplierId,
          orderDate: new Date('2024-01-01'),
          deliveryDate: new Date('2024-01-15'),
          totalAmount: 100000,
          taxAmount: 18000,
          finalAmount: 118000,
          status: 'RECEIVED'
        }
      });

      const grn = await prisma.gRNRecord.create({
        data: {
          id: 'test-grn-supplier',
          grnNumber: 'GRN-TEST-001',
          poId: po.id,
          receivedDate: new Date('2024-01-14'), // On time delivery
          qcStatus: 'PASSED',
          status: 'ACCEPTED'
        }
      });

      const performance = await supplierService.calculateSupplierPerformance(testSupplierId, 12);

      expect(performance).toBeDefined();
      expect(performance.supplierId).toBe(testSupplierId);
      expect(performance.orderMetrics.totalOrders).toBeGreaterThanOrEqual(0);
      expect(performance.deliveryMetrics.deliveryPerformance).toBeGreaterThanOrEqual(0);
      expect(performance.qualityMetrics.qualityPerformance).toBeGreaterThanOrEqual(0);
      expect(performance.overallRating).toBeGreaterThanOrEqual(0);
      expect(performance.overallRating).toBeLessThanOrEqual(5);

      // Clean up
      await prisma.gRNRecord.delete({ where: { id: grn.id } });
      await prisma.purchaseOrder.delete({ where: { id: po.id } });
    });

    test('should update supplier rating based on performance', async () => {
      const performanceMetrics = {
        supplierId: testSupplierId,
        period: { fromDate: new Date('2023-01-01'), toDate: new Date('2024-01-01') },
        orderMetrics: { totalOrders: 10, totalValue: 1000000, averageOrderValue: 100000 },
        deliveryMetrics: { onTimeDeliveries: 8, lateDeliveries: 2, deliveryPerformance: 80, averageDeliveryDays: 12 },
        qualityMetrics: { totalGRNs: 10, passedGRNs: 9, failedGRNs: 1, qualityPerformance: 90 },
        pricingMetrics: { averageDiscount: 5, priceVariance: 2, competitiveness: 85 },
        overallRating: 4.2
      };

      const updatedSupplier = await supplierService.updateSupplierRating(testSupplierId, performanceMetrics);

      expect(updatedSupplier.rating).toBe(4.2);
    });

    test('should get top performing suppliers', async () => {
      const topSuppliers = await supplierService.getTopPerformingSuppliers(5, testBranchId);

      expect(topSuppliers).toBeDefined();
      expect(Array.isArray(topSuppliers)).toBe(true);
      if (topSuppliers.length > 0) {
        expect(topSuppliers[0]?.rating).toBeGreaterThanOrEqual(0);
        expect(topSuppliers[0]?.branchId).toBe(testBranchId);
      }
    });
  });

  describe('Quote Comparison and Analysis', () => {
    test('should compare supplier quotes for RFQ', async () => {
      // Create test warehouse first
      const warehouse = await prisma.warehouse.create({
        data: {
          id: 'test-warehouse-supplier',
          code: 'TWS',
          name: 'Test Warehouse Supplier',
          branchId: testBranchId,
          address: 'Test Warehouse Address',
          type: 'RAW_MATERIAL'
        }
      });

      // Create test RFQ and responses
      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          id: 'test-item-supplier',
          itemCode: 'ITEM-TEST-001',
          name: 'Test Item',
          category: 'RAW_MATERIAL',
          unit: 'KG',
          warehouseId: warehouse.id,
          currentStock: 100,
          availableStock: 100
        }
      });

      const rfq = await prisma.rFQ.create({
        data: {
          id: 'test-rfq-supplier',
          rfqNumber: 'RFQ-TEST-001',
          title: 'Test RFQ',
          dueDate: new Date('2024-12-31'),
          status: 'SENT'
        }
      });

      const rfqItem = await prisma.rFQItem.create({
        data: {
          id: 'test-rfq-item-supplier',
          rfqId: rfq.id,
          inventoryItemId: inventoryItem.id,
          quantity: 100
        }
      });

      const rfqResponse = await prisma.rFQResponse.create({
        data: {
          id: 'test-rfq-response-supplier',
          rfqId: rfq.id,
          supplierId: testSupplierId,
          totalAmount: 50000,
          deliveryDays: 15,
          validUntil: new Date('2024-12-31'),
          status: 'SUBMITTED'
        }
      });

      const rfqResponseItem = await prisma.rFQResponseItem.create({
        data: {
          id: 'test-rfq-response-item-supplier',
          responseId: rfqResponse.id,
          rfqItemId: rfqItem.id,
          unitPrice: 500,
          totalPrice: 50000
        }
      });

      const comparison = await supplierService.compareSupplierQuotes(rfq.id);

      expect(comparison).toBeDefined();
      expect(comparison.rfqId).toBe(rfq.id);
      expect(comparison.marketAnalysis).toBeDefined();
      expect(comparison.supplierAnalysis).toBeDefined();
      expect(comparison.supplierAnalysis.length).toBeGreaterThan(0);
      expect(comparison.recommendation).toBeDefined();

      // Clean up
      await prisma.rFQResponseItem.delete({ where: { id: rfqResponseItem.id } });
      await prisma.rFQResponse.delete({ where: { id: rfqResponse.id } });
      await prisma.rFQItem.delete({ where: { id: rfqItem.id } });
      await prisma.rFQ.delete({ where: { id: rfq.id } });
      await prisma.inventoryItem.delete({ where: { id: inventoryItem.id } });
      await prisma.warehouse.delete({ where: { id: warehouse.id } });
    });

    test('should get supplier quote history', async () => {
      const history = await supplierService.getSupplierQuoteHistory(testSupplierId, undefined, 12);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Credit Management', () => {
    test('should get credit utilization for supplier', async () => {
      const creditInfo = await supplierService.getCreditUtilization(testSupplierId);

      expect(creditInfo).toBeDefined();
      expect(creditInfo.supplierId).toBe(testSupplierId);
      expect(creditInfo.creditLimit).toBeGreaterThan(0);
      expect(creditInfo.outstandingAmount).toBeGreaterThanOrEqual(0);
      expect(creditInfo.availableCredit).toBeGreaterThanOrEqual(0);
      expect(creditInfo.creditUtilization).toBeGreaterThanOrEqual(0);
      expect(['NORMAL', 'WARNING', 'CRITICAL']).toContain(creditInfo.status);
    });

    test('should update payment terms', async () => {
      const paymentTerms = {
        terms: 'NET_45',
        creditLimit: 1000000,
        creditDays: 45,
        advancePercentage: 20
      };

      // This is a mock implementation, so we just test that it doesn't throw
      await expect(
        supplierService.updatePaymentTerms(testSupplierId, paymentTerms, 'test-user')
      ).resolves.toBeDefined();
    });

    test('should get overdue payments', async () => {
      const overduePayments = await supplierService.getOverduePayments(testSupplierId);

      expect(overduePayments).toBeDefined();
      expect(Array.isArray(overduePayments)).toBe(true);
    });
  });

  describe('Communication and Document Management', () => {
    test('should log supplier communication', async () => {
      const communication = {
        supplierId: testSupplierId,
        type: 'EMAIL' as const,
        subject: 'Test Communication',
        content: 'This is a test communication',
        direction: 'OUTBOUND' as const,
        status: 'SENT' as const,
        communicatedBy: 'test-user'
      };

      const result = await supplierService.logCommunication(communication);

      expect(result).toBeDefined();
      expect(result.supplierId).toBe(testSupplierId);
      expect(result.type).toBe('EMAIL');
      expect(result.subject).toBe('Test Communication');
    });

    test('should get communication history', async () => {
      const history = await supplierService.getCommunicationHistory(testSupplierId, 50);

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    test('should upload supplier document', async () => {
      const document = {
        supplierId: testSupplierId,
        documentType: 'CONTRACT' as const,
        documentName: 'Annual Contract 2024',
        filePath: '/documents/contract_2024.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        expiryDate: new Date('2024-12-31'),
        isActive: true,
        uploadedBy: 'test-user'
      };

      const result = await supplierService.uploadDocument(document);

      expect(result).toBeDefined();
      expect(result.supplierId).toBe(testSupplierId);
      expect(result.documentType).toBe('CONTRACT');
      expect(result.documentName).toBe('Annual Contract 2024');
    });

    test('should get supplier documents', async () => {
      const documents = await supplierService.getSupplierDocuments(testSupplierId);

      expect(documents).toBeDefined();
      expect(Array.isArray(documents)).toBe(true);
    });
  });

  describe('Vendor Portal Integration', () => {
    test('should create vendor portal access', async () => {
      const portalAccess = {
        supplierId: testSupplierId,
        username: 'testsupplier',
        email: 'portal@testsupplier.com',
        isActive: true,
        permissions: ['VIEW_RFQ', 'SUBMIT_QUOTE', 'VIEW_PO']
      };

      const result = await supplierService.createVendorPortalAccess(portalAccess);

      expect(result).toBeDefined();
      expect(result.supplierId).toBe(testSupplierId);
      expect(result.username).toBe('testsupplier');
      expect(result.permissions).toEqual(['VIEW_RFQ', 'SUBMIT_QUOTE', 'VIEW_PO']);
    });

    test('should update vendor portal access', async () => {
      const updates = {
        isActive: false,
        permissions: ['VIEW_RFQ']
      };

      const result = await supplierService.updateVendorPortalAccess(testSupplierId, updates);

      expect(result).toBeDefined();
      expect(result.supplierId).toBe(testSupplierId);
      expect(result.isActive).toBe(false);
    });

    test('should get vendor portal activity', async () => {
      const activity = await supplierService.getVendorPortalActivity(testSupplierId, 30);

      expect(activity).toBeDefined();
      expect(activity.supplierId).toBe(testSupplierId);
      expect(activity.period).toBeDefined();
      expect(typeof activity.rfqResponses).toBe('number');
      expect(typeof activity.poAcknowledgments).toBe('number');
      expect(Array.isArray(activity.recentActivity)).toBe(true);
    });
  });

  describe('Reporting and Analytics', () => {
    test('should get supplier dashboard', async () => {
      const dashboard = await supplierService.getSupplierDashboard(testBranchId);

      expect(dashboard).toBeDefined();
      expect(dashboard.summary).toBeDefined();
      expect(dashboard.summary.totalSuppliers).toBeGreaterThanOrEqual(0);
      expect(dashboard.summary.activeSuppliers).toBeGreaterThanOrEqual(0);
      expect(dashboard.topPerformers).toBeDefined();
      expect(Array.isArray(dashboard.alerts)).toBe(true);
    });

    test('should generate performance report', async () => {
      const report = await supplierService.generateSupplierReport(testSupplierId, 'PERFORMANCE');

      expect(report).toBeDefined();
      expect(report.supplier).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should generate financial report', async () => {
      const report = await supplierService.generateSupplierReport(testSupplierId, 'FINANCIAL');

      expect(report).toBeDefined();
      expect(report.supplier).toBeDefined();
      expect(report.creditInfo).toBeDefined();
      expect(report.overduePayments).toBeDefined();
    });

    test('should generate compliance report', async () => {
      const report = await supplierService.generateSupplierReport(testSupplierId, 'COMPLIANCE');

      expect(report).toBeDefined();
      expect(report.supplier).toBeDefined();
      expect(report.documents).toBeDefined();
      expect(report.complianceStatus).toBeDefined();
      if (report.complianceStatus) {
        expect(['COMPLIANT', 'NON_COMPLIANT']).toContain(report.complianceStatus.status);
      }
    });
  });

  describe('Supplier Deactivation', () => {
    test('should deactivate supplier when no active POs exist', async () => {
      const deactivatedSupplier = await supplierService.deactivateSupplier(
        testSupplierId,
        'test-user',
        'Test deactivation'
      );

      expect(deactivatedSupplier.isActive).toBe(false);
    });

    test('should not deactivate supplier with active purchase orders', async () => {
      // First reactivate the supplier
      await supplierService.updateSupplier(testSupplierId, { isActive: true }, 'test-user');

      // Create an active purchase order
      const activePO = await prisma.purchaseOrder.create({
        data: {
          id: 'test-active-po',
          poNumber: 'PO-ACTIVE-001',
          supplierId: testSupplierId,
          orderDate: new Date(),
          deliveryDate: new Date(),
          totalAmount: 50000,
          taxAmount: 9000,
          finalAmount: 59000,
          status: 'APPROVED'
        }
      });

      await expect(
        supplierService.deactivateSupplier(testSupplierId, 'test-user', 'Test deactivation')
      ).rejects.toThrow('Cannot deactivate supplier. 1 active purchase orders exist.');

      // Clean up
      await prisma.purchaseOrder.delete({ where: { id: activePO.id } });
    });
  });
});

describe('Supplier API Endpoints', () => {
  let authToken: string;
  let testBranchId: string;

  beforeAll(async () => {
    // Setup test data
    const branch = await prisma.branch.create({
      data: {
        id: 'test-branch-api',
        code: 'TAB',
        name: 'Test API Branch',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      }
    });
    testBranchId = branch.id;

    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    await prisma.supplier.deleteMany({
      where: { branchId: testBranchId }
    });
    await prisma.branch.deleteMany({
      where: { id: testBranchId }
    });
  });

  test('POST /api/v1/suppliers should create a new supplier', async () => {
    const supplierData = {
      code: 'API001',
      name: 'API Test Supplier',
      email: 'api@testsupplier.com',
      phone: '9876543210',
      address: '123 API Street',
      city: 'API City',
      state: 'API State',
      pincode: '654321',
      branchId: testBranchId
    };

    const response = await request(app)
      .post('/api/v1/suppliers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(supplierData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.code).toBe(supplierData.code);
    expect(response.body.data.name).toBe(supplierData.name);
  });

  test('GET /api/v1/suppliers should return all suppliers', async () => {
    const response = await request(app)
      .get('/api/v1/suppliers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/v1/suppliers with filters should return filtered suppliers', async () => {
    const response = await request(app)
      .get(`/api/v1/suppliers?branchId=${testBranchId}&isActive=true`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/v1/suppliers/dashboard should return supplier dashboard', async () => {
    const response = await request(app)
      .get('/api/v1/suppliers/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary).toBeDefined();
  });
});