// Sales Service Tests
import { PrismaClient } from '@prisma/client';
import { SalesService } from '../src/services/sales.service';

const prisma = new PrismaClient();
const salesService = new SalesService(prisma);

// Mock data for testing
const mockBranch = {
  id: 'sales-branch-1',
  code: 'SALES-BR001',
  name: 'Sales Test Branch',
  address: '123 Sales St',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600001',
  phone: '9876543210',
  isActive: true,
  isDeleted: false,
};

const mockCustomer = {
  id: 'sales-customer-1',
  code: 'SALES-CUST001',
  name: 'John Doe',
  phone: '9876543210',
  email: 'john@example.com',
  address: '456 Customer St',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600002',
  branchId: 'sales-branch-1',
  isActive: true,
  isDeleted: false,
};

const mockProduct = {
  id: 'sales-product-1',
  code: 'SALES-PROD001',
  name: 'Steel Door',
  description: 'Premium Steel Door',
  category: 'DOOR',
  type: 'STANDARD',
  isActive: true,
  isDeleted: false,
};

const mockBOM = {
  id: 'sales-bom-1',
  productId: 'sales-product-1',
  revision: 'R001',
  effectiveDate: new Date(),
  status: 'APPROVED',
  isActive: true,
  isDeleted: false,
};

const mockWarehouse = {
  id: 'sales-warehouse-1',
  code: 'SALES-WH001',
  name: 'Sales Test Warehouse',
  branchId: 'sales-branch-1',
  address: '123 Warehouse St',
  type: 'RAW_MATERIAL',
  isActive: true,
  isDeleted: false,
};

const mockInventoryItem = {
  id: 'sales-item-1',
  itemCode: 'SALES-STEEL001',
  name: 'Steel Sheet',
  category: 'RAW_MATERIAL',
  unit: 'KG',
  standardCost: 100,
  currentStock: 1000,
  availableStock: 800,
  reservedStock: 200,
  warehouseId: 'sales-warehouse-1',
  isActive: true,
  isDeleted: false,
};

