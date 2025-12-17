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
 * @swagger
 * /manufacturing/production-orders:
 *   post:
 *     summary: Create a new production order
 *     description: Creates a production order with material validation and scheduling
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductionOrder'
 *     responses:
 *       201:
 *         description: Production order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductionOrder'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/production-orders', 
  authenticate,
  validate({ body: createProductionOrderSchema }),
  async (req, res) => {
    try {
      const productionOrder = await manufacturingService.createProductionOrder(req.body);

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
 * @swagger
 * /manufacturing/production-orders:
 *   get:
 *     summary: Get all production orders
 *     description: Retrieve production orders with filtering and pagination
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (from)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (to)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of production orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductionOrder'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/production-orders',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
      
      const whereClause: any = {};
      
      if (branchId) {
        whereClause.branchId = branchId as string;
      }
      
      if (status) {
        whereClause.status = status as string;
      }
      
      if (startDate && endDate) {
        whereClause.scheduledStartDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const [productionOrders, total] = await Promise.all([
        prisma.productionOrder.findMany({
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
            bom: {
              select: {
                id: true,
                revision: true,
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
            scheduledStartDate: 'desc',
          },
          skip,
          take: Number(limit),
        }),
        prisma.productionOrder.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: productionOrders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error getting production orders:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCTION_ORDERS_FETCH_FAILED',
          message: 'Failed to fetch production orders',
        },
      });
    }
  }
);

