// Service Management Tests
import { PrismaClient } from '@prisma/client';
import { ServiceService } from '../src/services/service.service';

const prisma = new PrismaClient();
const serviceService = new ServiceService(prisma);

describe('Service Management API', () => {
  let authToken: string;
  let testCustomerId: string;
  let testServiceRequestId: string;
  let testTechnicianId: string;
  let testBranchId: string;

  beforeAll(async () => {
    // Use existing seed data instead of creating new test data
    const existingBranch = await prisma.branch.findFirst();
    if (!existingBranch) {
      throw new Error('No branches found in seed data');
    }
    testBranchId = existingBranch.id;

    // Create test customer using existing branch
    const testCustomer = await prisma.customer.create({
      data: {
        code: `TEST_CUST_${Date.now()}`,
        name: 'Test Customer',
        phone: '9876543210',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        branchId: testBranchId,
      },
    });
    testCustomerId = testCustomer.id;

    // Create test technician using existing branch
    const testTechnician = await prisma.employee.create({
      data: {
        employeeCode: `TECH${Date.now()}`,
        firstName: 'Test',
        lastName: 'Technician',
        dateOfJoining: new Date(),
        designation: 'Service Technician',
        department: 'SERVICE',
        branchId: testBranchId,
      },
    });
    testTechnicianId = testTechnician.id;

    // Get auth token (simplified for testing)
    authToken = 'test-token';
  });

  afterAll(async () => {
    // Cleanup test data in correct order to avoid foreign key constraints
    if (testCustomerId) {
      // Delete related records first
      await prisma.serviceParts.deleteMany({
        where: { 
          service: {
            customerId: testCustomerId
          }
        },
      });
      await prisma.serviceRequest.deleteMany({
        where: { customerId: testCustomerId },
      });
      await prisma.aMCContract.deleteMany({
        where: { customerId: testCustomerId },
      });
      // Delete any remaining related records in correct order
      const invoices = await prisma.invoice.findMany({
        where: { customerId: testCustomerId },
      });
      
      for (const invoice of invoices) {
        await prisma.payment.deleteMany({
          where: { invoiceId: invoice.id },
        });
        await prisma.invoiceLineItem.deleteMany({
          where: { invoiceId: invoice.id },
        });
      }
      
      await prisma.invoice.deleteMany({
        where: { customerId: testCustomerId },
      });
      await prisma.customer.delete({
        where: { id: testCustomerId },
      });
    }
    if (testTechnicianId) {
      await prisma.employee.delete({
        where: { id: testTechnicianId },
      });
    }
    // Don't delete the branch as it's from seed data
    await prisma.$disconnect();
  });

  describe('Service Request Management', () => {
    test('should create service request successfully', async () => {
      const serviceRequestData = {
        customerId: testCustomerId,
        type: 'INSTALLATION' as const,
        priority: 'HIGH' as const,
        description: 'Test installation service',
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Test Location',
        },
      };

      const serviceRequest = await serviceService.createServiceRequest(serviceRequestData);

      expect(serviceRequest).toBeDefined();
      expect(serviceRequest.customerId).toBe(testCustomerId);
      expect(serviceRequest.type).toBe('INSTALLATION');
      expect(serviceRequest.status).toBe('SCHEDULED');
      expect(serviceRequest.serviceNumber).toMatch(/^SRV\d{6}\d{4}$/);

      testServiceRequestId = serviceRequest.id;
    });

    test('should assign technician automatically', async () => {
      const assignmentRequest = {
        serviceRequestId: testServiceRequestId,
        autoAssign: true,
        location: {
          latitude: 12.9716,
          longitude: 77.5946,
        },
        expertise: ['INSTALLATION'],
      };

      const assignment = await serviceService.assignTechnician(assignmentRequest);

      expect(assignment).toBeDefined();
      expect(assignment.serviceRequestId).toBe(testServiceRequestId);
      expect(assignment.assignedTechnicianId).toBeDefined();
      expect(assignment.assignmentReason).toContain('Auto-assigned');
    });
  });

  describe('Service Costing and Parts Management', () => {
    let testInventoryItemId: string;
    let testWarehouseId: string;

    beforeAll(async () => {
      // Get an existing warehouse from the seed data
      const warehouse = await prisma.warehouse.findFirst({
        where: {
          branchId: testBranchId,
        },
      });
      
      if (!warehouse) {
        // If no warehouse found for test branch, use any available warehouse
        const anyWarehouse = await prisma.warehouse.findFirst();
        if (!anyWarehouse) {
          throw new Error('No warehouses found in database');
        }
        testWarehouseId = anyWarehouse.id;
      } else {
        testWarehouseId = warehouse.id;
      }

      // Create test inventory item for parts consumption
      const testInventoryItem = await prisma.inventoryItem.create({
        data: {
          itemCode: `TEST_PART_${Date.now()}`,
          name: 'Test Service Part',
          category: 'SERVICE_PARTS',
          unit: 'PCS',
          currentStock: 100,
          availableStock: 100,
          standardCost: 50,
          warehouseId: testWarehouseId,
        },
      });
      testInventoryItemId = testInventoryItem.id;
    });

    afterAll(async () => {
      if (testInventoryItemId) {
        // Delete service parts first, then stock transactions, then inventory item
        await prisma.serviceParts.deleteMany({
          where: { inventoryItemId: testInventoryItemId },
        });
        await prisma.stockTransaction.deleteMany({
          where: { inventoryItemId: testInventoryItemId },
        });
        await prisma.inventoryItem.delete({
          where: { id: testInventoryItemId },
        });
      }
    });

    test('should complete service with parts consumption and labor tracking', async () => {
      const completionRequest = {
        serviceRequestId: testServiceRequestId,
        completionDate: new Date(),
        partsConsumed: [
          {
            inventoryItemId: testInventoryItemId,
            quantity: 2,
            unitCost: 50,
          },
        ],
        laborHours: 4,
        completionNotes: 'Installation completed successfully',
        customerRating: 5,
        customerFeedback: 'Excellent service',
      };

      const completion = await serviceService.completeService(completionRequest);

      expect(completion).toBeDefined();
      expect(completion.serviceRequestId).toBe(testServiceRequestId);
      expect(completion.totalPartsCost).toBe(100); // 2 * 50
      expect(completion.totalLaborCost).toBe(2000); // 4 * 500
      expect(completion.totalServiceCost).toBe(2100); // 100 + 2000
      expect(completion.status).toBe('COMPLETED');
    });

    test('should calculate detailed service cost breakdown', async () => {
      const costBreakdown = await serviceService.calculateServiceCostBreakdown(testServiceRequestId);

      expect(costBreakdown).toBeDefined();
      expect(costBreakdown.serviceRequestId).toBe(testServiceRequestId);
      expect(costBreakdown.partsCost).toBeGreaterThan(0);
      expect(costBreakdown.laborCost).toBeGreaterThan(0);
      expect(costBreakdown.subtotal).toBe(costBreakdown.partsCost + costBreakdown.laborCost);
      expect(costBreakdown.costBreakdown).toHaveLength(2); // Parts + Labor
    });

    test('should generate service invoice with detailed breakdown', async () => {
      const invoiceRequest = {
        serviceRequestId: testServiceRequestId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        taxRate: 18,
        discountAmount: 50,
        notes: 'Test service invoice',
      };

      const invoice = await serviceService.generateServiceInvoice(invoiceRequest);

      expect(invoice).toBeDefined();
      expect(invoice.serviceRequestId).toBe(testServiceRequestId);
      expect(invoice.customerId).toBe(testCustomerId);
      expect(invoice.invoiceNumber).toMatch(/^INV\d{6}\d{4}$/);
      expect(invoice.subtotal).toBeGreaterThan(0);
      expect(invoice.taxAmount).toBeGreaterThan(0);
      expect(invoice.totalAmount).toBeGreaterThan(0);
      expect(invoice.lineItems.length).toBeGreaterThan(0);
    });
  });

  describe('Service Parts Inventory Management', () => {
    test('should get service parts inventory for mobile app', async () => {
      const inventory = await serviceService.getServicePartsInventory();

      expect(inventory).toBeDefined();
      expect(Array.isArray(inventory)).toBe(true);
      
      if (inventory.length > 0) {
        const item = inventory[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('itemCode');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('currentStock');
        expect(item).toHaveProperty('unitCost');
      }
    });
  });

  describe('Mobile App Integration', () => {
    test('should get mobile app sync data for technician', async () => {
      const syncData = await serviceService.getMobileAppSyncData(testTechnicianId);

      expect(syncData).toBeDefined();
      expect(syncData).toHaveProperty('serviceRequests');
      expect(syncData).toHaveProperty('inventoryItems');
      expect(syncData).toHaveProperty('customers');
      expect(syncData).toHaveProperty('lastSyncTime');
      expect(Array.isArray(syncData.serviceRequests)).toBe(true);
      expect(Array.isArray(syncData.inventoryItems)).toBe(true);
      expect(Array.isArray(syncData.customers)).toBe(true);
    });

    test('should update service request from mobile app', async () => {
      const updateData = {
        status: 'IN_PROGRESS',
        completionNotes: 'Work in progress',
        geoLocation: {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Updated location',
        },
      };

      const updatedService = await serviceService.updateServiceFromMobile(testServiceRequestId, updateData);

      expect(updatedService).toBeDefined();
      expect(updatedService.id).toBe(testServiceRequestId);
      expect(updatedService.status).toBe('IN_PROGRESS');
    });
  });

  describe('Service Analytics and Reporting', () => {
    test('should get enhanced service analytics', async () => {
      const analytics = await serviceService.getEnhancedServiceAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics).toHaveProperty('totalServiceRequests');
      expect(analytics).toHaveProperty('completedServices');
      expect(analytics).toHaveProperty('revenueAnalytics');
      expect(analytics).toHaveProperty('efficiencyMetrics');
      expect(analytics).toHaveProperty('customerMetrics');
      
      expect(analytics.revenueAnalytics).toHaveProperty('totalRevenue');
      expect(analytics.revenueAnalytics).toHaveProperty('partsRevenue');
      expect(analytics.revenueAnalytics).toHaveProperty('laborRevenue');
      expect(analytics.revenueAnalytics).toHaveProperty('averageServiceValue');
      
      expect(analytics.efficiencyMetrics).toHaveProperty('firstTimeFixRate');
      expect(analytics.efficiencyMetrics).toHaveProperty('repeatServiceRate');
      expect(analytics.efficiencyMetrics).toHaveProperty('averageResolutionTime');
      expect(analytics.efficiencyMetrics).toHaveProperty('technicianUtilization');
      
      expect(analytics.customerMetrics).toHaveProperty('customerSatisfactionScore');
      expect(analytics.customerMetrics).toHaveProperty('netPromoterScore');
      expect(analytics.customerMetrics).toHaveProperty('customerRetentionRate');
    });

    test('should get service performance metrics for technician', async () => {
      const metrics = await serviceService.getServicePerformanceMetrics(testTechnicianId);

      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
      
      if (metrics.length > 0) {
        const metric = metrics[0];
        expect(metric).toHaveProperty('technicianId');
        expect(metric).toHaveProperty('totalServices');
        expect(metric).toHaveProperty('completedServices');
        expect(metric).toHaveProperty('averageRating');
        expect(metric).toHaveProperty('customerSatisfactionScore');
      }
    });
  });
});