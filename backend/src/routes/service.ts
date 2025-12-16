// Service Routes - API endpoints for service management
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { ServiceService } from '../services/service.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const serviceService = new ServiceService(prisma);

// Validation schemas
const createServiceRequestSchema = z.object({
  customerId: z.string().uuid(),
  salesOrderId: z.string().uuid().optional(),
  type: z.enum(['INSTALLATION', 'MAINTENANCE', 'REPAIR', 'WARRANTY_CLAIM']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().min(1),
  scheduledDate: z.string().datetime().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  warrantyInfo: z.object({
    warrantyNumber: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    coverageType: z.string(),
    terms: z.string().optional(),
  }).optional(),
});

const technicianAssignmentSchema = z.object({
  serviceRequestId: z.string().uuid(),
  technicianId: z.string().uuid().optional(),
  autoAssign: z.boolean().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  expertise: z.array(z.string()).optional(),
});

const amcContractSchema = z.object({
  customerId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  amount: z.number().positive(),
  terms: z.string().optional(),
  coverageDetails: z.object({
    maintenanceFrequency: z.string(),
    includedServices: z.array(z.string()),
    excludedServices: z.array(z.string()).optional(),
    responseTime: z.number().positive(),
    partsIncluded: z.boolean(),
    laborIncluded: z.boolean(),
  }),
});

const scheduleInstallationSchema = z.object({
  salesOrderId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }),
  technicianId: z.string().uuid().optional(),
});

const rmaRequestSchema = z.object({
  customerId: z.string().uuid(),
  salesOrderId: z.string().uuid().optional(),
  productDescription: z.string().min(1),
  defectDescription: z.string().min(1),
  warrantyNumber: z.string().optional(),
  requestedAction: z.enum(['REPAIR', 'REPLACE', 'REFUND']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  photos: z.array(z.string().url()).optional(),
});

const serviceCompletionSchema = z.object({
  serviceRequestId: z.string().uuid(),
  completionDate: z.string().datetime(),
  partsConsumed: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitCost: z.number().positive(),
  })),
  laborHours: z.number().positive(),
  completionNotes: z.string().optional(),
  customerSignature: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),
  customerRating: z.number().min(1).max(5).optional(),
  customerFeedback: z.string().optional(),
});

const serviceInvoiceSchema = z.object({
  serviceRequestId: z.string().uuid(),
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  additionalCharges: z.array(z.object({
    description: z.string().min(1),
    amount: z.number().positive(),
    taxable: z.boolean(),
  })).optional(),
  notes: z.string().optional(),
});

const mobileUpdateSchema = z.object({
  status: z.string().optional(),
  completionDate: z.string().datetime().optional(),
  partsConsumed: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    quantity: z.number().positive(),
    unitCost: z.number().positive(),
  })).optional(),
  laborHours: z.number().positive().optional(),
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string().url()).optional(),
  customerRating: z.number().min(1).max(5).optional(),
  customerFeedback: z.string().optional(),
  geoLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
});

// Service Request Management Routes

