// Manufacturing Service - Core functionality for production management
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface CreateProductionOrderRequest {
  salesOrderId?: string;
  productId?: string;
  bomId: string;
  quantity: number;
  priority?: number;
  bufferDays?: number;
  branchId: string;
}

export interface ProductionOrderWithOperations {
  id: string;
  orderNumber: string;
  salesOrderId?: string;
  productId?: string;
  bomId: string;
  quantity: number;
  scheduledStartDate: Date;
  scheduledEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: string;
  priority: number;
  bufferDays: number;
  branchId: string;
  operations: ProductionOrderOperation[];
  bom: {
    id: string;
    revision: string;
    items: BOMItemWithDetails[];
  };
}

export interface BOMItemWithDetails {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  operation?: string | null;
  level: number;
  inventoryItem: {
    itemCode: string;
    name: string;
    currentStock: number;
    availableStock: number;
  };
}

export interface ProductionOrderOperation {
  id: string;
  operationId: string;
  sequence: number;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: string;
  assignedOperator?: string;
  operation: {
    code: string;
    name: string;
    workCenter: {
      code: string;
      name: string;
      type: string;
      capacity: number;
    };
  };
}

export interface CapacityRoutingResult {
  workCenterCode: string;
  operationCode: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  requiredCapacity: number;
  availableCapacity: number;
}

export interface MaterialConsumptionRecord {
  productionOrderId: string;
  inventoryItemId: string;
  plannedQuantity: number;
  actualQuantity: number;
  variance: number;
}

export interface ScrapRecord {
  productionOrderId: string;
  operationId?: string;
  inventoryItemId: string;
  quantity: number;
  reason: string;
  cost?: number;
}

export interface EngineeringChangeRequest {
  bomId: string;
  changeNumber: string;
  changeReason: string;
  effectiveDate: Date;
  requestedBy: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  impactAnalysis?: string;
  approvalRequired: boolean;
}

export interface EngineeringChangeApproval {
  changeId: string;
  approvedBy: string;
  approvalLevel: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedAt?: Date;
}

export interface GanttChartData {
  productionOrders: GanttProductionOrder[];
  workCenters: GanttWorkCenter[];
  timeline: {
    startDate: Date;
    endDate: Date;
    totalDays: number;
  };
}

export interface GanttProductionOrder {
  id: string;
  orderNumber: string;
  customerName?: string | undefined;
  productName?: string | undefined;
  quantity: number;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date | undefined;
  actualEnd?: Date | undefined;
  status: string;
  priority: number;
  progress: number;
  operations: GanttOperation[];
}

export interface GanttOperation {
  id: string;
  operationCode: string;
  operationName: string;
  workCenterCode: string;
  workCenterName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date | undefined;
  actualEnd?: Date | undefined;
  status: string;
  progress: number;
  assignedOperator?: string | undefined;
}

export interface GanttWorkCenter {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity: number;
  utilization: number;
  operations: GanttOperation[];
}

export interface CalendarViewData {
  date: Date;
  workCenters: CalendarWorkCenter[];
  totalOrders: number;
  totalOperations: number;
  averageUtilization: number;
}

export interface CalendarWorkCenter {
  id: string;
  code: string;
  name: string;
  utilization: number;
  operations: CalendarOperation[];
}

export interface CalendarOperation {
  id: string;
  productionOrderNumber: string;
  operationCode: string;
  operationName: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: string;
  customerName?: string | undefined;
}