describe('SalesService', () => {
  beforeAll(async () => {
    // Setup test data using upsert to handle existing records
    await prisma.branch.upsert({
      where: { id: mockBranch.id },
      update: mockBranch,
      create: mockBranch,
    });
    await prisma.warehouse.upsert({
      where: { id: mockWarehouse.id },
      update: mockWarehouse,
      create: mockWarehouse,
    });
    await prisma.customer.upsert({
      where: { id: mockCustomer.id },
      update: mockCustomer,
      create: mockCustomer,
    });
    await prisma.product.upsert({
      where: { id: mockProduct.id },
      update: mockProduct,
      create: mockProduct,
    });
    await prisma.bOM.upsert({
      where: { id: mockBOM.id },
      update: mockBOM,
      create: mockBOM,
    });
    await prisma.inventoryItem.upsert({
      where: { id: mockInventoryItem.id },
      update: mockInventoryItem,
      create: mockInventoryItem,
    });
  });

  afterAll(async () => {
    // Cleanup test data - only clean up sales-specific data
    try {
      await prisma.bOMItem.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.estimateItem.deleteMany({});
      await prisma.salesOrderItem.deleteMany({});
      await prisma.productionOrder.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.siteMeasurement.deleteMany({});
      await prisma.estimate.deleteMany({});
      await prisma.salesOrder.deleteMany({});
      await prisma.lead.deleteMany({});
      await prisma.inventoryItem.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.bOM.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.product.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.customer.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.warehouse.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
      await prisma.branch.deleteMany({
        where: { id: { startsWith: 'sales-' } }
      });
    } catch (error) {
      console.log('Cleanup error (non-critical):', error);
    }
    await prisma.$disconnect();
  });

  describe('Lead Management', () => {
    test('should create lead with source tracking', async () => {
      const leadRequest = {
        source: 'META' as const,
        sourceRef: 'FB_CAMPAIGN_123',
        contactName: 'Jane Smith',
        phone: '9876543211',
        email: 'jane@example.com',
        address: '789 Lead St',
        requirements: 'Steel door for home',
        estimatedValue: 50000,
        priority: 'MEDIUM' as const,
      };

      const lead = await salesService.createLead(leadRequest);

      expect(lead).toBeDefined();
      expect(lead.leadNumber).toMatch(/^LD\d{6}\d{4}$/);
      expect(lead.source).toBe('META');
      expect(lead.sourceRef).toBe('FB_CAMPAIGN_123');
      expect(lead.contactName).toBe('Jane Smith');
      expect(lead.status).toBe('NEW');
    });

    test('should capture geo-tagged site measurement', async () => {
      // First create a lead
      const lead = await salesService.createLead({
        source: 'DIRECT',
        contactName: 'Test Customer',
        phone: '9876543212',
      });

      const measurementRequest = {
        leadId: lead.id,
        location: {
          latitude: 13.0827,
          longitude: 80.2707,
          accuracy: 5,
          address: 'Chennai, Tamil Nadu',
        },
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
        measurements: {
          width: 3.5,
          height: 7.0,
          area: 24.5,
          unit: 'feet',
        },
        notes: 'Standard door measurement',
        measuredBy: 'surveyor-1',
      };

      const measurement = await salesService.captureSiteMeasurement(measurementRequest);

      expect(measurement).toBeDefined();
      expect(measurement.leadId).toBe(lead.id);
      expect(JSON.parse(measurement.location)).toEqual(measurementRequest.location);
      expect(JSON.parse(measurement.photos)).toEqual(measurementRequest.photos);
      expect(JSON.parse(measurement.measurements)).toEqual(measurementRequest.measurements);

      // Verify lead status updated
      const updatedLead = await salesService.getLeadWithDetails(lead.id);
      expect(updatedLead.status).toBe('QUALIFIED');
    });
  });

  describe('Estimation Engine', () => {
    test('should generate comprehensive pricing estimation', async () => {
      // Create a lead first
      const lead = await salesService.createLead({
        source: 'DIRECT',
        contactName: 'Estimation Customer',
        phone: '9876543213',
      });

      const estimationRequest = {
        leadId: lead.id,
        items: [
          {
            description: 'Premium Steel Door',
            quantity: 2,
            specifications: {
              size: {
                width: 3.5,
                height: 7.0,
                unit: 'feet',
              },
              coatingType: 'POWDER_COATING',
              coatingColor: 'White',
              hardware: {
                lockType: 'MULTI_POINT',
                hingeType: 'HEAVY_DUTY',
                handleType: 'DESIGNER',
                securityFeatures: ['ANTI_THEFT', 'REINFORCED'],
                accessories: ['PEEPHOLE', 'CHAIN_LOCK'],
              },
              frameType: 'PREMIUM',
              customFeatures: ['SOUND_PROOFING'],
            },
          },
        ],
        discountPercentage: 5,
        validityDays: 30,
      };

      const estimation = await salesService.generateEstimation(estimationRequest);

      expect(estimation).toBeDefined();
      expect(estimation.estimateNumber).toMatch(/^EST\d{6}\d{4}$/);
      expect(estimation.items).toHaveLength(1);
      expect(estimation.totalAmount).toBeGreaterThan(0);
      expect(estimation.discountAmount).toBeGreaterThan(0);
      expect(estimation.finalAmount).toBeLessThan(estimation.totalAmount);
      expect(estimation.breakdown).toBeDefined();
      expect(estimation.breakdown.totalMaterialCost).toBeGreaterThan(0);
      expect(estimation.breakdown.totalLaborCost).toBeGreaterThan(0);
      expect(estimation.breakdown.totalHardwareCost).toBeGreaterThan(0);

      // Verify item cost breakdown
      const item = estimation.items[0];
      expect(item).toBeDefined();
      if (item) {
        expect(item.costBreakdown.materialCost).toBeGreaterThan(0);
        expect(item.costBreakdown.laborCost).toBeGreaterThan(0);
        expect(item.costBreakdown.hardwareCost).toBeGreaterThan(0);
        expect(item.costBreakdown.coatingCost).toBeGreaterThan(0);
        expect(item.costBreakdown.overheadCost).toBeGreaterThan(0);
        expect(item.costBreakdown.profitMargin).toBeGreaterThan(0);
      }
    });

    test('should calculate pricing based on size, coating, and hardware', async () => {
      const lead = await salesService.createLead({
        source: 'DIRECT',
        contactName: 'Pricing Test Customer',
        phone: '9876543214',
      });

      // Test with different specifications
      const basicEstimation = await salesService.generateEstimation({
        leadId: lead.id,
        items: [
          {
            description: 'Basic Steel Door',
            quantity: 1,
            specifications: {
              size: { width: 3.0, height: 6.5, unit: 'feet' },
              coatingType: 'POWDER_COATING',
              hardware: {
                lockType: 'STANDARD',
                hingeType: 'STANDARD',
                handleType: 'STANDARD',
              },
              frameType: 'STANDARD',
            },
          },
        ],
      });

      const premiumEstimation = await salesService.generateEstimation({
        leadId: lead.id,
        items: [
          {
            description: 'Premium Steel Door',
            quantity: 1,
            specifications: {
              size: { width: 4.0, height: 8.0, unit: 'feet' },
              coatingType: 'WOOD_FINISH',
              hardware: {
                lockType: 'SMART_LOCK',
                hingeType: 'CONCEALED',
                handleType: 'PREMIUM',
                securityFeatures: ['BIOMETRIC', 'SMART_ACCESS'],
              },
              frameType: 'LUXURY',
              customFeatures: ['SOUND_PROOFING', 'THERMAL_INSULATION'],
            },
          },
        ],
      });

      // Premium should cost more than basic
      expect(premiumEstimation.totalAmount).toBeGreaterThan(basicEstimation.totalAmount);
      
      // Verify cost components are higher for premium
      const basicItem = basicEstimation.items[0];
      const premiumItem = premiumEstimation.items[0];
      
      if (basicItem && premiumItem) {
        expect(premiumItem.costBreakdown.materialCost).toBeGreaterThan(basicItem.costBreakdown.materialCost);
        expect(premiumItem.costBreakdown.hardwareCost).toBeGreaterThan(basicItem.costBreakdown.hardwareCost);
        expect(premiumItem.costBreakdown.coatingCost).toBeGreaterThan(basicItem.costBreakdown.coatingCost);
      }
    });
  });

  describe('Discount Approval Workflow', () => {
    test('should process discount approval with hierarchy routing', async () => {
      // Create lead and estimate first
      const lead = await salesService.createLead({
        source: 'DIRECT',
        contactName: 'Discount Test Customer',
        phone: '9876543215',
      });

      const estimation = await salesService.generateEstimation({
        leadId: lead.id,
        items: [
          {
            description: 'Test Door',
            quantity: 1,
            specifications: {
              size: { width: 3.0, height: 7.0, unit: 'feet' },
              coatingType: 'POWDER_COATING',
              hardware: {
                lockType: 'STANDARD',
                hingeType: 'STANDARD',
                handleType: 'STANDARD',
              },
            },
          },
        ],
      });

      // Test different discount levels
      const smallDiscountApproval = await salesService.processDiscountApproval({
        estimateId: estimation.estimateId,
        discountPercentage: 3,
        discountAmount: estimation.totalAmount * 0.03,
        reason: 'Customer loyalty discount',
        requestedBy: 'sales-rep-1',
      });

      expect(smallDiscountApproval.approverLevel).toBe(1); // Team Leader
      expect(smallDiscountApproval.status).toBe('PENDING');

      const largeDiscountApproval = await salesService.processDiscountApproval({
        estimateId: estimation.estimateId,
        discountPercentage: 12,
        discountAmount: estimation.totalAmount * 0.12,
        reason: 'Bulk order discount',
        requestedBy: 'sales-rep-1',
      });

      expect(largeDiscountApproval.approverLevel).toBe(3); // Branch Manager
      expect(largeDiscountApproval.requiresEscalation).toBe(true);
    });
  });

  describe('Sales Order Processing', () => {
    test('should create sales order with material validation', async () => {
      // Create BOM item for material validation
      await prisma.bOMItem.create({
        data: {
          id: 'sales-bom-item-1',
          bomId: mockBOM.id,
          inventoryItemId: mockInventoryItem.id,
          quantity: 5, // 5 kg per door
          unit: 'KG',
          scrapPercentage: 10,
          level: 1,
        },
      });

      const salesOrderRequest = {
        customerId: mockCustomer.id,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        items: [
          {
            productId: mockProduct.id,
            description: 'Steel Door',
            quantity: 10, // Should require 50kg + 10% scrap = 55kg (available: 800kg)
            unitPrice: 25000,
            specifications: {
              size: { width: 3.0, height: 7.0, unit: 'feet' },
              coatingType: 'POWDER_COATING',
              hardware: {
                lockType: 'STANDARD',
                hingeType: 'STANDARD',
                handleType: 'STANDARD',
              },
            },
          },
        ],
        branchId: mockBranch.id,
      };

      const salesOrder = await salesService.createSalesOrder(salesOrderRequest);

      expect(salesOrder).toBeDefined();
      expect(salesOrder.orderNumber).toMatch(/^SO\d{6}\d{4}$/);
      expect(salesOrder.customerId).toBe(mockCustomer.id);
      expect(salesOrder.status).toBe('CONFIRMED');
      expect(salesOrder.items).toHaveLength(1);
      expect(salesOrder.productionOrders).toHaveLength(1);

      // Verify production order was created
      const productionOrder = salesOrder.productionOrders[0];
      expect(productionOrder).toBeDefined();
      if (productionOrder) {
        expect(productionOrder.quantity).toBe(10);
        expect(productionOrder.status).toBe('PLANNED');
      }
    });

    test('should fail with insufficient materials', async () => {
      // Create BOM item that requires more materials than available
      await prisma.bOMItem.create({
        data: {
          id: 'sales-bom-item-2',
          bomId: mockBOM.id,
          inventoryItemId: mockInventoryItem.id,
          quantity: 100, // 100 kg per door
          unit: 'KG',
          scrapPercentage: 10,
          level: 1,
        },
      });

      const salesOrderRequest = {
        customerId: mockCustomer.id,
        deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            productId: mockProduct.id,
            description: 'Steel Door',
            quantity: 10, // Would require 1000kg + 10% = 1100kg (available: 800kg)
            unitPrice: 25000,
            specifications: {
              size: { width: 3.0, height: 7.0, unit: 'feet' },
              coatingType: 'POWDER_COATING',
              hardware: {
                lockType: 'STANDARD',
                hingeType: 'STANDARD',
                handleType: 'STANDARD',
              },
            },
          },
        ],
        branchId: mockBranch.id,
      };

      await expect(salesService.createSalesOrder(salesOrderRequest))
        .rejects
        .toThrow(/Insufficient materials/);
    });
  });

  describe('Customer Management', () => {
    test('should create customer with contact and billing information', async () => {
      const customerRequest = {
        name: 'New Customer Ltd',
        email: 'contact@newcustomer.com',
        phone: '9876543216',
        address: '123 Business Park',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        gstNumber: '29ABCDE1234F1Z5',
        branchId: mockBranch.id,
      };

      const customer = await salesService.createCustomer(customerRequest);

      expect(customer).toBeDefined();
      expect(customer.code).toMatch(/^CUST\d{4}\d{5}$/);
      expect(customer.name).toBe('New Customer Ltd');
      expect(customer.email).toBe('contact@newcustomer.com');
      expect(customer.phone).toBe('9876543216');
      expect(customer.gstNumber).toBe('29ABCDE1234F1Z5');
    });
  });

  describe('Sales Analytics', () => {
    test('should generate sales analytics and reporting', async () => {
      const analytics = await salesService.getSalesAnalytics(mockBranch.id);

      expect(analytics).toBeDefined();
      expect(analytics.totalLeads).toBeGreaterThanOrEqual(0);
      expect(analytics.convertedLeads).toBeGreaterThanOrEqual(0);
      expect(analytics.conversionRate).toBeGreaterThanOrEqual(0);
      expect(analytics.totalSalesValue).toBeGreaterThanOrEqual(0);
      expect(analytics.averageOrderValue).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analytics.topProducts)).toBe(true);
      expect(Array.isArray(analytics.salesBySource)).toBe(true);
      expect(Array.isArray(analytics.monthlyTrends)).toBe(true);
    });
  });
});