/**
 * @swagger
 * /manufacturing/production-orders/{id}:
 *   get:
 *     summary: Get production order by ID
 *     description: Get production order with operations and BOM details
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Production order ID
 *     responses:
 *       200:
 *         description: Production order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductionOrder'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/schedule:
 *   get:
 *     summary: Get production schedule
 *     description: Get Gantt chart and calendar visualization data for production scheduling
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for schedule
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for schedule
 *     responses:
 *       200:
 *         description: Production schedule data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/production-orders/{id}/status:
 *   put:
 *     summary: Update production order status
 *     description: Update production order status with real-time tracking
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Production order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PLANNED, IN_PROGRESS, COMPLETED, CANCELLED]
 *               actualStartDate:
 *                 type: string
 *                 format: date-time
 *               actualEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/bom:
 *   post:
 *     summary: Create BOM
 *     description: Create multi-level Bill of Materials with revision control
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, revision, effectiveDate, items]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               revision:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *               engineeringChangeNumber:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     scrapPercentage:
 *                       type: number
 *     responses:
 *       201:
 *         description: BOM created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BOM'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/bom/engineering-change:
 *   put:
 *     summary: Update BOM with engineering change
 *     description: Update BOM with engineering change management and revision control
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bomId, engineeringChangeNumber, newRevision, effectiveDate, changeReason, items]
 *             properties:
 *               bomId:
 *                 type: string
 *                 format: uuid
 *               engineeringChangeNumber:
 *                 type: string
 *               newRevision:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *               changeReason:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     scrapPercentage:
 *                       type: number
 *     responses:
 *       200:
 *         description: BOM updated with engineering change successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/products:
 *   get:
 *     summary: Get all active products
 *     description: Retrieve all active products for BOM creation
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       type:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/products',
  authenticate,
  async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          isDeleted: false,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          category: true,
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      logger.error('Error getting products:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCTS_FETCH_FAILED',
          message: 'Failed to fetch products',
        },
      });
    }
  }
);

/**
 * @swagger
 * /manufacturing/inventory-items:
 *   get:
 *     summary: Get all active inventory items
 *     description: Retrieve all active inventory items for BOM item selection
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       category:
 *                         type: string
 *                       unit:
 *                         type: string
 *                       standardCost:
 *                         type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/inventory-items',
  authenticate,
  async (req, res) => {
    try {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          isActive: true,
          isDeleted: false,
        },
        select: {
          id: true,
          itemCode: true,
          name: true,
          category: true,
          unit: true,
          standardCost: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: inventoryItems,
      });
    } catch (error) {
      logger.error('Error getting inventory items:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INVENTORY_ITEMS_FETCH_FAILED',
          message: 'Failed to fetch inventory items',
        },
      });
    }
  }
);

/**
 * @swagger
 * /manufacturing/branches:
 *   get:
 *     summary: Get all active branches
 *     description: Retrieve all active branches for manufacturing operations
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active branches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/branches',
  authenticate,
  async (req, res) => {
    try {
      const branches = await prisma.branch.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          city: true,
          state: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.json({
        success: true,
        data: branches,
      });
    } catch (error) {
      logger.error('Error getting branches:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BRANCHES_FETCH_FAILED',
          message: 'Failed to fetch branches',
        },
      });
    }
  }
);

/**
 * @swagger
 * /manufacturing/boms:
 *   get:
 *     summary: Get all BOMs
 *     description: Retrieve all Bills of Materials with basic information
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, APPROVED, OBSOLETE]
 *         description: Filter by BOM status (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in revision, ECN, product name/code
 *     responses:
 *       200:
 *         description: List of BOMs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BOM'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/boms',
  authenticate,
  async (req, res) => {
    try {
      const { status, page = 1, limit = 50, search } = req.query;
      
      const whereClause: any = {
        isActive: true,
        isDeleted: false,
      };
      
      // Only filter by status if provided
      if (status && status !== '') {
        whereClause.status = status as string;
      }
      
      // Add search functionality
      if (search && search !== '') {
        whereClause.OR = [
          {
            revision: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            engineeringChangeNumber: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            product: {
              OR: [
                {
                  name: {
                    contains: search as string,
                    mode: 'insensitive',
                  },
                },
                {
                  code: {
                    contains: search as string,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        ];
      }
      
      const skip = (Number(page) - 1) * Number(limit);
      
      const [boms, total] = await Promise.all([
        prisma.bOM.findMany({
          where: whereClause,
          select: {
            id: true,
            productId: true,
            revision: true,
            status: true,
            effectiveDate: true,
            engineeringChangeNumber: true,
            approvedBy: true,
            approvedAt: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
            createdBy: true,
            updatedBy: true,
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc', // Show newest BOMs first
          },
          skip,
          take: Number(limit),
        }),
        prisma.bOM.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: boms,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error getting BOMs:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BOMS_FETCH_FAILED',
          message: 'Failed to fetch BOMs',
        },
      });
    }
  }
);

/**
 * @swagger
 * /manufacturing/bom/{id}:
 *   get:
 *     summary: Get BOM by ID
 *     description: Get BOM with hierarchical structure and all items
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: BOM ID
 *     responses:
 *       200:
 *         description: BOM details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BOM'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/bom/{id}/approve:
 *   post:
 *     summary: Approve BOM
 *     description: Approve a BOM and make it active for production use
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: BOM ID to approve
 *     responses:
 *       200:
 *         description: BOM approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BOM'
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @swagger
 * /manufacturing/bom/{id}/cost:
 *   get:
 *     summary: Calculate BOM cost
 *     description: Calculate BOM cost rollup with material and labor costs
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: BOM ID
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Quantity for cost calculation
 *     responses:
 *       200:
 *         description: BOM cost analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMaterialCost:
 *                       type: number
 *                     totalLaborCost:
 *                       type: number
 *                     totalOverheadCost:
 *                       type: number
 *                     totalCost:
 *                       type: number
 *                     costBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 * @swagger
 * /manufacturing/work-centers:
 *   post:
 *     summary: Create work center
 *     description: Create work center for capacity management and scheduling
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, type, capacity]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CUTTING, CNC, BENDING, WELDING, COATING, ASSEMBLY]
 *               capacity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Work center created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WorkCenter'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/operations:
 *   post:
 *     summary: Create operation
 *     description: Create a new operation for work center routing
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, workCenterId, setupTime, runTime, sequence]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Operation code
 *               name:
 *                 type: string
 *                 description: Operation name
 *               workCenterId:
 *                 type: string
 *                 format: uuid
 *                 description: Associated work center ID
 *               setupTime:
 *                 type: number
 *                 description: Setup time in minutes
 *               runTime:
 *                 type: number
 *                 description: Run time per unit in minutes
 *               sequence:
 *                 type: integer
 *                 description: Operation sequence number
 *     responses:
 *       201:
 *         description: Operation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/capacity-routing:
 *   post:
 *     summary: Calculate capacity routing
 *     description: Calculate capacity-based routing for operations with constraint validation
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bomItems, quantity]
 *             properties:
 *               bomItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     inventoryItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     operation:
 *                       type: string
 *               quantity:
 *                 type: number
 *                 description: Production quantity
 *               bufferDays:
 *                 type: number
 *                 description: Buffer days for scheduling
 *     responses:
 *       200:
 *         description: Capacity routing calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       operationId:
 *                         type: string
 *                       workCenterId:
 *                         type: string
 *                       scheduledStart:
 *                         type: string
 *                         format: date-time
 *                       scheduledEnd:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/machine-schedule:
 *   get:
 *     summary: Get machine schedule
 *     description: Get machine schedule for Gantt chart visualization
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Schedule start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Schedule end date
 *       - in: query
 *         name: workCenterIds
 *         schema:
 *           type: string
 *         description: Comma-separated work center IDs to filter
 *     responses:
 *       200:
 *         description: Machine schedule data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       workCenterId:
 *                         type: string
 *                       workCenterName:
 *                         type: string
 *                       schedules:
 *                         type: array
 *                         items:
 *                           type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /manufacturing/material-consumption:
 *   post:
 *     summary: Record material consumption
 *     description: Record material consumption with variance analysis for production orders
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productionOrderId, inventoryItemId, plannedQuantity, actualQuantity, variance]
 *             properties:
 *               productionOrderId:
 *                 type: string
 *                 format: uuid
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               plannedQuantity:
 *                 type: number
 *               actualQuantity:
 *                 type: number
 *               variance:
 *                 type: number
 *     responses:
 *       200:
 *         description: Material consumption recorded successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/scrap-tracking:
 *   post:
 *     summary: Record scrap
 *     description: Record scrap by operation with costing integration
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productionOrderId, inventoryItemId, quantity, reason]
 *             properties:
 *               productionOrderId:
 *                 type: string
 *                 format: uuid
 *               operationId:
 *                 type: string
 *                 format: uuid
 *               inventoryItemId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: number
 *               reason:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       200:
 *         description: Scrap recorded successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/work-centers:
 *   get:
 *     summary: Get all work centers
 *     description: Get all work centers with current utilization data
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of work centers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WorkCenter'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/utilization:
 *   get:
 *     summary: Get work center utilization
 *     description: Get work center utilization report for capacity planning
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *       - in: query
 *         name: workCenterId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific work center
 *     responses:
 *       200:
 *         description: Work center utilization data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     utilizationPercentage:
 *                       type: number
 *                     totalCapacity:
 *                       type: number
 *                     usedCapacity:
 *                       type: number
 *                     availableCapacity:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /manufacturing/gantt-chart:
 *   get:
 *     summary: Get Gantt chart data
 *     description: Get enhanced Gantt chart data for production visualization
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *     responses:
 *       200:
 *         description: Gantt chart data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/calendar-view:
 *   get:
 *     summary: Get calendar view data
 *     description: Get calendar view data for production scheduling
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *     responses:
 *       200:
 *         description: Calendar view data
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/engineering-change:
 *   post:
 *     summary: Create engineering change request
 *     description: Create engineering change request with approval workflow
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bomId, changeNumber, changeReason, effectiveDate]
 *             properties:
 *               bomId:
 *                 type: string
 *                 format: uuid
 *                 description: BOM ID to change
 *               changeNumber:
 *                 type: string
 *                 description: Engineering change number
 *               changeReason:
 *                 type: string
 *                 description: Reason for the change
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the change becomes effective
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *               description:
 *                 type: string
 *                 description: Detailed description of the change
 *               impactAnalysis:
 *                 type: string
 *                 description: Impact analysis of the change
 *               approvalRequired:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Engineering change request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     changeRequestId:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/delivery-date-calculation:
 *   post:
 *     summary: Calculate delivery date
 *     description: Calculate enhanced delivery date with buffer days and lead time management
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bomId, quantity]
 *             properties:
 *               bomId:
 *                 type: string
 *                 format: uuid
 *                 description: BOM ID for the product
 *               quantity:
 *                 type: number
 *                 description: Production quantity
 *               requestedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Customer requested delivery date
 *               customBufferDays:
 *                 type: number
 *                 description: Custom buffer days to add
 *     responses:
 *       200:
 *         description: Delivery date calculation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     estimatedDeliveryDate:
 *                       type: string
 *                       format: date-time
 *                     productionStartDate:
 *                       type: string
 *                       format: date-time
 *                     totalLeadTime:
 *                       type: number
 *                     bufferDays:
 *                       type: number
 *                     canMeetRequestedDate:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
 * @swagger
 * /manufacturing/production-orders/{id}/reschedule:
 *   put:
 *     summary: Reschedule production order
 *     description: Reschedule production order with updated capacity routing
 *     tags: [Manufacturing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Production order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: New scheduled start date
 *               bufferDays:
 *                 type: number
 *                 description: Buffer days for scheduling
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Production priority
 *     responses:
 *       200:
 *         description: Production order rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     newScheduledStart:
 *                       type: string
 *                       format: date-time
 *                     newScheduledEnd:
 *                       type: string
 *                       format: date-time
 *                     capacityRouting:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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