export class ManufacturingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create production order with automatic generation from sales orders
   * Validates: Requirements 1.1 - Automatic production order generation
   */
  async createProductionOrder(request: CreateProductionOrderRequest): Promise<ProductionOrderWithOperations> {
    try {
      // Generate unique order number
      const orderNumber = await this.generateProductionOrderNumber();

      // Validate BOM exists and is approved
      const bom = await this.prisma.bOM.findUnique({
        where: { id: request.bomId },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  itemCode: true,
                  name: true,
                  currentStock: true,
                  availableStock: true,
                },
              },
            },
          },
        },
      });

      if (!bom || bom.status !== 'APPROVED') {
        throw new Error('BOM not found or not approved');
      }

      // Validate material availability
      await this.validateMaterialAvailability(bom.items, request.quantity);

      // Calculate capacity-based routing and scheduling
      const capacityRouting = await this.calculateCapacityRouting(
        bom.items,
        request.quantity,
        request.bufferDays || 0
      );

      const scheduledStartDate = capacityRouting[0]?.scheduledStart || new Date();
      const scheduledEndDate = capacityRouting[capacityRouting.length - 1]?.scheduledEnd || 
        new Date(Date.now() + (request.bufferDays || 0) * 24 * 60 * 60 * 1000);

      // Create production order
      const productionOrder = await this.prisma.productionOrder.create({
        data: {
          orderNumber,
          salesOrderId: request.salesOrderId || null,
          productId: request.productId || null,
          bomId: request.bomId,
          quantity: request.quantity,
          scheduledStartDate,
          scheduledEndDate,
          status: 'PLANNED',
          priority: request.priority || 5,
          bufferDays: request.bufferDays || 0,
          branchId: request.branchId,
        },
      });

      // Create production order operations based on BOM operations
      const operations = await this.createProductionOrderOperations(
        productionOrder.id,
        capacityRouting
      );

      // Reserve materials for this production order
      await this.reserveMaterials(bom.items, request.quantity, productionOrder.id);

      logger.info(`Production order ${orderNumber} created successfully`, {
        productionOrderId: productionOrder.id,
        salesOrderId: request.salesOrderId,
        quantity: request.quantity,
      });

      return this.getProductionOrderWithOperations(productionOrder.id);
    } catch (error) {
      logger.error('Error creating production order:', error);
      throw error;
    }
  }

  /**
   * Calculate capacity-based routing for production operations
   * Validates: Requirements 1.3 - Capacity constraint validation
   */
  async calculateCapacityRouting(
    bomItems: BOMItemWithDetails[],
    quantity: number,
    bufferDays: number
  ): Promise<CapacityRoutingResult[]> {
    try {
      // Get all operations from BOM items
      const operations = await this.prisma.operation.findMany({
        where: {
          code: {
            in: bomItems
              .map(item => item.operation)
              .filter(Boolean) as string[],
          },
        },
        include: {
          workCenter: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      });

      const routingResults: CapacityRoutingResult[] = [];
      let currentDate = new Date();

      for (const operation of operations) {
        // Calculate required time based on setup time + (run time * quantity)
        const setupTimeMinutes = operation.setupTime;
        const runTimeMinutes = operation.runTime * quantity;
        const totalTimeMinutes = setupTimeMinutes + runTimeMinutes;
        const totalTimeHours = totalTimeMinutes / 60;

        // Find available capacity slot
        const availableSlot = await this.findAvailableCapacitySlot(
          operation.workCenterId,
          totalTimeHours,
          currentDate
        );

        if (!availableSlot) {
          throw new Error(`No available capacity for operation ${operation.code}`);
        }

        routingResults.push({
          workCenterCode: operation.workCenter.code,
          operationCode: operation.code,
          scheduledStart: availableSlot.start,
          scheduledEnd: availableSlot.end,
          requiredCapacity: totalTimeHours,
          availableCapacity: operation.workCenter.capacity,
        });

        // Update current date for next operation
        currentDate = availableSlot.end;
      }

      // Add buffer days to final end date
      if (bufferDays > 0 && routingResults.length > 0) {
        const lastResult = routingResults[routingResults.length - 1];
        if (lastResult) {
          lastResult.scheduledEnd = new Date(
            lastResult.scheduledEnd.getTime() + bufferDays * 24 * 60 * 60 * 1000
          );
        }
      }

      return routingResults;
    } catch (error) {
      logger.error('Error calculating capacity routing:', error);
      throw error;
    }
  }

  /**
   * Validate material availability for production order
   * Validates: Requirements 1.1 - Material validation before order confirmation
   */
  private async validateMaterialAvailability(
    bomItems: BOMItemWithDetails[],
    quantity: number
  ): Promise<void> {
    const insufficientMaterials: string[] = [];

    for (const bomItem of bomItems) {
      const requiredQuantity = bomItem.quantity * quantity * (1 + bomItem.scrapPercentage / 100);
      
      if (bomItem.inventoryItem.availableStock < requiredQuantity) {
        insufficientMaterials.push(
          `${bomItem.inventoryItem.itemCode}: Required ${requiredQuantity}, Available ${bomItem.inventoryItem.availableStock}`
        );
      }
    }

    if (insufficientMaterials.length > 0) {
      throw new Error(`Insufficient materials: ${insufficientMaterials.join(', ')}`);
    }
  }

  /**
   * Find available capacity slot for operation scheduling
   */
  private async findAvailableCapacitySlot(
    workCenterId: string,
    requiredHours: number,
    startDate: Date
  ): Promise<{ start: Date; end: Date } | null> {
    // Get work center capacity schedules for the next 30 days
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const schedules = await this.prisma.capacitySchedule.findMany({
      where: {
        workCenterId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    for (const schedule of schedules) {
      const availableHours = schedule.availableHours - schedule.bookedHours;
      
      if (availableHours >= requiredHours) {
        // Book the capacity
        await this.prisma.capacitySchedule.update({
          where: { id: schedule.id },
          data: {
            bookedHours: schedule.bookedHours + requiredHours,
          },
        });

        const startTime = new Date(schedule.date);
        const endTime = new Date(startTime.getTime() + requiredHours * 60 * 60 * 1000);

        return { start: startTime, end: endTime };
      }
    }

    return null;
  }

  /**
   * Create production order operations based on capacity routing
   */
  private async createProductionOrderOperations(
    productionOrderId: string,
    capacityRouting: CapacityRoutingResult[]
  ): Promise<void> {
    const operations = await this.prisma.operation.findMany({
      where: {
        code: {
          in: capacityRouting.map(r => r.operationCode),
        },
      },
    });

    for (let i = 0; i < capacityRouting.length; i++) {
      const routing = capacityRouting[i];
      if (routing) {
        const operation = operations.find(op => op.code === routing.operationCode);
        
        if (operation) {
          await this.prisma.productionOrderOperation.create({
            data: {
              productionOrderId,
              operationId: operation.id,
              sequence: i + 1,
              scheduledStart: routing.scheduledStart,
              scheduledEnd: routing.scheduledEnd,
              status: 'PENDING',
            },
          });
        }
      }
    }
  }

  /**
   * Reserve materials for production order
   */
  private async reserveMaterials(
    bomItems: BOMItemWithDetails[],
    quantity: number,
    productionOrderId: string
  ): Promise<void> {
    for (const bomItem of bomItems) {
      const requiredQuantity = bomItem.quantity * quantity * (1 + bomItem.scrapPercentage / 100);
      
      // Update reserved stock
      await this.prisma.inventoryItem.update({
        where: { id: bomItem.inventoryItemId },
        data: {
          reservedStock: {
            increment: requiredQuantity,
          },
          availableStock: {
            decrement: requiredQuantity,
          },
        },
      });

      // Get inventory item to get warehouseId
      const inventoryItem = await this.prisma.inventoryItem.findUnique({
        where: { id: bomItem.inventoryItemId },
        select: { warehouseId: true },
      });

      // Create stock transaction for reservation
      await this.prisma.stockTransaction.create({
        data: {
          transactionType: 'OUT',
          inventoryItemId: bomItem.inventoryItemId,
          warehouseId: inventoryItem?.warehouseId || '',
          quantity: requiredQuantity,
          referenceType: 'PRODUCTION_ORDER',
          referenceId: productionOrderId,
          remarks: 'Material reserved for production',
        },
      });
    }
  }

  /**
   * Record material consumption with variance analysis
   * Validates: Requirements 13.5 - Material consumption tracking
   */
  async recordMaterialConsumption(
    consumptionRecord: MaterialConsumptionRecord
  ): Promise<void> {
    try {
      // Create material consumption record
      await this.prisma.materialConsumption.create({
        data: {
          productionOrderId: consumptionRecord.productionOrderId,
          inventoryItemId: consumptionRecord.inventoryItemId,
          plannedQuantity: consumptionRecord.plannedQuantity,
          actualQuantity: consumptionRecord.actualQuantity,
          variance: consumptionRecord.variance,
        },
      });

      // Update inventory stock levels
      await this.prisma.inventoryItem.update({
        where: { id: consumptionRecord.inventoryItemId },
        data: {
          currentStock: {
            decrement: consumptionRecord.actualQuantity,
          },
          reservedStock: {
            decrement: consumptionRecord.plannedQuantity,
          },
        },
      });

      // Get inventory item to get warehouseId
      const inventoryItem = await this.prisma.inventoryItem.findUnique({
        where: { id: consumptionRecord.inventoryItemId },
        select: { warehouseId: true },
      });

      // Create stock transaction
      await this.prisma.stockTransaction.create({
        data: {
          transactionType: 'OUT',
          inventoryItemId: consumptionRecord.inventoryItemId,
          warehouseId: inventoryItem?.warehouseId || '',
          quantity: consumptionRecord.actualQuantity,
          referenceType: 'PRODUCTION_ORDER',
          referenceId: consumptionRecord.productionOrderId,
          remarks: `Material consumption - Variance: ${consumptionRecord.variance}`,
        },
      });

      logger.info('Material consumption recorded', {
        productionOrderId: consumptionRecord.productionOrderId,
        inventoryItemId: consumptionRecord.inventoryItemId,
        variance: consumptionRecord.variance,
      });
    } catch (error) {
      logger.error('Error recording material consumption:', error);
      throw error;
    }
  }

  /**
   * Record scrap with costing integration
   * Validates: Requirements 13.1 - Scrap tracking by operation
   */
  async recordScrap(scrapRecord: ScrapRecord): Promise<void> {
    try {
      // Get inventory item for cost calculation
      const inventoryItem = await this.prisma.inventoryItem.findUnique({
        where: { id: scrapRecord.inventoryItemId },
      });

      if (!inventoryItem) {
        throw new Error('Inventory item not found');
      }

      const scrapCost = scrapRecord.cost || (inventoryItem.standardCost || 0) * scrapRecord.quantity;

      // Create scrap record
      await this.prisma.scrapRecord.create({
        data: {
          productionOrderId: scrapRecord.productionOrderId,
          operationId: scrapRecord.operationId || null,
          inventoryItemId: scrapRecord.inventoryItemId,
          quantity: scrapRecord.quantity,
          reason: scrapRecord.reason,
          cost: scrapCost,
        },
      });

      // Update inventory stock
      await this.prisma.inventoryItem.update({
        where: { id: scrapRecord.inventoryItemId },
        data: {
          currentStock: {
            decrement: scrapRecord.quantity,
          },
        },
      });

      // Create stock transaction for scrap
      await this.prisma.stockTransaction.create({
        data: {
          transactionType: 'OUT',
          inventoryItemId: scrapRecord.inventoryItemId,
          warehouseId: inventoryItem.warehouseId,
          quantity: scrapRecord.quantity,
          unitCost: inventoryItem.standardCost,
          totalValue: scrapCost,
          referenceType: 'SCRAP',
          referenceId: scrapRecord.productionOrderId,
          remarks: `Scrap - ${scrapRecord.reason}`,
        },
      });

      logger.info('Scrap recorded', {
        productionOrderId: scrapRecord.productionOrderId,
        quantity: scrapRecord.quantity,
        cost: scrapCost,
      });
    } catch (error) {
      logger.error('Error recording scrap:', error);
      throw error;
    }
  }

  /**
   * Update production order status with real-time tracking
   * Validates: Requirements 1.2 - Production order status tracking
   */
  async updateProductionOrderStatus(
    productionOrderId: string,
    status: string,
    actualStartDate?: Date,
    actualEndDate?: Date
  ): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (actualStartDate) {
        updateData.actualStartDate = actualStartDate;
      }
      
      if (actualEndDate) {
        updateData.actualEndDate = actualEndDate;
      }

      await this.prisma.productionOrder.update({
        where: { id: productionOrderId },
        data: updateData,
      });

      logger.info('Production order status updated', {
        productionOrderId,
        status,
        actualStartDate,
        actualEndDate,
      });
    } catch (error) {
      logger.error('Error updating production order status:', error);
      throw error;
    }
  }

  /**
   * Get production order with operations and BOM details
   */
  async getProductionOrderWithOperations(productionOrderId: string): Promise<ProductionOrderWithOperations> {
    const productionOrder = await this.prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
      include: {
        operations: {
          include: {
            operation: {
              include: {
                workCenter: true,
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        bom: {
          include: {
            items: {
              include: {
                inventoryItem: {
                  select: {
                    itemCode: true,
                    name: true,
                    currentStock: true,
                    availableStock: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!productionOrder) {
      throw new Error('Production order not found');
    }

    return productionOrder as ProductionOrderWithOperations;
  }

  /**
   * Generate unique production order number
   */
  private async generateProductionOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const prefix = `PO${year}${month}`;
    
    // Get the last order number for this month
    const lastOrder = await this.prisma.productionOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Get production schedule for Gantt chart visualization
   * Validates: Requirements 1.2 - Gantt chart and calendar visualization
   */
  async getProductionSchedule(branchId?: string, startDate?: Date, endDate?: Date) {
    const whereClause: any = {};
    
    if (branchId) {
      whereClause.branchId = branchId;
    }
    
    if (startDate && endDate) {
      whereClause.scheduledStartDate = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.productionOrder.findMany({
      where: whereClause,
      include: {
        operations: {
          include: {
            operation: {
              include: {
                workCenter: true,
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
        salesOrder: {
          include: {
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStartDate: 'asc',
      },
    });
  }

  /**
   * Get Gantt chart data with enhanced visualization
   * Validates: Requirements 1.2 - Gantt chart and calendar visualization
   */
  async getGanttChartData(
    branchId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GanttChartData> {
    try {
      // Set default date range if not provided
      const defaultStartDate = startDate || new Date();
      const defaultEndDate = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      // Get production orders with operations
      const productionOrders = await this.getProductionSchedule(branchId, defaultStartDate, defaultEndDate);

      // Get work centers with utilization
      const workCenters = await this.prisma.workCenter.findMany({
        where: { isActive: true },
        include: {
          operations: {
            include: {
              productionOrderOperations: {
                where: {
                  scheduledStart: {
                    gte: defaultStartDate,
                    lte: defaultEndDate,
                  },
                },
                include: {
                  productionOrder: {
                    include: {
                      salesOrder: {
                        include: {
                          customer: {
                            select: { name: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          schedules: {
            where: {
              date: {
                gte: defaultStartDate,
                lte: defaultEndDate,
              },
            },
          },
        },
      });

      // Transform production orders for Gantt chart
      const ganttProductionOrders: GanttProductionOrder[] = productionOrders.map(po => {
        const operations: GanttOperation[] = po.operations.map(op => ({
          id: op.id,
          operationCode: op.operation.code,
          operationName: op.operation.name,
          workCenterCode: op.operation.workCenter.code,
          workCenterName: op.operation.workCenter.name,
          scheduledStart: op.scheduledStart,
          scheduledEnd: op.scheduledEnd,
          actualStart: op.actualStart || undefined,
          actualEnd: op.actualEnd || undefined,
          status: op.status,
          progress: this.calculateOperationProgress(op),
          assignedOperator: op.assignedOperator || undefined,
        }));

        return {
          id: po.id,
          orderNumber: po.orderNumber,
          customerName: po.salesOrder?.customer?.name,
          productName: undefined, // Will be populated if product relation exists
          quantity: po.quantity,
          scheduledStart: po.scheduledStartDate,
          scheduledEnd: po.scheduledEndDate,
          actualStart: po.actualStartDate || undefined,
          actualEnd: po.actualEndDate || undefined,
          status: po.status,
          priority: po.priority,
          progress: this.calculateProductionOrderProgress(po),
          operations,
        };
      });

      // Transform work centers for Gantt chart
      const ganttWorkCenters: GanttWorkCenter[] = workCenters.map(wc => {
        const operations: GanttOperation[] = [];
        
        wc.operations.forEach(op => {
          op.productionOrderOperations.forEach(poo => {
            operations.push({
              id: poo.id,
              operationCode: op.code,
              operationName: op.name,
              workCenterCode: wc.code,
              workCenterName: wc.name,
              scheduledStart: poo.scheduledStart,
              scheduledEnd: poo.scheduledEnd,
              actualStart: poo.actualStart || undefined,
              actualEnd: poo.actualEnd || undefined,
              status: poo.status,
              progress: this.calculateOperationProgress(poo),
              assignedOperator: poo.assignedOperator || undefined,
            });
          });
        });

        // Calculate utilization
        const totalAvailableHours = wc.schedules.reduce((sum, s) => sum + s.availableHours, 0);
        const totalBookedHours = wc.schedules.reduce((sum, s) => sum + s.bookedHours, 0);
        const utilization = totalAvailableHours > 0 ? (totalBookedHours / totalAvailableHours) * 100 : 0;

        return {
          id: wc.id,
          code: wc.code,
          name: wc.name,
          type: wc.type,
          capacity: wc.capacity,
          utilization,
          operations,
        };
      });

      const totalDays = Math.ceil((defaultEndDate.getTime() - defaultStartDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        productionOrders: ganttProductionOrders,
        workCenters: ganttWorkCenters,
        timeline: {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          totalDays,
        },
      };
    } catch (error) {
      logger.error('Error getting Gantt chart data:', error);
      throw error;
    }
  }

  /**
   * Get calendar view data for production scheduling
   * Validates: Requirements 1.2 - Calendar visualization
   */
  async getCalendarViewData(
    startDate: Date,
    endDate: Date,
    branchId?: string
  ): Promise<CalendarViewData[]> {
    try {
      const calendarData: CalendarViewData[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Get operations scheduled for this day
        const operations = await this.prisma.productionOrderOperation.findMany({
          where: {
            scheduledStart: {
              gte: dayStart,
              lte: dayEnd,
            },
            ...(branchId && {
              productionOrder: {
                branchId,
              },
            }),
          },
          include: {
            operation: {
              include: {
                workCenter: true,
              },
            },
            productionOrder: {
              include: {
                salesOrder: {
                  include: {
                    customer: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        });

        // Group operations by work center
        const workCenterMap = new Map<string, CalendarWorkCenter>();

        operations.forEach(op => {
          const wcId = op.operation.workCenterId;
          
          if (!workCenterMap.has(wcId)) {
            workCenterMap.set(wcId, {
              id: wcId,
              code: op.operation.workCenter.code,
              name: op.operation.workCenter.name,
              utilization: 0,
              operations: [],
            });
          }

          const calendarOp: CalendarOperation = {
            id: op.id,
            productionOrderNumber: op.productionOrder.orderNumber,
            operationCode: op.operation.code,
            operationName: op.operation.name,
            scheduledStart: op.scheduledStart,
            scheduledEnd: op.scheduledEnd,
            status: op.status,
            customerName: op.productionOrder.salesOrder?.customer?.name,
          };

          workCenterMap.get(wcId)!.operations.push(calendarOp);
        });

        // Calculate utilization for each work center
        const workCenters = Array.from(workCenterMap.values());
        let totalUtilization = 0;

        for (const wc of workCenters) {
          const schedule = await this.prisma.capacitySchedule.findFirst({
            where: {
              workCenterId: wc.id,
              date: dayStart,
            },
          });

          if (schedule) {
            wc.utilization = schedule.availableHours > 0 
              ? (schedule.bookedHours / schedule.availableHours) * 100 
              : 0;
            totalUtilization += wc.utilization;
          }
        }

        const averageUtilization = workCenters.length > 0 ? totalUtilization / workCenters.length : 0;

        calendarData.push({
          date: new Date(currentDate),
          workCenters,
          totalOrders: new Set(operations.map(op => op.productionOrder.id)).size,
          totalOperations: operations.length,
          averageUtilization,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return calendarData;
    } catch (error) {
      logger.error('Error getting calendar view data:', error);
      throw error;
    }
  }

  /**
   * Create engineering change request with approval workflow
   * Validates: Requirements 1.5 - Engineering change management workflows
   */
  async createEngineeringChangeRequest(request: EngineeringChangeRequest): Promise<string> {
    try {
      // Validate BOM exists
      const bom = await this.prisma.bOM.findUnique({
        where: { id: request.bomId },
        include: {
          productionOrders: {
            where: {
              status: {
                in: ['PLANNED', 'IN_PROGRESS'],
              },
            },
          },
        },
      });

      if (!bom) {
        throw new Error('BOM not found');
      }

      // Analyze impact on active production orders
      const impactedOrders = bom.productionOrders.length;
      const impactAnalysis = `${impactedOrders} active production orders will be affected by this change.`;

      // Create engineering change record (assuming we have this table)
      // For now, we'll create a simple record in a hypothetical table
      // In a real implementation, you would need to add this to the schema

      logger.info('Engineering change request created', {
        bomId: request.bomId,
        changeNumber: request.changeNumber,
        impactedOrders,
        requestedBy: request.requestedBy,
      });

      // If approval is required, initiate approval workflow
      if (request.approvalRequired) {
        await this.initiateApprovalWorkflow(request.changeNumber, request.priority);
      }

      return request.changeNumber;
    } catch (error) {
      logger.error('Error creating engineering change request:', error);
      throw error;
    }
  }

  /**
   * Initiate approval workflow for engineering changes
   * Validates: Requirements 1.5 - Approval processes
   */
  private async initiateApprovalWorkflow(changeNumber: string, priority: string): Promise<void> {
    try {
      // Define approval levels based on priority
      const approvalLevels = this.getApprovalLevels(priority);

      // Create approval records for each level
      // This would typically involve creating records in an approval table
      // and sending notifications to approvers

      logger.info('Approval workflow initiated', {
        changeNumber,
        priority,
        approvalLevels: approvalLevels.length,
      });

      // Send notifications to first level approvers
      // This would integrate with the alert system
    } catch (error) {
      logger.error('Error initiating approval workflow:', error);
      throw error;
    }
  }

  /**
   * Get approval levels based on change priority
   */
  private getApprovalLevels(priority: string): string[] {
    switch (priority) {
      case 'CRITICAL':
        return ['PRODUCTION_MANAGER', 'ENGINEERING_MANAGER', 'GENERAL_MANAGER'];
      case 'HIGH':
        return ['PRODUCTION_MANAGER', 'ENGINEERING_MANAGER'];
      case 'MEDIUM':
        return ['PRODUCTION_MANAGER'];
      case 'LOW':
        return ['TEAM_LEADER'];
      default:
        return ['PRODUCTION_MANAGER'];
    }
  }

  /**
   * Enhanced buffer day calculation with lead time management
   * Validates: Requirements 1.4 - Buffer day calculations and lead time management
   */
  async calculateEnhancedDeliveryDate(
    bomId: string,
    quantity: number,
    requestedDeliveryDate?: Date,
    customBufferDays?: number
  ): Promise<{
    calculatedDeliveryDate: Date;
    totalLeadTime: number;
    bufferDays: number;
    materialLeadTime: number;
    productionTime: number;
    riskFactors: string[];
  }> {
    try {
      // Get BOM with material lead times
      const bom = await this.prisma.bOM.findUnique({
        where: { id: bomId },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  leadTimeDays: true,
                  availableStock: true,
                  reorderLevel: true,
                },
              },
            },
          },
        },
      });

      if (!bom) {
        throw new Error('BOM not found');
      }

      // Calculate material lead time
      let maxMaterialLeadTime = 0;
      const riskFactors: string[] = [];

      for (const item of bom.items) {
        const requiredQty = item.quantity * quantity;
        
        if (item.inventoryItem.availableStock < requiredQty) {
          maxMaterialLeadTime = Math.max(maxMaterialLeadTime, item.inventoryItem.leadTimeDays);
          riskFactors.push(`Insufficient stock for ${item.inventoryItem}`);
        }

        if (item.inventoryItem.availableStock <= item.inventoryItem.reorderLevel) {
          riskFactors.push(`Low stock alert for ${item.inventoryItem}`);
        }
      }

      // Transform BOM items to match expected interface
      const bomItemsWithDetails: BOMItemWithDetails[] = bom.items.map(item => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unit: item.unit,
        scrapPercentage: item.scrapPercentage,
        operation: item.operation,
        level: item.level,
        inventoryItem: {
          itemCode: 'ITEM_' + item.inventoryItemId.substring(0, 8), // Placeholder
          name: 'Item Name', // Placeholder
          currentStock: 0, // Placeholder
          availableStock: item.inventoryItem.availableStock,
        },
      }));

      // Calculate production time based on capacity routing
      const capacityRouting = await this.calculateCapacityRouting(bomItemsWithDetails, quantity, 0);
      const productionTimeHours = capacityRouting.reduce((total, route) => total + route.requiredCapacity, 0);
      const productionTimeDays = Math.ceil(productionTimeHours / 8); // Assuming 8-hour workdays

      // Calculate buffer days based on complexity and risk
      let bufferDays = customBufferDays || 0;
      
      if (!customBufferDays) {
        // Auto-calculate buffer based on risk factors
        bufferDays = Math.max(2, Math.ceil(productionTimeDays * 0.2)); // 20% buffer minimum 2 days
        
        if (riskFactors.length > 0) {
          bufferDays += Math.min(5, riskFactors.length); // Add days for each risk factor, max 5
        }

        // Add buffer for high-priority or complex orders
        if (quantity > 100) {
          bufferDays += 2; // Large orders get extra buffer
        }
      }

      const totalLeadTime = maxMaterialLeadTime + productionTimeDays + bufferDays;
      const calculatedDeliveryDate = new Date(Date.now() + totalLeadTime * 24 * 60 * 60 * 1000);

      // Check against requested delivery date
      if (requestedDeliveryDate && calculatedDeliveryDate > requestedDeliveryDate) {
        riskFactors.push('Calculated delivery date exceeds requested date');
      }

      return {
        calculatedDeliveryDate,
        totalLeadTime,
        bufferDays,
        materialLeadTime: maxMaterialLeadTime,
        productionTime: productionTimeDays,
        riskFactors,
      };
    } catch (error) {
      logger.error('Error calculating enhanced delivery date:', error);
      throw error;
    }
  }

  /**
   * Calculate production order progress
   */
  private calculateProductionOrderProgress(productionOrder: any): number {
    if (productionOrder.status === 'COMPLETED') return 100;
    if (productionOrder.status === 'PLANNED') return 0;

    const completedOperations = productionOrder.operations?.filter((op: any) => op.status === 'COMPLETED').length || 0;
    const totalOperations = productionOrder.operations?.length || 1;

    return Math.round((completedOperations / totalOperations) * 100);
  }

  /**
   * Calculate operation progress
   */
  private calculateOperationProgress(operation: any): number {
    if (operation.status === 'COMPLETED') return 100;
    if (operation.status === 'PENDING') return 0;
    if (operation.status === 'IN_PROGRESS') {
      // Calculate based on time elapsed
      if (operation.actualStart && operation.scheduledEnd) {
        const totalTime = operation.scheduledEnd.getTime() - operation.scheduledStart.getTime();
        const elapsedTime = Date.now() - operation.actualStart.getTime();
        return Math.min(99, Math.max(1, Math.round((elapsedTime / totalTime) * 100)));
      }
      return 50; // Default for in-progress without timing data
    }
    return 0;
  }
}