/**
 * @swagger
 * /service/requests:
 *   post:
 *     summary: Create service request
 *     description: Create service request with automatic technician assignment
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, type, description]
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [INSTALLATION, MAINTENANCE, REPAIR, WARRANTY_CLAIM]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *     responses:
 *       201:
 *         description: Service request created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/requests',
  authenticate,
  validate({ body: createServiceRequestSchema }),
  async (req, res) => {
    try {
      const serviceRequest = await serviceService.createServiceRequest({
        ...req.body,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
        warrantyInfo: req.body.warrantyInfo ? {
          ...req.body.warrantyInfo,
          startDate: new Date(req.body.warrantyInfo.startDate),
          endDate: new Date(req.body.warrantyInfo.endDate),
        } : undefined,
      });

      res.status(201).json({
        success: true,
        data: serviceRequest,
        message: 'Service request created successfully',
      });
    } catch (error) {
      logger.error('Error creating service request:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SERVICE_REQUEST_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create service request',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/requests/{id}:
 *   get:
 *     summary: Get service request details
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service request details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/requests/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Service request ID is required',
          },
        });
        return;
      }

      const serviceRequest = await serviceService.getServiceRequestWithDetails(id);

      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      logger.error('Error getting service request:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'SERVICE_REQUEST_NOT_FOUND',
          message: 'Service request not found',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/requests:
 *   get:
 *     summary: Get service requests list
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Service requests list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/requests',
  authenticate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        type, 
        assignedTo, 
        priority,
        customerId,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (status) {
        whereClause.status = status as string;
      }

      if (type) {
        whereClause.type = type as string;
      }

      if (assignedTo) {
        whereClause.assignedTo = assignedTo as string;
      }

      if (priority) {
        whereClause.priority = priority as string;
      }

      if (customerId) {
        whereClause.customerId = customerId as string;
      }

      if (search) {
        whereClause.OR = [
          { serviceNumber: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [serviceRequests, total] = await Promise.all([
        prisma.serviceRequest.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
                address: true,
              },
            },
            salesOrder: {
              select: {
                orderNumber: true,
              },
            },
          },
        }),
        prisma.serviceRequest.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          serviceRequests,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting service requests:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_REQUESTS_FETCH_FAILED',
          message: 'Failed to fetch service requests',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/assign-technician:
 *   post:
 *     summary: Assign technician to service request
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceRequestId
 *               - technicianId
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *                 format: uuid
 *               technicianId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Technician assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/assign-technician',
  authenticate,
  validate({ body: technicianAssignmentSchema }),
  async (req, res) => {
    try {
      const assignment = await serviceService.assignTechnician(req.body);

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Technician assigned successfully',
      });
    } catch (error) {
      logger.error('Error assigning technician:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'TECHNICIAN_ASSIGNMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to assign technician',
        },
      });
    }
  }
);

// AMC Contract Management Routes

/**
 * @swagger
 * /service/amc-contracts:
 *   post:
 *     summary: Create AMC contract
 *     description: Create AMC contract with tracking and renewal alerts
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, startDate, endDate, amount, coverageDetails]
 *             properties:
 *               customerId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               terms:
 *                 type: string
 *               coverageDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: AMC contract created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/amc-contracts',
  authenticate,
  validate({ body: amcContractSchema }),
  async (req, res) => {
    try {
      const contract = await serviceService.createAMCContract({
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      });

      res.status(201).json({
        success: true,
        data: contract,
        message: 'AMC contract created successfully',
      });
    } catch (error) {
      logger.error('Error creating AMC contract:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'AMC_CONTRACT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create AMC contract',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/amc-contracts/{id}:
 *   get:
 *     summary: Get AMC contract details
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: AMC contract details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/amc-contracts/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'AMC contract ID is required',
          },
        });
        return;
      }

      const contract = await serviceService.getAMCContractWithDetails(id);

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      logger.error('Error getting AMC contract:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'AMC_CONTRACT_NOT_FOUND',
          message: 'AMC contract not found',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/amc-contracts:
 *   get:
 *     summary: Get AMC contracts list
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: AMC contracts list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/amc-contracts',
  authenticate,
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        customerId,
        search 
      } = req.query;
      
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (status) {
        whereClause.status = status as string;
      }

      if (customerId) {
        whereClause.customerId = customerId as string;
      }

      if (search) {
        whereClause.OR = [
          { contractNumber: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [contracts, total] = await Promise.all([
        prisma.aMCContract.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                name: true,
                phone: true,
                address: true,
              },
            },
          },
        }),
        prisma.aMCContract.count({ where: whereClause }),
      ]);

      res.json({
        success: true,
        data: {
          contracts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting AMC contracts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AMC_CONTRACTS_FETCH_FAILED',
          message: 'Failed to fetch AMC contracts',
        },
      });
    }
  }
);

// Warranty Management Routes

/**
 * @swagger
 * /service/warranty/{warrantyNumber}:
 *   get:
 *     summary: Validate warranty
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warrantyNumber
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warranty details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/warranty/:warrantyNumber',
  authenticate,
  async (req, res) => {
    try {
      const { warrantyNumber } = req.params;
      const { productId } = req.query;

      if (!warrantyNumber) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Warranty number is required',
          },
        });
        return;
      }

      const warranty = await serviceService.validateWarranty(
        warrantyNumber,
        productId as string
      );

      if (warranty) {
        res.json({
          success: true,
          data: warranty,
          message: 'Warranty is valid',
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'WARRANTY_NOT_FOUND_OR_EXPIRED',
            message: 'Warranty not found or has expired',
          },
        });
      }
    } catch (error) {
      logger.error('Error validating warranty:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WARRANTY_VALIDATION_FAILED',
          message: 'Failed to validate warranty',
        },
      });
    }
  }
);

// Installation Management Routes

/**
 * @swagger
 * /service/schedule-installation:
 *   post:
 *     summary: Schedule installation
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - salesOrderId
 *               - scheduledDate
 *               - location
 *             properties:
 *               salesOrderId:
 *                 type: string
 *                 format: uuid
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *               technicianId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Installation scheduled
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/schedule-installation',
  authenticate,
  validate({ body: scheduleInstallationSchema }),
  async (req, res) => {
    try {
      const installation = await serviceService.scheduleInstallation(
        req.body.salesOrderId,
        new Date(req.body.scheduledDate),
        req.body.location,
        req.body.technicianId
      );

      res.status(201).json({
        success: true,
        data: installation,
        message: 'Installation scheduled successfully',
      });
    } catch (error) {
      logger.error('Error scheduling installation:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'INSTALLATION_SCHEDULING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to schedule installation',
        },
      });
    }
  }
);

// RMA Management Routes

/**
 * @swagger
 * /service/rma-requests:
 *   post:
 *     summary: Create RMA request
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: RMA request created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/rma-requests',
  authenticate,
  validate({ body: rmaRequestSchema }),
  async (req, res) => {
    try {
      const rma = await serviceService.createRMARequest(req.body);

      res.status(201).json({
        success: true,
        data: rma,
        message: 'RMA request created successfully',
      });
    } catch (error) {
      logger.error('Error creating RMA request:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'RMA_REQUEST_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create RMA request',
        },
      });
    }
  }
);

// Service Completion Routes

/**
 * @swagger
 * /service/complete:
 *   post:
 *     summary: Complete service request
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Service completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/complete',
  authenticate,
  validate({ body: serviceCompletionSchema }),
  async (req, res) => {
    try {
      const completion = await serviceService.completeService({
        ...req.body,
        completionDate: new Date(req.body.completionDate),
      });

      res.status(201).json({
        success: true,
        data: completion,
        message: 'Service completed successfully',
      });
    } catch (error) {
      logger.error('Error completing service:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SERVICE_COMPLETION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to complete service',
        },
      });
    }
  }
);

// Performance and Analytics Routes

/**
 * @swagger
 * /service/performance-metrics:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Performance metrics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/performance-metrics',
  authenticate,
  async (req, res) => {
    try {
      const { technicianId, period } = req.query;

      const metrics = await serviceService.getServicePerformanceMetrics(
        technicianId as string,
        period as string
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERFORMANCE_METRICS_FETCH_FAILED',
          message: 'Failed to fetch performance metrics',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/analytics:
 *   get:
 *     summary: Get service analytics
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Service analytics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/analytics',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;

      const analytics = await serviceService.getServiceAnalytics(
        branchId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting service analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVICE_ANALYTICS_FETCH_FAILED',
          message: 'Failed to fetch service analytics',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/requests/{id}/status:
 *   put:
 *     summary: Update service request status
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/requests/:id/status',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Service request ID is required',
          },
        });
        return;
      }

      const serviceRequest = await prisma.serviceRequest.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: serviceRequest,
        message: 'Service request status updated successfully',
      });
    } catch (error) {
      logger.error('Error updating service request status:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'SERVICE_REQUEST_UPDATE_FAILED',
          message: 'Failed to update service request status',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/technicians:
 *   get:
 *     summary: Get available technicians
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *           default: SERVICE
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Technicians list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/technicians',
  authenticate,
  async (req, res) => {
    try {
      const { department = 'SERVICE', available = true } = req.query;

      const whereClause: any = {
        department: department as string,
        isActive: true,
        isDeleted: false,
      };

      const technicians = await prisma.employee.findMany({
        where: whereClause,
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          phone: true,
          designation: true,
          department: true,
        },
        orderBy: { firstName: 'asc' },
      });

      res.json({
        success: true,
        data: technicians,
      });
    } catch (error) {
      logger.error('Error getting technicians:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TECHNICIANS_FETCH_FAILED',
          message: 'Failed to fetch technicians',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/dashboard:
 *   get:
 *     summary: Get service dashboard
 *     description: Get service dashboard data with KPIs and metrics
 *     tags: [Service]
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
 *         description: Service dashboard data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard',
  authenticate,
  async (req, res) => {
    try {
      const { branchId } = req.query;

      // Get service request counts by status
      const whereClause: any = {};
      if (branchId) {
        whereClause.customer = {
          branchId: branchId as string,
        };
      }

      const [
        totalRequests,
        scheduledRequests,
        inProgressRequests,
        completedRequests,
        overdueRequests,
        activeContracts,
        expiringContracts
      ] = await Promise.all([
        prisma.serviceRequest.count({ where: whereClause }),
        prisma.serviceRequest.count({ where: { ...whereClause, status: 'SCHEDULED' } }),
        prisma.serviceRequest.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
        prisma.serviceRequest.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        prisma.serviceRequest.count({
          where: {
            ...whereClause,
            scheduledDate: { lt: new Date() },
            status: { not: 'COMPLETED' },
          },
        }),
        prisma.aMCContract.count({ where: { status: 'ACTIVE' } }),
        prisma.aMCContract.count({
          where: {
            status: 'ACTIVE',
            endDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            },
          },
        }),
      ]);

      const dashboardData = {
        serviceRequests: {
          total: totalRequests,
          scheduled: scheduledRequests,
          inProgress: inProgressRequests,
          completed: completedRequests,
          overdue: overdueRequests,
        },
        amcContracts: {
          active: activeContracts,
          expiring: expiringContracts,
        },
        completionRate: totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0,
      };

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Error getting service dashboard:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_FETCH_FAILED',
          message: 'Failed to fetch dashboard data',
        },
      });
    }
  }
);

// Service Billing and Invoice Management Routes

/**
 * POST /api/service/generate-invoice
 * Generate service invoice with detailed cost breakdown
 * Validates: Requirements 6.5, 6.6 - Service billing and invoice generation
 */
