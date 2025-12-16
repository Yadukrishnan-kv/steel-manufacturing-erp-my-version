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
 * @route POST /api/v1/alerts/sla-configurations
 * @desc Create SLA configuration
 * @access Private
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
 * @route GET /api/v1/alerts/sla-configurations
 * @desc Get SLA configurations
 * @access Private
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
 * @route PUT /api/v1/alerts/sla-configurations/:id
 * @desc Update SLA configuration
 * @access Private
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
 * @route POST /api/v1/alerts
 * @desc Create alert
 * @access Private
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
 * @route GET /api/v1/alerts
 * @desc Get alerts with filtering and pagination
 * @access Private
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
 * @route PUT /api/v1/alerts/:id
 * @desc Update alert
 * @access Private
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
 * @route POST /api/v1/alerts/notifications
 * @desc Send alert notification
 * @access Private
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
 * @route POST /api/v1/alerts/escalations/process
 * @desc Process escalations for overdue alerts
 * @access Private
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
 * @route POST /api/v1/alerts/reminders/generate
 * @desc Generate automatic reminders
 * @access Private
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
 * @route GET /api/v1/alerts/dashboard
 * @desc Get alert dashboard data
 * @access Private
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
 * @route GET /api/v1/alerts/sla-performance
 * @desc Get SLA performance metrics
 * @access Private
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