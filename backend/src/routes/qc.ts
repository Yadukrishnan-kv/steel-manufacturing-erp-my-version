// Quality Control Routes - API endpoints for QC management
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { QCService } from '../services/qc.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const qcService = new QCService(prisma);

// Validation schemas
const createQCInspectionSchema = z.object({
  productionOrderId: z.string().uuid(),
  stage: z.enum(['CUTTING', 'FABRICATION', 'COATING', 'ASSEMBLY', 'DISPATCH', 'INSTALLATION']),
  inspectorId: z.string().uuid().optional(),
  customerRequirements: z.array(z.string()).optional(),
  checklistItems: z.array(z.object({
    checkpointId: z.string().min(1),
    description: z.string().min(1),
    expectedValue: z.string().min(1),
    actualValue: z.string().optional(),
    status: z.enum(['PENDING', 'PASS', 'FAIL', 'NA']).optional(),
    photos: z.array(z.string()).optional(),
    comments: z.string().optional(),
  })),
});

const recordQCInspectionSchema = z.object({
  checklistResults: z.array(z.object({
    checkpointId: z.string().min(1),
    actualValue: z.string().optional(),
    status: z.enum(['PENDING', 'PASS', 'FAIL', 'NA']).optional(),
    photos: z.array(z.string()).optional(),
    comments: z.string().optional(),
  })),
  photos: z.array(z.string()),
  remarks: z.string().optional(),
});

const assignInspectorSchema = z.object({
  inspectorId: z.string().uuid(),
});

const linkDeliverySchema = z.object({
  deliveryDocumentIds: z.array(z.string()),
});

// QC Inspection Management Routes

