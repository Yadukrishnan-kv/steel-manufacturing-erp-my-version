// Sales Routes - API endpoints for sales management
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { SalesService } from '../services/sales.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const salesService = new SalesService(prisma);

// Validation schemas
const createLeadSchema = z.object({
  source: z.enum(['META', 'GOOGLE', 'REFERRAL', 'DIRECT']),
  sourceRef: z.string().optional(),
  contactName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  requirements: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const updateLeadSchema = z.object({
  source: z.enum(['META', 'GOOGLE', 'REFERRAL', 'DIRECT']).optional(),
  sourceRef: z.string().optional(),
  contactName: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  requirements: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const siteMeasurementSchema = z.object({
  leadId: z.string().uuid(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }),
  photos: z.array(z.string().url()),
  measurements: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive().optional(),
    area: z.number().positive(),
    unit: z.string(),
    specifications: z.record(z.any()).optional(),
  }),
  notes: z.string().optional(),
  measuredBy: z.string().optional(),
});

const estimationSchema = z.object({
  leadId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    specifications: z.object({
      size: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
        depth: z.number().positive().optional(),
        unit: z.string(),
      }),
      coatingType: z.string(),
      coatingColor: z.string().optional(),
      hardware: z.object({
        lockType: z.string(),
        hingeType: z.string(),
        handleType: z.string(),
        securityFeatures: z.array(z.string()).optional(),
        accessories: z.array(z.string()).optional(),
      }),
      glassType: z.string().optional(),
      frameType: z.string().optional(),
      customFeatures: z.array(z.string()).optional(),
    }),
  })),
  discountPercentage: z.number().min(0).max(50).optional(),
  validityDays: z.number().positive().optional(),
});

const discountApprovalSchema = z.object({
  estimateId: z.string().uuid(),
  discountPercentage: z.number().min(0).max(50),
  discountAmount: z.number().positive(),
  reason: z.string().min(1),
});

const salesOrderSchema = z.object({
  customerId: z.string().uuid(),
  estimateId: z.string().uuid().optional(),
  deliveryDate: z.string().datetime(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    specifications: z.object({
      size: z.object({
        width: z.number().positive(),
        height: z.number().positive(),
        depth: z.number().positive().optional(),
        unit: z.string(),
      }),
      coatingType: z.string(),
      coatingColor: z.string().optional(),
      hardware: z.object({
        lockType: z.string(),
        hingeType: z.string(),
        handleType: z.string(),
        securityFeatures: z.array(z.string()).optional(),
        accessories: z.array(z.string()).optional(),
      }),
      glassType: z.string().optional(),
      frameType: z.string().optional(),
      customFeatures: z.array(z.string()).optional(),
    }).optional(),
  })),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  branchId: z.string().uuid(),
});

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6),
  gstNumber: z.string().optional(),
  branchId: z.string().uuid(),
});

// Lead Management Routes

/**
 * PUT /api/sales/leads/bulk-assign
 * Bulk assign leads to sales representative
 */
router.put('/leads/bulk-assign',
  authenticate,
  async (req, res) => {
    try {
      const { leadIds, assignedTo } = req.body;

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0 || !assignedTo) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'leadIds array and assignedTo are required',
          },
        });
      }

      const updatedCount = await salesService.bulkAssignLeads(
        leadIds,
        assignedTo,
        req.user?.id || 'system'
      );

      res.json({
        success: true,
        data: {
          updatedCount,
          assignedTo,
        },
        message: `${updatedCount} leads assigned successfully`,
      });
    } catch (error) {
      logger.error('Error in bulk lead assignment:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'BULK_ASSIGNMENT_FAILED',
          message: 'Failed to assign leads',
        },
      });
    }
  }
);

/**
 * DELETE /api/sales/leads/bulkDelete
 * Bulk delete leads
 */
