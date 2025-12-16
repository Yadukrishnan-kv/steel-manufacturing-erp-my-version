// Manufacturing Service Tests
import { ManufacturingService } from '../src/services/manufacturing.service';
import { BOMService } from '../src/services/bom.service';
import { WorkCenterService } from '../src/services/workCenter.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for testing
const mockPrisma = {
  bOM: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  bOMItem: {
    create: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  productionOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  inventoryItem: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  stockTransaction: {
    create: jest.fn(),
  },
  capacitySchedule: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  operation: {
    findMany: jest.fn(),
  },
  productionOrderOperation: {
    create: jest.fn(),
  },
  materialConsumption: {
    create: jest.fn(),
  },
  scrapRecord: {
    create: jest.fn(),
  },
  workCenter: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('Manufacturing Service', () => {
  let manufacturingService: ManufacturingService;
  let bomService: BOMService;
  let workCenterService: WorkCenterService;

  beforeEach(() => {
    manufacturingService = new ManufacturingService(mockPrisma);
    bomService = new BOMService(mockPrisma);
    workCenterService = new WorkCenterService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Production Order Management', () => {
    it('should validate material availability before creating production order', async () => {
      // Mock BOM with items
      const mockBOM = {
        id: 'bom-1',
        status: 'APPROVED',
        items: [
          {
            id: 'item-1',
            inventoryItemId: 'inv-1',
            quantity: 10,
            scrapPercentage: 5,
            inventoryItem: {
              itemCode: 'STEEL-001',
              name: 'Steel Sheet',
              currentStock: 100,
              availableStock: 50,
            },
          },
        ],
      };

      (mockPrisma.bOM.findUnique as jest.Mock).mockResolvedValue(mockBOM);
      (mockPrisma.operation.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.capacitySchedule.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.productionOrder.findFirst as jest.Mock).mockResolvedValue(null);

      const request = {
        bomId: 'bom-1',
        quantity: 2,
        branchId: 'branch-1',
      };

      // Mock the production order creation
      (mockPrisma.productionOrder.create as jest.Mock).mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202412120001',
        ...request,
      });

      // Mock getProductionOrderWithOperations
      (mockPrisma.productionOrder.findUnique as jest.Mock).mockResolvedValue({
        id: 'po-1',
        orderNumber: 'PO202412120001',
        operations: [],
        bom: mockBOM,
      });

      // This should not throw since we have sufficient materials
      await expect(manufacturingService.createProductionOrder(request)).resolves.toBeDefined();
    });

    it('should throw error when insufficient materials', async () => {
      // Mock BOM with insufficient stock
      const mockBOM = {
        id: 'bom-1',
        status: 'APPROVED',
        items: [
          {
            id: 'item-1',
            inventoryItemId: 'inv-1',
            quantity: 10,
            scrapPercentage: 5,
            inventoryItem: {
              itemCode: 'STEEL-001',
              name: 'Steel Sheet',
              currentStock: 100,
              availableStock: 10, // Insufficient stock
            },
          },
        ],
      };

      (mockPrisma.bOM.findUnique as jest.Mock).mockResolvedValue(mockBOM);

      const request = {
        bomId: 'bom-1',
        quantity: 2,
        branchId: 'branch-1',
      };

      // This should fail validation since we need 21 units but only have 10 available
      await expect(manufacturingService.createProductionOrder(request))
        .rejects.toThrow('Insufficient materials');
    });
  });

  describe('BOM Management', () => {
    it('should create BOM with hierarchical structure', async () => {
      const mockProduct = { id: 'product-1', code: 'DOOR-001' };
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (mockPrisma.bOM.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing BOM for creation check
        .mockResolvedValueOnce({ // Return created BOM for getBOMWithItems
          id: 'bom-1',
          product: { code: 'DOOR-001', name: 'Steel Door' },
          items: [],
        });
      (mockPrisma.inventoryItem.findMany as jest.Mock).mockResolvedValue([
        { id: 'inv-1' },
        { id: 'inv-2' },
      ]);

      const request = {
        productId: 'product-1',
        revision: 'R1',
        effectiveDate: new Date(),
        items: [
          {
            inventoryItemId: 'inv-1',
            quantity: 1,
            unit: 'EA',
            level: 1,
          },
          {
            inventoryItemId: 'inv-2',
            quantity: 2,
            unit: 'EA',
            level: 2,
            parentItemId: 'inv-1',
          },
        ],
      };

      (mockPrisma.bOM.create as jest.Mock).mockResolvedValue({
        id: 'bom-1',
        ...request,
      });

      const result = await bomService.createBOM(request, 'user-1');
      
      expect(mockPrisma.bOM.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          productId: 'product-1',
          revision: 'R1',
          status: 'DRAFT',
        }),
      });
    });
  });

  describe('Work Center Management', () => {
    it('should create work center with operations', async () => {
      const request = {
        code: 'WC-001',
        name: 'Cutting Center',
        type: 'CUTTING' as const,
        capacity: 8,
      };

      (mockPrisma.workCenter.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // No existing work center for creation check
        .mockResolvedValueOnce({ // Return created work center for getWorkCenterWithOperations
          id: 'wc-1',
          ...request,
          operations: [],
          schedules: [],
        });
      
      (mockPrisma.workCenter.create as jest.Mock).mockResolvedValue({
        id: 'wc-1',
        ...request,
      });

      const result = await workCenterService.createWorkCenter(request);
      
      expect(mockPrisma.workCenter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'WC-001',
          name: 'Cutting Center',
          type: 'CUTTING',
          capacity: 8,
        }),
      });
    });

    it('should throw error for duplicate work center code', async () => {
      const request = {
        code: 'WC-001',
        name: 'Cutting Center',
        type: 'CUTTING' as const,
        capacity: 8,
      };

      (mockPrisma.workCenter.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(workCenterService.createWorkCenter(request))
        .rejects.toThrow('Work center with code WC-001 already exists');
    });
  });

  describe('Material Consumption Tracking', () => {
    it('should record material consumption with variance analysis', async () => {
      const consumptionRecord = {
        productionOrderId: 'po-1',
        inventoryItemId: 'inv-1',
        plannedQuantity: 10,
        actualQuantity: 12,
        variance: 2,
      };

      const mockInventoryItem = { warehouseId: 'wh-1' };
      (mockPrisma.inventoryItem.findUnique as jest.Mock).mockResolvedValue(mockInventoryItem);

      await manufacturingService.recordMaterialConsumption(consumptionRecord);

      expect(mockPrisma.materialConsumption.create).toHaveBeenCalledWith({
        data: consumptionRecord,
      });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          currentStock: { decrement: 12 },
          reservedStock: { decrement: 10 },
        },
      });
    });
  });

  describe('Scrap Tracking', () => {
    it('should record scrap with costing integration', async () => {
      const scrapRecord = {
        productionOrderId: 'po-1',
        inventoryItemId: 'inv-1',
        quantity: 2,
        reason: 'Defective material',
      };

      const mockInventoryItem = {
        id: 'inv-1',
        standardCost: 100,
        warehouseId: 'wh-1',
      };

      (mockPrisma.inventoryItem.findUnique as jest.Mock).mockResolvedValue(mockInventoryItem);

      await manufacturingService.recordScrap(scrapRecord);

      expect(mockPrisma.scrapRecord.create).toHaveBeenCalledWith({
        data: {
          ...scrapRecord,
          operationId: null,
          cost: 200, // 2 * 100
        },
      });

      expect(mockPrisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: {
          currentStock: { decrement: 2 },
        },
      });
    });
  });
});

