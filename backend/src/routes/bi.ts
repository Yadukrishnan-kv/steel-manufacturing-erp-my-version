// BI and Dashboard Routes - API endpoints for business intelligence and reporting
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { BIService } from '../services/bi.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const biService = new BIService(prisma);

// Validation schemas
const dashboardRequestSchema = z.object({
  role: z.string().min(1),
  branchId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
});

const trendAnalysisSchema = z.object({
  metric: z.enum(['sales_revenue', 'production_volume', 'customer_satisfaction', 'inventory_turnover', 'quality_score']),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  branchId: z.string().uuid().optional(),
  groupBy: z.array(z.string()).optional(),
});

const drillDownSchema = z.object({
  chartId: z.string().min(1),
  dataPoint: z.string().min(1),
  filters: z.record(z.any()).optional(),
  level: z.number().min(0).max(5),
});

const realtimeDataSchema = z.object({
  dashboardId: z.string().min(1),
  widgets: z.array(z.string()),
  lastUpdate: z.string().datetime().optional(),
});

const customReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dataSource: z.enum(['sales_orders', 'production_orders', 'inventory_items', 'customers', 'employees', 'service_requests']),
  fields: z.array(z.object({
    field: z.string(),
    label: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean']),
    aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
    format: z.string().optional(),
  })),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'like']),
    value: z.any(),
    label: z.string().optional(),
  })),
  groupBy: z.array(z.string()).optional(),
  sortBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  format: z.enum(['table', 'chart', 'pivot']),
  chartType: z.enum(['line', 'bar', 'pie', 'area']).optional(),
});