router.delete('/leads/bulkDelete',
  authenticate,
  async (req, res) => {
    try {
      const { leadIds } = req.body;

      if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'leadIds array is required',
          },
        });
      }

      const deletedCount = await salesService.bulkDeleteLeads(leadIds);

      res.json({
        success: true,
        data: { deletedCount },
        message: `${deletedCount} leads deleted successfully`,
      });
    } catch (error) {
      logger.error('Error bulk deleting leads:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BULK_DELETE_FAILED',
          message: 'Failed to delete leads',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads:
 *   post:
 *     summary: Create a new lead
 *     description: Create lead from external sources with source tracking
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLead'
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/leads',
  authenticate,
  validate({ body: createLeadSchema }),
  async (req, res) => {
    try {
      const lead = await salesService.createLead(req.body);

      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead created successfully',
      });
    } catch (error) {
      logger.error('Error creating lead:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'LEAD_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create lead',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads/{id}:
 *   get:
 *     summary: Get lead by ID
 *     description: Get lead with measurements and estimates
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Lead details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lead'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID is required',
          },
        });
        return;
      }

      const lead = await salesService.getLeadWithDetails(id);

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      logger.error('Error getting lead:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'LEAD_NOT_FOUND',
          message: 'Lead not found',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads/{id}:
 *   put:
 *     summary: Update lead
 *     description: Update lead information
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLead'
 *     responses:
 *       200:
 *         description: Lead updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/leads/:id',
  authenticate,
  validate({ body: updateLeadSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID is required',
          },
        });
        return;
      }

      const lead = await salesService.updateLead(id, req.body, req.user?.id || 'system');

      res.json({
        success: true,
        data: lead,
        message: 'Lead updated successfully',
      });
    } catch (error) {
      logger.error('Error updating lead:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'LEAD_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update lead',
        },
      });
    }
  }
);

