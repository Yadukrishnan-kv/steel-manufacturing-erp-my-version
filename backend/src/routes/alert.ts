import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { alertService } from '../services/alert.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const slaConfigurationSchema = z.object({
  module: z.string().min(1, 'Module is required'),
  process: z.string().min(1, 'Process is required'),
  slaHours: z.number().min(1, 'SLA hours must be at least 1'),
  escalationLevels: z.array(z.object({
    level: z.number().min(1),
    roleOrUserId: z.string().min(1),
    type: z.enum(['ROLE', 'USER']),
    hoursAfter: z.number().min(0),
  })),
});

const alertSchema = z.object({
  type: z.string().min(1, 'Alert type is required'),
  module: z.string().min(1, 'Module is required'),
  referenceId: z.string().min(1, 'Reference ID is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const alertNotificationSchema = z.object({
  alertId: z.string().uuid('Invalid alert ID'),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'APP']),
  recipient: z.string().min(1, 'Recipient is required'),
  message: z.string().min(1, 'Message is required'),
});

const alertUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  assignedTo: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
});

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /alerts/sla-configurations:
 *   post:
 *     summary: Create SLA configuration
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - process
 *               - slaHours
 *               - escalationLevels
 *             properties:
 *               module:
 *                 type: string
 *               process:
 *                 type: string
 *               slaHours:
 *                 type: number
 *               escalationLevels:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     level:
 *                       type: number
 *                     roleOrUserId:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [ROLE, USER]
 *                     hoursAfter:
 *                       type: number
 *     responses:
 *       201:
 *         description: SLA configuration created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.post('/sla-configurations', validate({ body: slaConfigurationSchema }), async (req: Request, res: Response) => {
  try {
    const slaConfig = await alertService.createSLAConfiguration(req.body);
    
    res.status(201).json({
      success: true,
      message: 'SLA configuration created successfully',
      data: slaConfig,
    });
  } catch (error) {
    logger.error('Error creating SLA configuration:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create SLA configuration',
    });
  }
});

/**
 * @swagger
 * /alerts/sla-configurations:
 *   get:
 *     summary: Get SLA configurations
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: process
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: SLA configurations retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sla-configurations', async (req: Request, res: Response) => {
  try {
    const { module, process, isActive } = req.query;
    
    const filters: any = {};
    if (module) filters.module = module as string;
    if (process) filters.process = process as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const slaConfigs = await alertService.getSLAConfigurations(filters);
    
    res.json({
      success: true,
      data: slaConfigs,
    });
  } catch (error) {
    logger.error('Error fetching SLA configurations:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch SLA configurations',
    });
  }
});

/**
 * @swagger
 * /alerts/sla-configurations/{id}:
 *   put:
 *     summary: Update SLA configuration
 *     tags: [Alerts]
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
 *     responses:
 *       200:
 *         description: SLA configuration updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/sla-configurations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const slaConfig = await alertService.updateSLAConfiguration(id, req.body);
    
    res.json({
      success: true,
      message: 'SLA configuration updated successfully',
      data: slaConfig,
    });
  } catch (error) {
    logger.error('Error updating SLA configuration:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update SLA configuration',
    });
  }
});

/**
 * @swagger
 * /alerts:
 *   post:
 *     summary: Create alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - module
 *               - referenceId
 *               - message
 *               - priority
 *             properties:
 *               type:
 *                 type: string
 *               module:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               assignedTo:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Alert created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/', validate({ body: alertSchema }), async (req: Request, res: Response) => {
  try {
    const alertData = {
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    };
    
    const alert = await alertService.createAlert(alertData);
    
    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: alert,
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create alert',
    });
  }
});

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get alerts with filtering and pagination
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ACKNOWLEDGED, RESOLVED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - in: query
 *         name: assignedTo
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      module,
      type,
      status,
      priority,
      assignedTo,
      page = '1',
      limit = '50',
    } = req.query;

    const filters: any = {};
    if (module) filters.module = module as string;
    if (type) filters.type = type as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (assignedTo) filters.assignedTo = assignedTo as string;
    filters.page = parseInt(page as string);
    filters.limit = parseInt(limit as string);

    const result = await alertService.getAlerts(filters);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch alerts',
    });
  }
});

/**
 * @swagger
 * /alerts/{id}:
 *   put:
 *     summary: Update alert
 *     tags: [Alerts]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ACKNOWLEDGED, RESOLVED]
 *               assignedTo:
 *                 type: string
 *               resolvedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Alert updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/:id', validate({ body: alertUpdateSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      resolvedAt: req.body.resolvedAt ? new Date(req.body.resolvedAt) : undefined,
    };
    
    const alert = await alertService.updateAlert(id, updates);
    
    res.json({
      success: true,
      message: 'Alert updated successfully',
      data: alert,
    });
  } catch (error) {
    logger.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update alert',
    });
  }
});

/**
 * @swagger
 * /alerts/notifications:
 *   post:
 *     summary: Send alert notification
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertId
 *               - channel
 *               - recipient
 *               - message
 *             properties:
 *               alertId:
 *                 type: string
 *                 format: uuid
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, WHATSAPP, APP]
 *               recipient:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Alert notification sent successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/notifications', validate({ body: alertNotificationSchema }), async (req: Request, res: Response) => {
  try {
    const result = await alertService.sendAlertNotification(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Alert notification sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error sending alert notification:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send alert notification',
    });
  }
});

/**
 * @swagger
 * /alerts/escalations/process:
 *   post:
 *     summary: Process escalations for overdue alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Escalations processed successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/escalations/process', async (req: Request, res: Response) => {
  try {
    const escalations = await alertService.processEscalations();
    
    res.json({
      success: true,
      message: 'Escalations processed successfully',
      data: {
        processedCount: escalations.length,
        escalations,
      },
    });
  } catch (error) {
    logger.error('Error processing escalations:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process escalations',
    });
  }
});

/**
 * @swagger
 * /alerts/reminders/generate:
 *   post:
 *     summary: Generate automatic reminders
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reminders generated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/reminders/generate', async (req: Request, res: Response) => {
  try {
    const reminders = await alertService.generateReminders();
    
    res.json({
      success: true,
      message: 'Reminders generated successfully',
      data: {
        generatedCount: reminders.length,
        reminders,
      },
    });
  } catch (error) {
    logger.error('Error generating reminders:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate reminders',
    });
  }
});

/**
 * @swagger
 * /alerts/dashboard:
 *   get:
 *     summary: Get alert dashboard data
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert dashboard data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { branchId, module } = req.query;
    
    const filters: any = {};
    if (branchId) filters.branchId = branchId as string;
    if (module) filters.module = module as string;

    const dashboard = await alertService.getAlertDashboard(filters);
    
    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    logger.error('Error fetching alert dashboard:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch alert dashboard',
    });
  }
});

/**
 * @swagger
 * /alerts/sla-performance:
 *   get:
 *     summary: Get SLA performance metrics
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: SLA performance metrics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/sla-performance', async (req: Request, res: Response) => {
  try {
    const { module, startDate, endDate } = req.query;
    
    const filters: any = {};
    if (module) filters.module = module as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const metrics = await alertService.getSLAPerformanceMetrics(filters);
    
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error fetching SLA performance metrics:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch SLA performance metrics',
    });
  }
});

export { router as alertRoutes };