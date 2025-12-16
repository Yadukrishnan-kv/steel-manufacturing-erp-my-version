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
 * POST /api/sales/leads
 * Create lead from external sources with source tracking
 * Validates: Requirements 4.1 - External lead source attribution
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
 * GET /api/sales/leads/:id
 * Get lead with measurements and estimates
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
 * POST /api/sales/measurements
 * Capture geo-tagged site measurements with photos
 * Validates: Requirements 4.2 - Geo-tagged measurement documentation
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
 * POST /api/sales/estimates
 * Generate comprehensive pricing estimation
 * Validates: Requirements 4.3 - Comprehensive pricing calculation
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
 * POST /api/sales/discount-approval
 * Process discount approval through hierarchy routing
 * Validates: Requirements 4.4 - Discount approval workflow routing
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
 * POST /api/sales/orders
 * Create sales order with material validation and production conversion
 * Validates: Requirements 4.5 - Sales order conversion validation
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
 * GET /api/sales/orders/:id
 * Get sales order with complete details
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
 * POST /api/sales/customers
 * Create customer master data
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
 * GET /api/sales/customers
 * Get all customers with pagination
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
 * GET /api/sales/customers/:id
 * Get customer details
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
 * GET /api/sales/analytics
 * Get sales analytics and reporting data
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
 * GET /api/sales/leads
 * Get all leads with filtering and pagination
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
 * GET /api/sales/estimates
 * Get all estimates with filtering and pagination
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
 * GET /api/sales/orders
 * Get all sales orders with filtering and pagination
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
 * PUT /api/sales/leads/:id/status
 * Update lead status
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
 * PUT /api/sales/estimates/:id/approve
 * Approve estimate
 */
router.put('/estimates/:id/approve',
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

      const estimate = await prisma.estimate.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvalStatus: 'APPROVED',
          approvedBy: req.user?.id || 'system',
          approvedAt: new Date(),
        },
      });

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
          message: 'Failed to approve estimate',
        },
      });
    }
  }
);

export { router as salesRoutes };