router.post('/generate-invoice',
  authenticate,
  validate({ body: serviceInvoiceSchema }),
  async (req, res) => {
    try {
      const invoice = await serviceService.generateServiceInvoice({
        ...req.body,
        invoiceDate: new Date(req.body.invoiceDate),
        dueDate: new Date(req.body.dueDate),
      });

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Service invoice generated successfully',
      });
    } catch (error) {
      logger.error('Error generating service invoice:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'INVOICE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate invoice',
        },
      });
    }
  }
);

/**
 * GET /api/service/cost-breakdown/:serviceRequestId
 * Get detailed service cost breakdown
 * Validates: Requirements 6.5, 6.6 - Service costing with parts and labor tracking
 */
router.get('/cost-breakdown/:serviceRequestId',
  authenticate,
  async (req, res) => {
    try {
      const { serviceRequestId } = req.params;

      if (!serviceRequestId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Service request ID is required',
          },
        });
        return;
      }

      const costBreakdown = await serviceService.calculateServiceCostBreakdown(serviceRequestId);

      res.json({
        success: true,
        data: costBreakdown,
      });
    } catch (error) {
      logger.error('Error getting cost breakdown:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'COST_BREAKDOWN_FAILED',
          message: 'Failed to calculate cost breakdown',
        },
      });
    }
  }
);