/**
 * @swagger
 * /qc/inspections:
 *   post:
 *     summary: Create QC inspection
 *     description: Create QC inspection with stage-specific checklist
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productionOrderId, stage, checklistItems]
 *             properties:
 *               productionOrderId:
 *                 type: string
 *                 format: uuid
 *               stage:
 *                 type: string
 *                 enum: [CUTTING, FABRICATION, COATING, ASSEMBLY, DISPATCH, INSTALLATION]
 *               inspectorId:
 *                 type: string
 *                 format: uuid
 *               customerRequirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               checklistItems:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: QC inspection created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/inspections',
  authenticate,
  validate({ body: createQCInspectionSchema }),
  async (req, res) => {
    try {
      const inspection = await qcService.createQCInspection(req.body);

      res.status(201).json({
        success: true,
        data: inspection,
        message: 'QC inspection created successfully',
      });
    } catch (error) {
      logger.error('Error creating QC inspection:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_INSPECTION_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create QC inspection',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/inspections/{id}:
 *   get:
 *     summary: Get QC inspection details
 *     tags: [Quality Control]
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
 *         description: QC inspection details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/inspections/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      const inspection = await qcService.getQCInspectionWithDetails(id);

      res.json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      logger.error('Error getting QC inspection:', error);
      res.status(404).json({
        success: false,
        error: {
          code: 'QC_INSPECTION_NOT_FOUND',
          message: 'QC inspection not found',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/inspections/{id}/record:
 *   put:
 *     summary: Record QC inspection results
 *     tags: [Quality Control]
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
 *               - checklistResults
 *               - photos
 *             properties:
 *               checklistResults:
 *                 type: array
 *                 items:
 *                   type: object
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: QC inspection recorded successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/inspections/:id/record',
  authenticate,
  validate({ body: recordQCInspectionSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      const { checklistResults, photos, remarks } = req.body;

      const inspection = await qcService.recordQCInspection(
        id,
        checklistResults,
        photos,
        remarks
      );

      res.json({
        success: true,
        data: inspection,
        message: 'QC inspection recorded successfully',
      });
    } catch (error) {
      logger.error('Error recording QC inspection:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_INSPECTION_RECORDING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to record QC inspection',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/inspections/{id}/assign-inspector:
 *   put:
 *     summary: Assign QC inspector
 *     tags: [Quality Control]
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
 *               - inspectorId
 *             properties:
 *               inspectorId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Inspector assigned successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/inspections/:id/assign-inspector',
  authenticate,
  validate({ body: assignInspectorSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { inspectorId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      await qcService.assignQCInspector(id, inspectorId);

      res.json({
        success: true,
        message: 'QC inspector assigned successfully',
      });
    } catch (error) {
      logger.error('Error assigning QC inspector:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_INSPECTOR_ASSIGNMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to assign QC inspector',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/checklists/{stage}:
 *   get:
 *     summary: Get stage-specific QC checklist
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stage
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CUTTING, FABRICATION, COATING, ASSEMBLY, DISPATCH, INSTALLATION]
 *     responses:
 *       200:
 *         description: QC checklist template
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/checklists/:stage',
  authenticate,
  async (req, res) => {
    try {
      const { stage } = req.params;
      
      if (!stage || !['CUTTING', 'FABRICATION', 'COATING', 'ASSEMBLY', 'DISPATCH', 'INSTALLATION'].includes(stage)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: 'Invalid QC stage specified',
          },
        });
        return;
      }

      // This would typically come from a database or configuration
      // For now, we'll return the stage-specific checklist from the service
      const checklist = await qcService['getStageSpecificChecklist'](stage as any);

      res.json({
        success: true,
        data: {
          stage,
          checklist,
        },
      });
    } catch (error) {
      logger.error('Error getting QC checklist:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_CHECKLIST_FETCH_FAILED',
          message: 'Failed to fetch QC checklist',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/rework:
 *   post:
 *     summary: Generate rework job card
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionId
 *             properties:
 *               inspectionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Rework job card generated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/rework',
  authenticate,
  async (req, res) => {
    try {
      const { inspectionId } = req.body;

      if (!inspectionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      const reworkJobCard = await qcService.generateReworkJobCard(inspectionId);

      res.status(201).json({
        success: true,
        data: reworkJobCard,
        message: 'Rework job card generated successfully',
      });
    } catch (error) {
      logger.error('Error generating rework job card:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'REWORK_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate rework job card',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/analytics:
 *   get:
 *     summary: Get QC analytics
 *     description: Get QC analytics and quality trend reporting
 *     tags: [Quality Control]
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
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [CUTTING, FABRICATION, COATING, ASSEMBLY, DISPATCH, INSTALLATION]
 *         description: Filter by stage
 *     responses:
 *       200:
 *         description: QC analytics data
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/analytics',
  authenticate,
  async (req, res) => {
    try {
      const { startDate, endDate, branchId, stage } = req.query;

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

      const analytics = await qcService.getQCAnalytics(
        new Date(startDate as string),
        new Date(endDate as string),
        branchId as string,
        stage as any
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting QC analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_ANALYTICS_FAILED',
          message: 'Failed to get QC analytics',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/reports/{id}:
 *   get:
 *     summary: Generate QC report
 *     tags: [Quality Control]
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
 *         description: QC report generated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/reports/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      const report = await qcService.generateQCReport(id);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Error generating QC report:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_REPORT_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate QC report',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/link-delivery:
 *   post:
 *     summary: Link QC reports to delivery
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productionOrderId
 *               - deliveryDocumentIds
 *             properties:
 *               productionOrderId:
 *                 type: string
 *                 format: uuid
 *               deliveryDocumentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: QC reports linked to delivery
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/link-delivery',
  authenticate,
  validate({ body: linkDeliverySchema }),
  async (req, res) => {
    try {
      const { productionOrderId, deliveryDocumentIds } = req.body;

      if (!productionOrderId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Production order ID is required',
          },
        });
        return;
      }

      await qcService.linkQCReportToDelivery(productionOrderId, deliveryDocumentIds);

      res.json({
        success: true,
        message: 'QC reports linked to delivery successfully',
      });
    } catch (error) {
      logger.error('Error linking QC reports to delivery:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_DELIVERY_LINKING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to link QC reports to delivery',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/inspections:
 *   get:
 *     summary: Get QC inspections list
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productionOrderId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: inspectorId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: QC inspections list
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/inspections',
  authenticate,
  async (req, res) => {
    try {
      const { 
        productionOrderId, 
        stage, 
        status, 
        inspectorId, 
        startDate, 
        endDate,
        page = '1',
        limit = '10'
      } = req.query;

      const whereClause: any = {};

      if (productionOrderId) {
        whereClause.productionOrderId = productionOrderId;
      }

      if (stage) {
        whereClause.stage = stage;
      }

      if (status) {
        whereClause.status = status;
      }

      if (inspectorId) {
        whereClause.inspectorId = inspectorId;
      }

      if (startDate && endDate) {
        whereClause.inspectionDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [inspections, total] = await Promise.all([
        prisma.qCInspection.findMany({
          where: whereClause,
          include: {
            checklistItems: true,
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
          orderBy: {
            inspectionDate: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.qCInspection.count({
          where: whereClause,
        }),
      ]);

      res.json({
        success: true,
        data: {
          inspections,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting QC inspections:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_INSPECTIONS_FETCH_FAILED',
          message: 'Failed to fetch QC inspections',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/inspector-workload/{inspectorId}:
 *   get:
 *     summary: Get inspector workload
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inspectorId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inspector workload data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/inspector-workload/:inspectorId',
  authenticate,
  async (req, res) => {
    try {
      const { inspectorId } = req.params;

      if (!inspectorId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspector ID is required',
          },
        });
        return;
      }

      const [pendingInspections, completedToday, weeklyStats] = await Promise.all([
        // Pending inspections
        prisma.qCInspection.findMany({
          where: {
            inspectorId,
            status: 'PENDING',
          },
          include: {
            productionOrder: {
              select: {
                orderNumber: true,
              },
            },
          },
        }),
        
        // Completed today
        prisma.qCInspection.count({
          where: {
            inspectorId,
            inspectionDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            status: {
              in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'],
            },
          },
        }),
        
        // Weekly statistics
        prisma.qCInspection.findMany({
          where: {
            inspectorId,
            inspectionDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
            status: {
              in: ['PASSED', 'FAILED', 'REWORK_REQUIRED'],
            },
          },
        }),
      ]);

      const weeklyPassRate = weeklyStats.length > 0 ? 
        (weeklyStats.filter(i => i.status === 'PASSED').length / weeklyStats.length) * 100 : 0;

      const averageScore = weeklyStats.length > 0 ?
        weeklyStats.reduce((sum, i) => sum + (i.overallScore || 0), 0) / weeklyStats.length : 0;

      res.json({
        success: true,
        data: {
          inspectorId,
          pendingCount: pendingInspections.length,
          completedToday,
          weeklyCompleted: weeklyStats.length,
          weeklyPassRate,
          averageScore,
          pendingInspections: pendingInspections.map(i => ({
            id: i.id,
            inspectionNumber: i.inspectionNumber,
            stage: i.stage,
            productionOrderNumber: i.productionOrder.orderNumber,
          })),
        },
      });
    } catch (error) {
      logger.error('Error getting inspector workload:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INSPECTOR_WORKLOAD_FAILED',
          message: 'Failed to get inspector workload',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/production-order/{id}/inspections:
 *   get:
 *     summary: Get production order QC inspections
 *     tags: [Quality Control]
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
 *         description: Production order QC inspections
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/production-order/:id/inspections',
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

      const inspections = await prisma.qCInspection.findMany({
        where: {
          productionOrderId: id,
        },
        include: {
          checklistItems: true,
        },
        orderBy: {
          inspectionDate: 'asc',
        },
      });

      // Calculate overall production order QC status
      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.status === 'PASSED').length;
      const failedInspections = inspections.filter(i => i.status === 'FAILED').length;
      const pendingInspections = inspections.filter(i => i.status === 'PENDING').length;

      const overallStatus = pendingInspections > 0 ? 'IN_PROGRESS' :
        failedInspections > 0 ? 'FAILED' :
        passedInspections === totalInspections ? 'PASSED' : 'PARTIAL';

      res.json({
        success: true,
        data: {
          productionOrderId: id,
          inspections,
          summary: {
            totalInspections,
            passedInspections,
            failedInspections,
            pendingInspections,
            overallStatus,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting production order QC inspections:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PRODUCTION_ORDER_QC_FAILED',
          message: 'Failed to get production order QC inspections',
        },
      });
    }
  }
);

/**
 * PUT /api/qc/inspections/:id/customer-requirements
 * Update customer-specific requirements for inspection
 * Validates: Requirements 5.4 - Customer requirement embedding
 */