/**
 * @swagger
 * /bi/dashboards/{role}:
 *   get:
 *     summary: Get role-based dashboard
 *     description: Get role-based dashboard system for production, sales, finance, HR, and service
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [executive, production, sales, finance, hr, service]
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Dashboard data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/dashboards/:role',
  authenticate,
  async (req, res) => {
    try {
      const { role } = req.params;
      const { branchId, startDate, endDate } = req.query;

      if (!role) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Role is required',
          },
        });
        return;
      }

      const dashboardData = await biService.getRoleDashboard({
        role,
        branchId: branchId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Error getting role-based dashboard:', error);
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

/**
 * @swagger
 * /bi/dashboards:
 *   post:
 *     summary: Get dashboard with custom parameters
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/dashboards',
  authenticate,
  validate({ body: dashboardRequestSchema }),
  async (req, res) => {
    try {
      const dashboardRequest = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const dashboardData = await biService.getRoleDashboard(dashboardRequest);

      res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      logger.error('Error getting custom dashboard:', error);
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

/**
 * @swagger
 * /bi/trends:
 *   post:
 *     summary: Get trend analysis and forecasting
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metric
 *               - period
 *               - startDate
 *               - endDate
 *             properties:
 *               metric:
 *                 type: string
 *                 enum: [sales_revenue, production_volume, customer_satisfaction, inventory_turnover, quality_score]
 *               period:
 *                 type: string
 *                 enum: [daily, weekly, monthly, quarterly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               branchId:
 *                 type: string
 *                 format: uuid
 *               groupBy:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/trends',
  authenticate,
  validate({ body: trendAnalysisSchema }),
  async (req, res) => {
    try {
      const trendRequest = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const trendAnalysis = await biService.getTrendAnalysis(trendRequest);

      res.json({
        success: true,
        data: trendAnalysis,
      });
    } catch (error) {
      logger.error('Error getting trend analysis:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TREND_ANALYSIS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to perform trend analysis',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/drill-down:
 *   post:
 *     summary: Get drill-down data for charts
 *     description: Power BI-style drill-down reporting functionality
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chartId
 *               - dataPoint
 *               - level
 *             properties:
 *               chartId:
 *                 type: string
 *               dataPoint:
 *                 type: string
 *               filters:
 *                 type: object
 *               level:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Drill-down data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/drill-down',
  authenticate,
  validate({ body: drillDownSchema }),
  async (req, res) => {
    try {
      const drillDownData = await biService.getDrillDownData(req.body);

      res.json({
        success: true,
        data: drillDownData,
      });
    } catch (error) {
      logger.error('Error getting drill-down data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DRILL_DOWN_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get drill-down data',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/realtime:
 *   post:
 *     summary: Get real-time data aggregation
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dashboardId
 *               - widgets
 *             properties:
 *               dashboardId:
 *                 type: string
 *               widgets:
 *                 type: array
 *                 items:
 *                   type: string
 *               lastUpdate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Real-time data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/realtime',
  authenticate,
  validate({ body: realtimeDataSchema }),
  async (req, res) => {
    try {
      const realtimeRequest = {
        ...req.body,
        lastUpdate: req.body.lastUpdate ? new Date(req.body.lastUpdate) : undefined,
      };

      const realtimeData = await biService.getRealtimeData(realtimeRequest);

      res.json({
        success: true,
        data: realtimeData,
      });
    } catch (error) {
      logger.error('Error getting real-time data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REALTIME_DATA_FAILED',
          message: 'Failed to get real-time data',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/realtime/{dashboardId}:
 *   get:
 *     summary: Get real-time updates for specific dashboard
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: widgets
 *         schema:
 *           type: string
 *         description: Comma-separated list of widget IDs
 *       - in: query
 *         name: lastUpdate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Real-time updates retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/realtime/:dashboardId',
  authenticate,
  async (req, res) => {
    try {
      const { dashboardId } = req.params;
      const { widgets, lastUpdate } = req.query;

      if (!dashboardId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Dashboard ID is required',
          },
        });
        return;
      }

      const widgetList = widgets ? (widgets as string).split(',') : [];

      const realtimeData = await biService.getRealtimeData({
        dashboardId,
        widgets: widgetList,
        lastUpdate: lastUpdate ? new Date(lastUpdate as string) : undefined,
      });

      res.json({
        success: true,
        data: realtimeData,
      });
    } catch (error) {
      logger.error('Error getting real-time dashboard updates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REALTIME_UPDATE_FAILED',
          message: 'Failed to get real-time updates',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/reports/custom:
 *   post:
 *     summary: Create custom report
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - dataSource
 *               - fields
 *               - filters
 *               - format
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               dataSource:
 *                 type: string
 *                 enum: [sales_orders, production_orders, inventory_items, customers, employees, service_requests]
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *               groupBy:
 *                 type: array
 *                 items:
 *                   type: string
 *               sortBy:
 *                 type: array
 *                 items:
 *                   type: object
 *               format:
 *                 type: string
 *                 enum: [table, chart, pivot]
 *               chartType:
 *                 type: string
 *                 enum: [line, bar, pie, area]
 *     responses:
 *       201:
 *         description: Custom report created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/reports/custom',
  authenticate,
  validate({ body: customReportSchema }),
  async (req, res) => {
    try {
      const customReport = await biService.createCustomReport(req.body);

      res.status(201).json({
        success: true,
        data: customReport,
        message: 'Custom report created successfully',
      });
    } catch (error) {
      logger.error('Error creating custom report:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CUSTOM_REPORT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create custom report',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/executive-dashboard:
 *   get:
 *     summary: Get executive dashboard with KPI monitoring
 *     tags: [Business Intelligence]
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
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Executive dashboard retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/executive-dashboard',
  authenticate,
  async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;

      const executiveDashboard = await biService.getRoleDashboard({
        role: 'executive',
        branchId: branchId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        data: executiveDashboard,
      });
    } catch (error) {
      logger.error('Error getting executive dashboard:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXECUTIVE_DASHBOARD_FAILED',
          message: 'Failed to fetch executive dashboard',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/kpis:
 *   get:
 *     summary: Get KPI data for monitoring
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: KPI data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/kpis',
  authenticate,
  async (req, res) => {
    try {
      const { role, branchId, category } = req.query;

      if (!role) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Role is required',
          },
        });
        return;
      }

      const dashboardData = await biService.getRoleDashboard({
        role: role as string,
        branchId: branchId as string,
        userId: req.user?.id,
      });

      // Filter KPIs by category if specified
      let kpis = dashboardData.kpis;
      if (category) {
        kpis = kpis.filter(kpi => kpi.category.toLowerCase() === (category as string).toLowerCase());
      }

      res.json({
        success: true,
        data: {
          kpis,
          summary: {
            total: kpis.length,
            onTrack: kpis.filter(kpi => kpi.color === 'success').length,
            atRisk: kpis.filter(kpi => kpi.color === 'warning').length,
            critical: kpis.filter(kpi => kpi.color === 'danger').length,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting KPI data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'KPI_FETCH_FAILED',
          message: 'Failed to fetch KPI data',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/charts/{chartId}:
 *   get:
 *     summary: Get specific chart data with drill-down capability
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chartId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: filters
 *         schema:
 *           type: string
 *         description: JSON string of filters
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/charts/:chartId',
  authenticate,
  async (req, res) => {
    try {
      const { chartId } = req.params;
      const { level = 0, filters } = req.query;

      if (!chartId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Chart ID is required',
          },
        });
        return;
      }

      // Parse filters if provided
      let parsedFilters: Record<string, any> = {};
      if (filters) {
        try {
          parsedFilters = JSON.parse(filters as string);
        } catch (e) {
          // Ignore parsing errors, use empty filters
        }
      }

      const chartData = await biService.getDrillDownData({
        chartId,
        dataPoint: 'default',
        filters: parsedFilters,
        level: Number(level),
      });

      res.json({
        success: true,
        data: chartData,
      });
    } catch (error) {
      logger.error('Error getting chart data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CHART_DATA_FAILED',
          message: 'Failed to get chart data',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/access-control:
 *   get:
 *     summary: Get dashboard access control and user permissions
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access control data retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/access-control',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.roles?.[0] || 'user';

      // Define role-based access permissions
      const accessPermissions = {
        dashboards: [] as string[],
        reports: [] as string[],
        kpis: [] as string[],
        canCreateReports: false,
        canExportData: false,
        canViewAllBranches: false,
      };

      // Set permissions based on role
      switch (userRole.toLowerCase()) {
        case 'super_admin':
        case 'general_manager':
          accessPermissions.dashboards = ['executive', 'production', 'sales', 'finance', 'hr', 'service'];
          accessPermissions.reports = ['all'];
          accessPermissions.kpis = ['all'];
          accessPermissions.canCreateReports = true;
          accessPermissions.canExportData = true;
          accessPermissions.canViewAllBranches = true;
          break;
        case 'branch_manager':
          accessPermissions.dashboards = ['production', 'sales', 'finance', 'hr', 'service'];
          accessPermissions.reports = ['branch'];
          accessPermissions.kpis = ['operational'];
          accessPermissions.canCreateReports = true;
          accessPermissions.canExportData = true;
          accessPermissions.canViewAllBranches = false;
          break;
        case 'production_manager':
          accessPermissions.dashboards = ['production'];
          accessPermissions.reports = ['production'];
          accessPermissions.kpis = ['production', 'quality'];
          accessPermissions.canCreateReports = false;
          accessPermissions.canExportData = false;
          accessPermissions.canViewAllBranches = false;
          break;
        case 'sales_manager':
          accessPermissions.dashboards = ['sales'];
          accessPermissions.reports = ['sales', 'customer'];
          accessPermissions.kpis = ['sales', 'customer'];
          accessPermissions.canCreateReports = false;
          accessPermissions.canExportData = false;
          accessPermissions.canViewAllBranches = false;
          break;
        case 'finance_manager':
          accessPermissions.dashboards = ['finance'];
          accessPermissions.reports = ['finance', 'accounting'];
          accessPermissions.kpis = ['financial'];
          accessPermissions.canCreateReports = true;
          accessPermissions.canExportData = true;
          accessPermissions.canViewAllBranches = false;
          break;
        case 'hr_manager':
          accessPermissions.dashboards = ['hr'];
          accessPermissions.reports = ['hr', 'payroll'];
          accessPermissions.kpis = ['hr'];
          accessPermissions.canCreateReports = false;
          accessPermissions.canExportData = false;
          accessPermissions.canViewAllBranches = false;
          break;
        case 'service_manager':
          accessPermissions.dashboards = ['service'];
          accessPermissions.reports = ['service'];
          accessPermissions.kpis = ['service'];
          accessPermissions.canCreateReports = false;
          accessPermissions.canExportData = false;
          accessPermissions.canViewAllBranches = false;
          break;
        default:
          // Default user permissions
          accessPermissions.dashboards = [];
          accessPermissions.reports = [];
          accessPermissions.kpis = [];
      }

      res.json({
        success: true,
        data: {
          userId,
          role: userRole,
          permissions: accessPermissions,
        },
      });
    } catch (error) {
      logger.error('Error getting access control data:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ACCESS_CONTROL_FAILED',
          message: 'Failed to get access control data',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/export/{dashboardId}:
 *   get:
 *     summary: Export dashboard data in various formats
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, excel, pdf]
 *           default: json
 *     responses:
 *       200:
 *         description: Export prepared successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/export/:dashboardId',
  authenticate,
  async (req, res) => {
    try {
      const { dashboardId } = req.params;
      const { format = 'json' } = req.query;

      if (!dashboardId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Dashboard ID is required',
          },
        });
        return;
      }

      const userId = req.user?.id || '';
      const userRole = req.user?.roles?.[0] || 'user';

      const exportData = await biService.exportDashboardData(
        dashboardId,
        format as 'json' | 'csv' | 'excel' | 'pdf',
        userId,
        userRole
      );

      res.json({
        success: true,
        data: exportData,
        message: 'Export prepared successfully',
      });
    } catch (error) {
      logger.error('Error preparing export:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to prepare export',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/permissions:
 *   get:
 *     summary: Get user permissions for BI features
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/permissions',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user?.id || '';
      const userRole = req.user?.roles?.[0] || 'user';

      const permissions = await biService.getUserPermissions(userId, userRole);

      res.json({
        success: true,
        data: {
          userId,
          role: userRole,
          permissions,
        },
      });
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSIONS_FAILED',
          message: 'Failed to get user permissions',
        },
      });
    }
  }
);

/**
 * @swagger
 * /bi/analytics/advanced:
 *   get:
 *     summary: Get advanced analytics and insights
 *     tags: [Business Intelligence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: metrics
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated list of metrics
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: branchId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Advanced analytics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/analytics/advanced',
  authenticate,
  async (req, res) => {
    try {
      const { metrics, startDate, endDate, branchId } = req.query;

      if (!metrics || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Metrics, start date, and end date are required',
          },
        });
        return;
      }

      const metricsArray = (metrics as string).split(',');
      const period = {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const analytics = await biService.getAdvancedAnalytics(
        metricsArray,
        period,
        branchId as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting advanced analytics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_FAILED',
          message: 'Failed to get advanced analytics',
        },
      });
    }
  }
);

export { router as biRoutes };