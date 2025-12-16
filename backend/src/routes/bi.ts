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
 * GET /api/bi/dashboards/:role
 * Get role-based dashboard system for production, sales, finance, HR, and service
 * Validates: Requirements 10.1 - Role-based dashboard system
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
 * POST /api/bi/dashboards
 * Get dashboard with custom parameters
 * Validates: Requirements 10.1 - Role-based dashboard system
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
 * POST /api/bi/trends
 * Implement trend analysis and forecasting capabilities
 * Validates: Requirements 10.2 - Trend analysis and forecasting capabilities
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
 * POST /api/bi/drill-down
 * Build Power BI-style drill-down reporting functionality
 * Validates: Requirements 10.3 - Power BI-style drill-down reporting functionality
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
 * POST /api/bi/realtime
 * Create real-time data aggregation and dashboard updates
 * Validates: Requirements 10.4 - Real-time data aggregation and dashboard updates
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
 * GET /api/bi/realtime/:dashboardId
 * Get real-time updates for specific dashboard
 * Validates: Requirements 10.4 - Real-time data aggregation and dashboard updates
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
 * POST /api/bi/reports/custom
 * Create custom report builder functionality
 * Validates: Requirements 10.5 - Custom report builder functionality
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
 * GET /api/bi/executive-dashboard
 * Build executive dashboards with KPI monitoring
 * Validates: Requirements 10.1 - Executive dashboards with KPI monitoring
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
 * GET /api/bi/kpis
 * Get KPI data for monitoring
 * Validates: Requirements 10.1 - KPI monitoring
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
 * GET /api/bi/charts/:chartId
 * Get specific chart data with drill-down capability
 * Validates: Requirements 10.3 - Power BI-style drill-down reporting
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
 * GET /api/bi/access-control
 * Implement dashboard access control and user permissions
 * Validates: Requirements 10.4 - Dashboard access control and user permissions
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
 * GET /api/bi/export/:dashboardId
 * Export dashboard data in various formats
 * Validates: Requirements 10.5 - Custom report builder functionality
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
 * GET /api/bi/permissions
 * Get user permissions for BI features
 * Validates: Requirements 10.4 - Dashboard access control and user permissions
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
 * GET /api/bi/analytics/advanced
 * Get advanced analytics and insights
 * Validates: Requirements 10.2 - Trend analysis and forecasting capabilities
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