router.put('/inspections/:id/customer-requirements',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { customerRequirements } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Inspection ID is required',
          },
        });
        return;
      }

      await prisma.qCInspection.update({
        where: { id },
        data: {
          customerRequirements: customerRequirements ? JSON.stringify(customerRequirements) : null,
        },
      });

      res.json({
        success: true,
        message: 'Customer requirements updated successfully',
      });
    } catch (error) {
      logger.error('Error updating customer requirements:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CUSTOMER_REQUIREMENTS_UPDATE_FAILED',
          message: 'Failed to update customer requirements',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/certificates:
 *   post:
 *     summary: Generate QC certificate
 *     description: Generate QC certificate for production order
 *     tags: [Quality Control]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productionOrderId, certificateType, issuedBy]
 *             properties:
 *               productionOrderId:
 *                 type: string
 *                 format: uuid
 *               certificateType:
 *                 type: string
 *               issuedBy:
 *                 type: string
 *               customerApprovalRequired:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: QC certificate generated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/certificates',
  authenticate,
  async (req, res) => {
    try {
      const { 
        productionOrderId, 
        certificateType, 
        issuedBy, 
        customerApprovalRequired = false 
      } = req.body;

      if (!productionOrderId || !certificateType || !issuedBy) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Production order ID, certificate type, and issued by are required',
          },
        });
        return;
      }

      const certificate = await qcService.generateQCCertificate(
        productionOrderId,
        certificateType,
        issuedBy,
        customerApprovalRequired
      );

      res.status(201).json({
        success: true,
        data: certificate,
        message: 'QC certificate generated successfully',
      });
    } catch (error) {
      logger.error('Error generating QC certificate:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_CERTIFICATE_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate QC certificate',
        },
      });
    }
  }
);