router.delete('/leads/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID is required',
          },
        });
        return;
      }

      await salesService.deleteLead(id);

      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting lead:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'LEAD_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete lead',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/measurements:
 *   post:
 *     summary: Capture site measurements
 *     description: Capture geo-tagged site measurements with photos for lead qualification
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, location, photos, measurements]
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *                   address:
 *                     type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               measurements:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                   height:
 *                     type: number
 *                   depth:
 *                     type: number
 *                   area:
 *                     type: number
 *                   unit:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Site measurement captured successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/measurements',
  authenticate,
  validate({ body: siteMeasurementSchema }),
  async (req, res) => {
    try {
      const measurement = await salesService.captureSiteMeasurement(req.body);

      res.status(201).json({
        success: true,
        data: measurement,
        message: 'Site measurement captured successfully',
      });
    } catch (error) {
      logger.error('Error capturing site measurement:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MEASUREMENT_CAPTURE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to capture site measurement',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/estimates:
 *   post:
 *     summary: Generate pricing estimate
 *     description: Generate comprehensive pricing estimation with material and labor costs
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [leadId, items]
 *             properties:
 *               leadId:
 *                 type: string
 *                 format: uuid
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     specifications:
 *                       type: object
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50
 *               validityDays:
 *                 type: number
 *     responses:
 *       201:
 *         description: Estimation generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Estimate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/estimates',
  authenticate,
  validate({ body: estimationSchema }),
  async (req, res) => {
    try {
      const estimation = await salesService.generateEstimation(req.body);

      res.status(201).json({
        success: true,
        data: estimation,
        message: 'Estimation generated successfully',
      });
    } catch (error) {
      logger.error('Error generating estimation:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'ESTIMATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate estimation',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/discount-approval:
 *   post:
 *     summary: Request discount approval
 *     description: Process discount approval through hierarchy routing based on discount percentage
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estimateId, discountPercentage, discountAmount, reason]
 *             properties:
 *               estimateId:
 *                 type: string
 *                 format: uuid
 *               discountPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 50
 *               discountAmount:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Discount approval request submitted successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/discount-approval',
  authenticate,
  validate({ body: discountApprovalSchema }),
  async (req, res) => {
    try {
      const approval = await salesService.processDiscountApproval({
        ...req.body,
        requestedBy: req.user?.id || 'system',
      });

      res.status(201).json({
        success: true,
        data: approval,
        message: 'Discount approval request submitted successfully',
      });
    } catch (error) {
      logger.error('Error processing discount approval:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'DISCOUNT_APPROVAL_FAILED',
          message: error instanceof Error ? error.message : 'Failed to process discount approval',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/orders:
 *   post:
 *     summary: Create sales order
 *     description: Create sales order with material validation and automatic production order conversion
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, deliveryDate, items, branchId]
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               estimateId:
 *                 type: string
 *                 format: uuid
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *               discountAmount:
 *                 type: number
 *               taxAmount:
 *                 type: number
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Sales order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SalesOrder'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/orders',
  authenticate,
  validate({ body: salesOrderSchema }),
  async (req, res) => {
    try {
      const salesOrder = await salesService.createSalesOrder({
        ...req.body,
        deliveryDate: new Date(req.body.deliveryDate),
      });

      res.status(201).json({
        success: true,
        data: salesOrder,
        message: 'Sales order created successfully',
      });
    } catch (error) {
      logger.error('Error creating sales order:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SALES_ORDER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create sales order',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/orders/{id}:
 *   get:
 *     summary: Get sales order by ID
 *     description: Get sales order with complete details including items and production orders
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sales order ID
 *     responses:
 *       200:
 *         description: Sales order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SalesOrder'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/orders/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Sales order ID is required',
          },
        });
        return;
      }

      const salesOrder = await salesService.getSalesOrderWithDetails(id);

      res.json({
        success: true,
        data: salesOrder,
      });
    } catch (error) {
      logger.error('Error getting sales order:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'SALES_ORDER_NOT_FOUND',
          message: 'Sales order not found',
        },
      });
    }
  }
);

// Customer Management Routes

/**
 * @swagger
 * /sales/customers:
 *   post:
 *     summary: Create customer
 *     description: Create customer master data with contact and billing information
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, address, city, state, pincode, branchId]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Customer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/customers',
  authenticate,
  validate({ body: customerSchema }),
  async (req, res) => {
    try {
      const customer = await salesService.createCustomer(req.body);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      logger.error('Error creating customer:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CUSTOMER_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create customer',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/customers:
 *   get:
 *     summary: Get all customers
 *     description: Get all customers with pagination and search
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, email, or code
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *     responses:
 *       200:
 *         description: List of customers
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
 *                     customers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Customer'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/customers',
  authenticate,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, branchId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        isDeleted: false,
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (branchId) {
        whereClause.branchId = branchId as string;
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customer.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting customers:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMERS_FETCH_FAILED',
          message: 'Failed to fetch customers',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Get customer details with recent orders and leads
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/customers/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Customer ID is required',
          },
        });
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          salesOrders: {
            select: {
              id: true,
              orderNumber: true,
              orderDate: true,
              finalAmount: true,
              status: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          leads: {
            select: {
              id: true,
              leadNumber: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!customer) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.error('Error getting customer:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOMER_FETCH_FAILED',
          message: 'Failed to fetch customer',
        },
      });
    }
  }
);

// Analytics and Reporting Routes

/**
 * @swagger
 * /sales/analytics:
 *   get:
 *     summary: Get sales analytics
 *     description: Get sales analytics and reporting data with date range filtering
 *     tags: [Sales]
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
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Sales analytics data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/analytics',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;

      const analytics = await salesService.getSalesAnalytics(
        branchId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting sales analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_FETCH_FAILED',
          message: 'Failed to fetch sales analytics',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads:
 *   get:
 *     summary: Get all leads
 *     description: Get all leads with filtering and pagination
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST]
 *         description: Filter by status
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [META, GOOGLE, REFERRAL, DIRECT]
 *         description: Filter by source
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned user
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, phone, email, or lead number
 *     responses:
 *       200:
 *         description: List of leads
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
 *                     leads:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Lead'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads',
  authenticate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        source, 
        assignedTo, 
        priority,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (status) {
        whereClause.status = status as string;
      }

      if (source) {
        whereClause.source = source as string;
      }

      if (assignedTo) {
        whereClause.assignedTo = assignedTo as string;
      }

      if (priority) {
        whereClause.priority = priority as string;
      }

      if (search) {
        whereClause.OR = [
          { contactName: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { leadNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                name: true,
              },
            },
            estimates: {
              select: {
                id: true,
                estimateNumber: true,
                finalAmount: true,
                status: true,
              },
            },
          },
        }),
        prisma.lead.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          leads,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting leads:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LEADS_FETCH_FAILED',
          message: 'Failed to fetch leads',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/estimates:
 *   get:
 *     summary: Get all estimates
 *     description: Get all estimates with filtering and pagination
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SENT, APPROVED, REJECTED, EXPIRED]
 *         description: Filter by status
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *         description: Filter by approval status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by estimate number
 *     responses:
 *       200:
 *         description: List of estimates
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
 *                     estimates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Estimate'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/estimates',
  authenticate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        approvalStatus,
        customerId,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (status) {
        whereClause.status = status as string;
      }

      if (approvalStatus) {
        whereClause.approvalStatus = approvalStatus as string;
      }

      if (customerId) {
        whereClause.customerId = customerId as string;
      }

      if (search) {
        whereClause.OR = [
          { estimateNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [estimates, total] = await Promise.all([
        prisma.estimate.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            lead: {
              select: {
                leadNumber: true,
                contactName: true,
              },
            },
            customer: {
              select: {
                name: true,
              },
            },
            items: true,
          },
        }),
        prisma.estimate.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          estimates,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting estimates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ESTIMATES_FETCH_FAILED',
          message: 'Failed to fetch estimates',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/orders:
 *   get:
 *     summary: Get all sales orders
 *     description: Get all sales orders with filtering and pagination
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, IN_PRODUCTION, READY, DELIVERED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by order number
 *     responses:
 *       200:
 *         description: List of sales orders
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SalesOrder'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/orders',
  authenticate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        customerId,
        branchId,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        isDeleted: false,
      };

      if (status) {
        whereClause.status = status as string;
      }

      if (customerId) {
        whereClause.customerId = customerId as string;
      }

      if (branchId) {
        whereClause.branchId = branchId as string;
      }

      if (search) {
        whereClause.OR = [
          { orderNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.salesOrder.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
            items: {
              select: {
                description: true,
                quantity: true,
                totalPrice: true,
              },
            },
            productionOrders: {
              select: {
                orderNumber: true,
                status: true,
                scheduledEndDate: true,
              },
            },
          },
        }),
        prisma.salesOrder.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting sales orders:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ORDERS_FETCH_FAILED',
          message: 'Failed to fetch sales orders',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads/{id}/status:
 *   put:
 *     summary: Update lead status
 *     description: Update lead status with optional follow-up date
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lead ID
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
 *                 enum: [NEW, CONTACTED, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST]
 *               followUpDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Lead status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/leads/:id/status',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, followUpDate } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID is required',
          },
        });
        return;
      }

      const updateData: any = { status };
      if (followUpDate) {
        updateData.followUpDate = new Date(followUpDate);
      }

      const lead = await prisma.lead.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: lead,
        message: 'Lead status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating lead status:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'LEAD_UPDATE_FAILED',
          message: 'Failed to update lead status',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/estimates/{id}/approve:
 *   put:
 *     summary: Approve estimate
 *     description: Approve estimate with workflow validation based on approval level
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Estimate ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalLevel:
 *                 type: integer
 *                 default: 1
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estimate approved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/estimates/:id/approve',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approvalLevel = 1, notes } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Estimate ID is required',
          },
        });
        return;
      }

      const estimate = await salesService.approveEstimate(
        id,
        req.user?.id || 'system',
        approvalLevel,
        notes
      );

      res.json({
        success: true,
        data: estimate,
        message: 'Estimate approved successfully',
      });
    } catch (error) {
      logger.error('Error approving estimate:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'ESTIMATE_APPROVAL_FAILED',
          message: error instanceof Error ? error.message : 'Failed to approve estimate',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/pipeline-analytics:
 *   get:
 *     summary: Get pipeline analytics
 *     description: Get sales pipeline analytics and conversion metrics
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by branch
 *     responses:
 *       200:
 *         description: Pipeline analytics data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/pipeline-analytics',
  authenticate,
  async (req, res) => {
    try {
      const { branchId } = req.query;

      const analytics = await salesService.getSalesPipelineAnalytics(branchId as string);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting pipeline analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PIPELINE_ANALYTICS_FAILED',
          message: 'Failed to fetch pipeline analytics',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads/{id}/assignment-recommendations:
 *   get:
 *     summary: Get lead assignment recommendations
 *     description: Get AI-powered lead assignment recommendations based on workload and expertise
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lead ID
 *     responses:
 *       200:
 *         description: Assignment recommendations
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/leads/:id/assignment-recommendations',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID is required',
          },
        });
        return;
      }

      const recommendations = await salesService.getLeadAssignmentRecommendations(id);

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error('Error getting assignment recommendations:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ASSIGNMENT_RECOMMENDATIONS_FAILED',
          message: 'Failed to get assignment recommendations',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/leads/{id}/assign:
 *   put:
 *     summary: Assign lead
 *     description: Assign lead to sales representative
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lead ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignedTo]
 *             properties:
 *               assignedTo:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lead assigned successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/leads/:id/assign',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { assignedTo, notes } = req.body;

      if (!id || !assignedTo) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Lead ID and assignedTo are required',
          },
        });
        return;
      }

      const lead = await prisma.lead.update({
        where: { id },
        data: {
          assignedTo,
          updatedBy: req.user?.id || 'system',
          updatedAt: new Date(),
        },
      });

      // Log assignment
      logger.info('Lead assigned', {
        leadId: id,
        assignedTo,
        assignedBy: req.user?.id,
        notes,
      });

      res.json({
        success: true,
        data: lead,
        message: 'Lead assigned successfully',
      });
    } catch (error) {
      logger.error('Error assigning lead:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'LEAD_ASSIGNMENT_FAILED',
          message: 'Failed to assign lead',
        },
      });
    }
  }
);

/**
 * @swagger
 * /sales/dashboard:
 *   get:
 *     summary: Get sales dashboard
 *     description: Get comprehensive sales dashboard data with KPIs and metrics
 *     tags: [Sales]
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [TODAY, WEEK, MONTH, QUARTER]
 *           default: MONTH
 *         description: Time period for dashboard data
 *     responses:
 *       200:
 *         description: Sales dashboard data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, period = 'MONTH' } = req.query;

      const dashboard = await salesService.getSalesDashboard(
        branchId as string,
        period as 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER'
      );

      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      logger.error('Error getting sales dashboard:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_FETCH_FAILED',
          message: 'Failed to fetch sales dashboard',
        },
      });
    }
  }
);

/**
 * GET /api/sales/follow-up-tasks
 * Get follow-up tasks for sales team
 */
router.get('/follow-up-tasks',
  authenticate,
  async (req, res) => {
    try {
      const { assignedTo, priority } = req.query;

      const tasks = await salesService.getFollowUpTasks(
        assignedTo as string,
        priority as string
      );

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      logger.error('Error getting follow-up tasks:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FOLLOW_UP_TASKS_FAILED',
          message: 'Failed to fetch follow-up tasks',
        },
      });
    }
  }
);

/**
 * GET /api/sales/estimates/:id/details
 * Get detailed estimate with cost breakdown
 */
router.get('/estimates/:id/details',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Estimate ID is required',
          },
        });
        return;
      }

      const estimate = await prisma.estimate.findUnique({
        where: { id },
        include: {
          lead: {
            select: {
              leadNumber: true,
              contactName: true,
              phone: true,
              email: true,
              address: true,
              requirements: true,
            },
          },
          customer: {
            select: {
              name: true,
              phone: true,
              email: true,
              address: true,
              gstNumber: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  code: true,
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!estimate) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ESTIMATE_NOT_FOUND',
            message: 'Estimate not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: estimate,
      });
    } catch (error) {
      logger.error('Error getting estimate details:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ESTIMATE_DETAILS_FAILED',
          message: 'Failed to fetch estimate details',
        },
      });
    }
  }
);

export { router as salesRoutes };