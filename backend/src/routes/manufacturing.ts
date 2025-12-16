// Manufacturing Routes - API endpoints for production management
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { ManufacturingService } from '../services/manufacturing.service';
import { BOMService } from '../services/bom.service';
import { WorkCenterService } from '../services/workCenter.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const manufacturingService = new ManufacturingService(prisma);
const bomService = new BOMService(prisma);
const workCenterService = new WorkCenterService(prisma);

// Validation schemas
const createProductionOrderSchema = z.object({
  salesOrderId: z.string().optional(),
  productId: z.string().optional(),
  bomId: z.string().uuid(),
  quantity: z.number().positive(),
  priority: z.number().min(1).max(10).optional(),
  bufferDays: z.number().min(0).optional(),
  branchId: z.string().uuid(),
});

const createBOMSchema = z.object({
  productId: z.string().uuid(),
  revision: z.string().min(1),
  effectiveDate: z.string().datetime(),
  engineeringChangeNumber: z.string().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    scrapPercentage: z.number().min(0).max(100).optional(),
    operation: z.string().optional(),
    level: z.number().min(1).optional(),
    parentItemId: z.string().uuid().optional(),
    sequence: z.number().min(1).optional(),
  })),
});

const updateBOMSchema = z.object({
  bomId: z.string().uuid(),
  engineeringChangeNumber: z.string().min(1),
  newRevision: z.string().min(1),
  effectiveDate: z.string().datetime(),
  changeReason: z.string().min(1),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    scrapPercentage: z.number().min(0).max(100).optional(),
    operation: z.string().optional(),
    level: z.number().min(1).optional(),
    parentItemId: z.string().uuid().optional(),
    sequence: z.number().min(1).optional(),
  })),
});

const createWorkCenterSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['CUTTING', 'CNC', 'BENDING', 'WELDING', 'COATING', 'ASSEMBLY']),
  capacity: z.number().positive(),
});

const createOperationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  workCenterId: z.string().uuid(),
  setupTime: z.number().min(0),
  runTime: z.number().min(0),
  sequence: z.number().min(1),
});

const materialConsumptionSchema = z.object({
  productionOrderId: z.string().uuid(),
  inventoryItemId: z.string().uuid(),
  plannedQuantity: z.number().positive(),
  actualQuantity: z.number().positive(),
  variance: z.number(),
});

const scrapRecordSchema = z.object({
  productionOrderId: z.string().uuid(),
  operationId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive(),
  reason: z.string().min(1),
  cost: z.number().positive().optional(),
});

// Production Order Management Routes

/**
 * POST /api/manufacturing/production-orders
 * Create production order with material validation
 * Validates: Requirements 1.1 - Automatic production order generation
 */
router.post('/production-orders', 
  authenticate,
  validate({ body: createProductionOrderSchema }),
  async (req, res) => {
    try {
      const productionOrder = await manufacturingService.createProductionOrder({
        ...req.body,
        effectiveDate: new Date(req.body.effectiveDate),
      });

      res.status(201).json({
        success: true,
        data: productionOrder,
        message: 'Production order created successfully',
      });
    } catch (error) {
      logger.error('Error creating production order:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCTION_ORDER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create production order',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/production-orders/:id
 * Get production order with operations and BOM details
 */
router.get('/production-orders/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Production order ID is required',
          },
        });
        return;
      }
      
      const productionOrder = await manufacturingService.getProductionOrderWithOperations(id);
      
      res.json({
        success: true,
        data: productionOrder,
      });
    } catch (error) {
      logger.error('Error getting production order:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCTION_ORDER_NOT_FOUND',
          message: 'Production order not found',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/schedule
 * Get Gantt chart and calendar visualization data
 * Validates: Requirements 1.2 - Gantt chart and calendar visualization
 */
router.get('/schedule',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;
      
      const schedule = await manufacturingService.getProductionSchedule(
        branchId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error('Error getting production schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SCHEDULE_FETCH_FAILED',
          message: 'Failed to fetch production schedule',
        },
      });
    }
  }
);

/**
 * PUT /api/manufacturing/production-orders/:id/status
 * Update production order status with real-time tracking
 * Validates: Requirements 1.2 - Production order status tracking
 */