/**
 * POST /api/qc/certificates/:id/submit-approval
 * Submit QC certificate for customer approval
 * Validates: Requirements 5.5 - Customer approval workflows
 */
router.post('/certificates/:id/submit-approval',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { submissionNotes } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Certificate ID is required',
          },
        });
        return;
      }

      await qcService.submitCertificateForCustomerApproval(id, submissionNotes);

      res.json({
        success: true,
        message: 'Certificate submitted for customer approval successfully',
      });
    } catch (error) {
      logger.error('Error submitting certificate for approval:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CERTIFICATE_SUBMISSION_FAILED',
          message: 'Failed to submit certificate for approval',
        },
      });
    }
  }
);

/**
 * POST /api/qc/certificates/:id/customer-approval
 * Process customer approval for QC certificate
 * Validates: Requirements 5.5 - Customer approval workflows
 */
router.post('/certificates/:id/customer-approval',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approved, approvedBy, comments } = req.body;

      if (!id || typeof approved !== 'boolean' || !approvedBy) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Certificate ID, approval status, and approved by are required',
          },
        });
        return;
      }

      await qcService.processCustomerApproval(id, approved, approvedBy, comments);

      res.json({
        success: true,
        message: `Certificate ${approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      logger.error('Error processing customer approval:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CUSTOMER_APPROVAL_FAILED',
          message: 'Failed to process customer approval',
        },
      });
    }
  }
);

/**
 * @swagger
 * /qc/dashboard:
 *   get:
 *     summary: Get QC dashboard
 *     description: Get QC dashboard data with real-time monitoring
 *     tags: [Quality Control]
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
 *         description: QC dashboard data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard',
  authenticate,
  async (req, res) => {
    try {
      const { branchId } = req.query;

      const dashboardData = await qcService.getQCDashboardData(branchId as string);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Error getting QC dashboard data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_DASHBOARD_FAILED',
          message: 'Failed to get QC dashboard data',
        },
      });
    }
  }
);

/**
 * POST /api/qc/production-integration
 * Integrate QC with production process
 * Validates: Requirements 5.1, 5.3 - QC integration with production
 */
router.post('/production-integration',
  authenticate,
  async (req, res) => {
    try {
      const { productionOrderId, stage, triggerType = 'MANUAL_TRIGGER' } = req.body;

      if (!productionOrderId || !stage) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Production order ID and stage are required',
          },
        });
        return;
      }

      const inspectionId = await qcService.integrateWithProduction(
        productionOrderId,
        stage,
        triggerType
      );

      res.status(201).json({
        success: true,
        data: { inspectionId },
        message: 'QC inspection created and integrated with production',
      });
    } catch (error) {
      logger.error('Error integrating QC with production:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'QC_PRODUCTION_INTEGRATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to integrate QC with production',
        },
      });
    }
  }
);

/**
 * PUT /api/qc/inspections/:id/update-production
 * Update production order status based on QC results
 * Validates: Requirements 5.3 - QC integration with production
 */
router.put('/inspections/:id/update-production',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { qcStatus } = req.body;

      if (!id || !qcStatus) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Inspection ID and QC status are required',
          },
        });
        return;
      }

      await qcService.updateProductionOrderFromQC(id, qcStatus);

      res.json({
        success: true,
        message: 'Production order status updated based on QC results',
      });
    } catch (error) {
      logger.error('Error updating production order from QC:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'PRODUCTION_UPDATE_FAILED',
          message: 'Failed to update production order from QC',
        },
      });
    }
  }
);

/**
 * GET /api/qc/performance-metrics
 * Get comprehensive QC performance metrics and inspector evaluation
 * Validates: Requirements 5.1 - QC performance metrics and inspector evaluation
 */
router.get('/performance-metrics',
  authenticate,
  async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        branchId, 
        inspectorId,
        metricType = 'all' 
      } = req.query;

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

      // Get comprehensive analytics
      const analytics = await qcService.getQCAnalytics(
        new Date(startDate as string),
        new Date(endDate as string),
        branchId as string
      );

      // Get dashboard data for additional metrics
      const dashboardData = await qcService.getQCDashboardData(branchId as string);

      const performanceMetrics = {
        overview: {
          totalInspections: analytics.totalInspections,
          passRate: analytics.passRate,
          failRate: analytics.failRate,
          reworkRate: analytics.reworkRate,
          averageScore: analytics.averageScore,
        },
        stagePerformance: analytics.stageWiseMetrics,
        inspectorPerformance: analytics.inspectorPerformance,
        trends: analytics.trendData,
        realTimeMetrics: dashboardData.realTimeMetrics,
        productionIntegration: dashboardData.productionIntegration,
        alerts: dashboardData.alerts,
      };

      res.json({
        success: true,
        data: performanceMetrics,
      });
    } catch (error) {
      logger.error('Error getting QC performance metrics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_PERFORMANCE_METRICS_FAILED',
          message: 'Failed to get QC performance metrics',
        },
      });
    }
  }
);

/**
 * GET /api/qc/alerts
 * Get current QC alerts and notifications
 */
router.get('/alerts',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, severity, acknowledged } = req.query;

      const dashboardData = await qcService.getQCDashboardData(branchId as string);
      
      let alerts = dashboardData.alerts;

      // Filter by severity if provided
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      // Filter by acknowledged status if provided
      if (acknowledged !== undefined) {
        const isAcknowledged = acknowledged === 'true';
        alerts = alerts.filter(alert => alert.acknowledged === isAcknowledged);
      }

      res.json({
        success: true,
        data: {
          alerts,
          summary: {
            total: alerts.length,
            critical: alerts.filter(a => a.severity === 'CRITICAL').length,
            high: alerts.filter(a => a.severity === 'HIGH').length,
            medium: alerts.filter(a => a.severity === 'MEDIUM').length,
            low: alerts.filter(a => a.severity === 'LOW').length,
            unacknowledged: alerts.filter(a => !a.acknowledged).length,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting QC alerts:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'QC_ALERTS_FAILED',
          message: 'Failed to get QC alerts',
        },
      });
    }
  }
);

export { router as qcRoutes };