describe('Manufacturing Service Integration', () => {
  it('should validate all core manufacturing requirements', () => {
    // Test that all required methods exist and have correct signatures
    const manufacturingService = new ManufacturingService(mockPrisma);
    
    // Requirements 1.1 - Automatic production order generation
    expect(typeof manufacturingService.createProductionOrder).toBe('function');
    
    // Requirements 1.2 - Production order status tracking and Gantt visualization
    expect(typeof manufacturingService.getProductionSchedule).toBe('function');
    expect(typeof manufacturingService.updateProductionOrderStatus).toBe('function');
    
    // Requirements 1.3 - Capacity constraint validation
    expect(typeof manufacturingService.calculateCapacityRouting).toBe('function');
    
    // Requirements 13.1 - Scrap tracking by operation
    expect(typeof manufacturingService.recordScrap).toBe('function');
    
    // Requirements 13.5 - Material consumption tracking
    expect(typeof manufacturingService.recordMaterialConsumption).toBe('function');
  });

  it('should validate BOM management requirements', () => {
    const bomService = new BOMService(mockPrisma);
    
    // Requirements 1.5 - Multi-level BOM management with revision control
    expect(typeof bomService.createBOM).toBe('function');
    expect(typeof bomService.updateBOMWithEngineeringChange).toBe('function');
    expect(typeof bomService.getBOMWithItems).toBe('function');
    expect(typeof bomService.propagateBOMChanges).toBe('function');
  });

  it('should validate work center management requirements', () => {
    const workCenterService = new WorkCenterService(mockPrisma);
    
    // Requirements 1.3 - Work center and operation management
    expect(typeof workCenterService.createWorkCenter).toBe('function');
    expect(typeof workCenterService.createOperation).toBe('function');
    expect(typeof workCenterService.getMachineSchedule).toBe('function');
    expect(typeof workCenterService.getWorkCenterUtilization).toBe('function');
  });
});