router.put('/production-orders/:id/status',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, actualStartDate, actualEndDate } = req.body;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Production order ID is required',
          },
        });
        return;
      }
      
      await manufacturingService.updateProductionOrderStatus(
        id,
        status,
        actualStartDate ? new Date(actualStartDate) : undefined,
        actualEndDate ? new Date(actualEndDate) : undefined
      );

      res.json({
        success: true,
        message: 'Production order status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating production order status:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'STATUS_UPDATE_FAILED',
          message: 'Failed to update production order status',
        },
      });
    }
  }
);

// BOM Management Routes

/**
 * POST /api/manufacturing/bom
 * Create multi-level BOM with revision control
 * Validates: Requirements 1.5 - Multi-level BOM management
 */
router.post('/bom',
  authenticate,
  validate({ body: createBOMSchema }),
  async (req, res) => {
    try {
      const bom = await bomService.createBOM({
        ...req.body,
        effectiveDate: new Date(req.body.effectiveDate),
      }, req.user?.id || 'system');

      res.status(201).json({
        success: true,
        data: bom,
        message: 'BOM created successfully',
      });
    } catch (error) {
      logger.error('Error creating BOM:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BOM_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create BOM',
        },
      });
    }
  }
);

/**
 * PUT /api/manufacturing/bom/engineering-change
 * Update BOM with engineering change management
 * Validates: Requirements 1.5 - Engineering change management
 */
router.put('/bom/engineering-change',
  authenticate,
  validate({ body: updateBOMSchema }),
  async (req, res) => {
    try {
      const result = await bomService.updateBOMWithEngineeringChange({
        ...req.body,
        effectiveDate: new Date(req.body.effectiveDate),
      }, req.user?.id || 'system');

      res.json({
        success: true,
        data: result,
        message: 'BOM updated with engineering change successfully',
      });
    } catch (error) {
      logger.error('Error updating BOM with engineering change:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BOM_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update BOM',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/bom/:id
 * Get BOM with hierarchical structure
 */
router.get('/bom/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'BOM ID is required',
          },
        });
        return;
      }
      
      const bom = await bomService.getBOMWithItems(id);
      
      res.json({
        success: true,
        data: bom,
      });
    } catch (error) {
      logger.error('Error getting BOM:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'BOM_NOT_FOUND',
          message: 'BOM not found',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/bom/:id/approve
 * Approve BOM and make it active
 */
router.post('/bom/:id/approve',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'BOM ID is required',
          },
        });
        return;
      }
      
      const bom = await bomService.approveBOM(id, req.user?.id || 'system');
      
      res.json({
        success: true,
        data: bom,
        message: 'BOM approved successfully',
      });
    } catch (error) {
      logger.error('Error approving BOM:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BOM_APPROVAL_FAILED',
          message: 'Failed to approve BOM',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/bom/:id/cost
 * Calculate BOM cost rollup
 */
router.get('/bom/:id/cost',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity = 1 } = req.query;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'BOM ID is required',
          },
        });
        return;
      }
      
      const costAnalysis = await bomService.calculateBOMCost(
        id, 
        Number(quantity)
      );
      
      res.json({
        success: true,
        data: costAnalysis,
      });
    } catch (error) {
      logger.error('Error calculating BOM cost:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BOM_COST_CALCULATION_FAILED',
          message: 'Failed to calculate BOM cost',
        },
      });
    }
  }
);

// Work Center Management Routes

/**
 * POST /api/manufacturing/work-centers
 * Create work center for capacity management
 * Validates: Requirements 1.3 - Work center management
 */