// Mobile App Integration Routes

/**
 * GET /api/service/mobile/sync/:technicianId
 * Get sync data for mobile app
 * Validates: Requirements 6.6 - Service technician mobile app integration
 */
router.get('/mobile/sync/:technicianId',
  authenticate,
  async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { lastSyncTime } = req.query;

      if (!technicianId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Technician ID is required',
          },
        });
        return;
      }

      const syncData = await serviceService.getMobileAppSyncData(
        technicianId,
        lastSyncTime ? new Date(lastSyncTime as string) : undefined
      );

      res.json({
        success: true,
        data: syncData,
      });
    } catch (error) {
      logger.error('Error getting mobile sync data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MOBILE_SYNC_FAILED',
          message: 'Failed to get sync data',
        },
      });
    }
  }
);

/**
 * GET /api/service/mobile/parts-inventory
 * Get service parts inventory for mobile app
 * Validates: Requirements 6.6 - Service parts inventory management
 */
router.get('/mobile/parts-inventory',
  authenticate,
  async (req, res) => {
    try {
      const { warehouseId } = req.query;

      const inventory = await serviceService.getServicePartsInventory(warehouseId as string);

      res.json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      logger.error('Error getting service parts inventory:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PARTS_INVENTORY_FAILED',
          message: 'Failed to get parts inventory',
        },
      });
    }
  }
);

/**
 * @swagger
 * /service/mobile/update/{serviceRequestId}:
 *   put:
 *     summary: Update service from mobile
 *     tags: [Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Service updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/mobile/update/:serviceRequestId',
  authenticate,
  validate({ body: mobileUpdateSchema }),
  async (req, res) => {
    try {
      const { serviceRequestId } = req.params;

      if (!serviceRequestId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Service request ID is required',
          },
        });
        return;
      }

      const updatedService = await serviceService.updateServiceFromMobile(serviceRequestId, {
        ...req.body,
        completionDate: req.body.completionDate ? new Date(req.body.completionDate) : undefined,
      });

      res.json({
        success: true,
        data: updatedService,
        message: 'Service request updated successfully',
      });
    } catch (error) {
      logger.error('Error updating service from mobile:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'MOBILE_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update service',
        },
      });
    }
  }
);

/**
 * GET /api/service/enhanced-analytics
 * Get enhanced service analytics and reporting
 * Validates: Requirements 6.6 - Service analytics and reporting
 */
router.get('/enhanced-analytics',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate, technicianId } = req.query;

      const analytics = await serviceService.getEnhancedServiceAnalytics(
        branchId as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        technicianId as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting enhanced service analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ENHANCED_ANALYTICS_FAILED',
          message: 'Failed to fetch enhanced analytics',
        },
      });
    }
  }
);

export { router as serviceRoutes };