router.post('/work-centers',
  authenticate,
  validate({ body: createWorkCenterSchema }),
  async (req, res) => {
    try {
      const workCenter = await workCenterService.createWorkCenter(req.body);

      res.status(201).json({
        success: true,
        data: workCenter,
        message: 'Work center created successfully',
      });
    } catch (error) {
      logger.error('Error creating work center:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'WORK_CENTER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create work center',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/operations
 * Create operation for work center
 * Validates: Requirements 1.3 - Operation management
 */
router.post('/operations',
  authenticate,
  validate({ body: createOperationSchema }),
  async (req, res) => {
    try {
      const operation = await workCenterService.createOperation(req.body);

      res.status(201).json({
        success: true,
        data: operation,
        message: 'Operation created successfully',
      });
    } catch (error) {
      logger.error('Error creating operation:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'OPERATION_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create operation',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/capacity-routing
 * Calculate capacity-based routing for operations
 * Validates: Requirements 1.3 - Capacity constraint validation
 */
router.post('/capacity-routing',
  authenticate,
  async (req, res) => {
    try {
      const { bomItems, quantity, bufferDays } = req.body;
      
      const routing = await manufacturingService.calculateCapacityRouting(
        bomItems,
        quantity,
        bufferDays || 0
      );

      res.json({
        success: true,
        data: routing,
      });
    } catch (error) {
      logger.error('Error calculating capacity routing:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CAPACITY_ROUTING_FAILED',
          message: 'Failed to calculate capacity routing',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/machine-schedule
 * Get machine schedule for Gantt chart visualization
 * Validates: Requirements 1.2 - Gantt chart and calendar visualization
 */
router.get('/machine-schedule',
  authenticate,
  async (req, res) => {
    try {
      const { startDate, endDate, workCenterIds } = req.query;
      
      const schedule = await workCenterService.getMachineSchedule(
        new Date(startDate as string),
        new Date(endDate as string),
        workCenterIds ? (workCenterIds as string).split(',') : undefined
      );

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error('Error getting machine schedule:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MACHINE_SCHEDULE_FAILED',
          message: 'Failed to get machine schedule',
        },
      });
    }
  }
);

// Material Consumption and Scrap Tracking Routes

/**
 * POST /api/manufacturing/material-consumption
 * Record material consumption with variance analysis
 * Validates: Requirements 13.5 - Material consumption tracking
 */
router.post('/material-consumption',
  authenticate,
  validate({ body: materialConsumptionSchema }),
  async (req, res) => {
    try {
      await manufacturingService.recordMaterialConsumption(req.body);

      res.json({
        success: true,
        message: 'Material consumption recorded successfully',
      });
    } catch (error) {
      logger.error('Error recording material consumption:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MATERIAL_CONSUMPTION_FAILED',
          message: 'Failed to record material consumption',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/scrap-tracking
 * Record scrap by operation with costing integration
 * Validates: Requirements 13.1 - Scrap tracking by operation
 */
router.post('/scrap-tracking',
  authenticate,
  validate({ body: scrapRecordSchema }),
  async (req, res) => {
    try {
      await manufacturingService.recordScrap(req.body);

      res.json({
        success: true,
        message: 'Scrap recorded successfully',
      });
    } catch (error) {
      logger.error('Error recording scrap:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SCRAP_RECORDING_FAILED',
          message: 'Failed to record scrap',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/work-centers
 * Get all work centers with utilization
 */
router.get('/work-centers',
  authenticate,
  async (req, res) => {
    try {
      const workCenters = await workCenterService.getAllWorkCenters();
      
      res.json({
        success: true,
        data: workCenters,
      });
    } catch (error) {
      logger.error('Error getting work centers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WORK_CENTERS_FETCH_FAILED',
          message: 'Failed to fetch work centers',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/utilization
 * Get work center utilization report
 */
router.get('/utilization',
  authenticate,
  async (req, res) => {
    try {
      const { startDate, endDate, workCenterId } = req.query;
      
      const utilization = await workCenterService.getWorkCenterUtilization(
        new Date(startDate as string),
        new Date(endDate as string),
        workCenterId as string
      );

      res.json({
        success: true,
        data: utilization,
      });
    } catch (error) {
      logger.error('Error getting work center utilization:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UTILIZATION_FETCH_FAILED',
          message: 'Failed to fetch utilization data',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/gantt-chart
 * Get enhanced Gantt chart data for production visualization
 * Validates: Requirements 1.2 - Gantt chart and calendar visualization
 */
router.get('/gantt-chart',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;
      
      const ganttData = await manufacturingService.getGanttChartData(
        branchId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: ganttData,
      });
    } catch (error) {
      logger.error('Error getting Gantt chart data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GANTT_CHART_FAILED',
          message: 'Failed to get Gantt chart data',
        },
      });
    }
  }
);

/**
 * GET /api/manufacturing/calendar-view
 * Get calendar view data for production scheduling
 * Validates: Requirements 1.2 - Calendar visualization
 */
router.get('/calendar-view',
  authenticate,
  async (req, res) => {
    try {
      const { startDate, endDate, branchId } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Start date and end date are required',
          },
        });
        return;
      }
      
      const calendarData = await manufacturingService.getCalendarViewData(
        new Date(startDate as string),
        new Date(endDate as string),
        branchId as string
      );

      res.json({
        success: true,
        data: calendarData,
      });
    } catch (error) {
      logger.error('Error getting calendar view data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CALENDAR_VIEW_FAILED',
          message: 'Failed to get calendar view data',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/engineering-change
 * Create engineering change request with approval workflow
 * Validates: Requirements 1.5 - Engineering change management workflows
 */
router.post('/engineering-change',
  authenticate,
  async (req, res) => {
    try {
      const {
        bomId,
        changeNumber,
        changeReason,
        effectiveDate,
        priority,
        description,
        impactAnalysis,
        approvalRequired
      } = req.body;

      if (!bomId || !changeNumber || !changeReason || !effectiveDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'BOM ID, change number, change reason, and effective date are required',
          },
        });
        return;
      }

      const changeRequestId = await manufacturingService.createEngineeringChangeRequest({
        bomId,
        changeNumber,
        changeReason,
        effectiveDate: new Date(effectiveDate),
        requestedBy: req.user?.id || 'system',
        priority: priority || 'MEDIUM',
        description,
        impactAnalysis,
        approvalRequired: approvalRequired !== false, // Default to true
      });

      res.status(201).json({
        success: true,
        data: { changeRequestId },
        message: 'Engineering change request created successfully',
      });
    } catch (error) {
      logger.error('Error creating engineering change request:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'ENGINEERING_CHANGE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create engineering change request',
        },
      });
    }
  }
);

/**
 * POST /api/manufacturing/delivery-date-calculation
 * Calculate enhanced delivery date with buffer days and lead time management
 * Validates: Requirements 1.4 - Buffer day calculations and lead time management
 */
router.post('/delivery-date-calculation',
  authenticate,
  async (req, res) => {
    try {
      const { bomId, quantity, requestedDeliveryDate, customBufferDays } = req.body;

      if (!bomId || !quantity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'BOM ID and quantity are required',
          },
        });
        return;
      }

      const deliveryCalculation = await manufacturingService.calculateEnhancedDeliveryDate(
        bomId,
        quantity,
        requestedDeliveryDate ? new Date(requestedDeliveryDate) : undefined,
        customBufferDays
      );

      res.json({
        success: true,
        data: deliveryCalculation,
      });
    } catch (error) {
      logger.error('Error calculating delivery date:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'DELIVERY_CALCULATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to calculate delivery date',
        },
      });
    }
  }
);

/**
 * PUT /api/manufacturing/production-orders/:id/reschedule
 * Reschedule production order with updated capacity routing
 * Validates: Requirements 1.3 - Capacity-based routing calculations
 */
router.put('/production-orders/:id/reschedule',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newStartDate, bufferDays, priority } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Production order ID is required',
          },
        });
        return;
      }

      // Get production order with BOM
      const productionOrder = await manufacturingService.getProductionOrderWithOperations(id);
      
      // Recalculate capacity routing with new parameters
      const newRouting = await manufacturingService.calculateCapacityRouting(
        productionOrder.bom.items,
        productionOrder.quantity,
        bufferDays || productionOrder.bufferDays
      );

      // Update production order with new schedule
      const newScheduledStart = newStartDate ? new Date(newStartDate) : newRouting[0]?.scheduledStart || new Date();
      const newScheduledEnd = newRouting[newRouting.length - 1]?.scheduledEnd || 
        new Date(Date.now() + (bufferDays || 0) * 24 * 60 * 60 * 1000);

      await prisma.productionOrder.update({
        where: { id },
        data: {
          scheduledStartDate: newScheduledStart,
          scheduledEndDate: newScheduledEnd,
          priority: priority || productionOrder.priority,
          bufferDays: bufferDays || productionOrder.bufferDays,
        },
      });

      // Update operation schedules
      for (let i = 0; i < newRouting.length; i++) {
        const routing = newRouting[i];
        if (routing && productionOrder.operations[i]) {
          await prisma.productionOrderOperation.update({
            where: { id: productionOrder.operations[i]!.id },
            data: {
              scheduledStart: routing.scheduledStart,
              scheduledEnd: routing.scheduledEnd,
            },
          });
        }
      }

      res.json({
        success: true,
        message: 'Production order rescheduled successfully',
        data: {
          newScheduledStart,
          newScheduledEnd,
          capacityRouting: newRouting,
        },
      });
    } catch (error) {
      logger.error('Error rescheduling production order:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'RESCHEDULE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to reschedule production order',
        },
      });
    }
  }
);

export { router as manufacturingRoutes };