// Simple BI Service Tests - Isolated unit tests for business intelligence functionality
import { PrismaClient } from '@prisma/client';
import { BIService } from '../src/services/bi.service';

const prisma = new PrismaClient();
const biService = new BIService(prisma);

describe('BI Service - Core Functionality', () => {
  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Role-based Dashboard System', () => {
    test('should create BI service instance', () => {
      expect(biService).toBeDefined();
      expect(biService).toBeInstanceOf(BIService);
    });

    test('should get production dashboard for production manager', async () => {
      const dashboardData = await biService.getRoleDashboard({
        role: 'production_manager',
        branchId: 'test-branch-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(dashboardData).toBeDefined();
      expect(dashboardData.role).toBe('production_manager');
      expect(dashboardData.kpis).toBeInstanceOf(Array);
      expect(dashboardData.charts).toBeInstanceOf(Array);
      expect(dashboardData.widgets).toBeInstanceOf(Array);
      expect(dashboardData.alerts).toBeInstanceOf(Array);

      // Check for production-specific KPIs
      const productionKPIs = dashboardData.kpis.filter(kpi => 
        kpi.category === 'Production' || kpi.category === 'Quality' || kpi.category === 'Delivery'
      );
      expect(productionKPIs.length).toBeGreaterThan(0);
    });

    test('should get sales dashboard for sales manager', async () => {
      const dashboardData = await biService.getRoleDashboard({
        role: 'sales_manager',
        branchId: 'test-branch-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(dashboardData).toBeDefined();
      expect(dashboardData.role).toBe('sales_manager');
      expect(dashboardData.kpis).toBeInstanceOf(Array);

      // Check for sales-specific KPIs
      const salesKPIs = dashboardData.kpis.filter(kpi => 
        kpi.category === 'Revenue' || kpi.category === 'Sales'
      );
      expect(salesKPIs.length).toBeGreaterThan(0);
    });

    test('should get finance dashboard for finance manager', async () => {
      const dashboardData = await biService.getRoleDashboard({
        role: 'finance_manager',
        branchId: 'test-branch-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(dashboardData).toBeDefined();
      expect(dashboardData.role).toBe('finance_manager');
      expect(dashboardData.kpis).toBeInstanceOf(Array);

      // Check for finance-specific KPIs
      const financeKPIs = dashboardData.kpis.filter(kpi => 
        kpi.category === 'Receivables' || kpi.category === 'Collections'
      );
      expect(financeKPIs.length).toBeGreaterThan(0);
    });

    test('should get executive dashboard with consolidated data', async () => {
      const dashboardData = await biService.getRoleDashboard({
        role: 'executive',
        branchId: 'test-branch-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(dashboardData).toBeDefined();
      expect(dashboardData.role).toBe('executive');
      expect(dashboardData.kpis).toBeInstanceOf(Array);
      expect(dashboardData.charts).toBeInstanceOf(Array);

      // Executive dashboard should have KPIs from multiple modules
      const categories = new Set(dashboardData.kpis.map(kpi => kpi.category));
      expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
    });

    test('should handle unknown role with default dashboard', async () => {
      const dashboardData = await biService.getRoleDashboard({
        role: 'unknown_role',
        branchId: 'test-branch-id',
      });

      expect(dashboardData).toBeDefined();
      expect(dashboardData.role).toBe('unknown_role');
      expect(dashboardData.kpis).toEqual([]);
      expect(dashboardData.charts).toEqual([]);
      expect(dashboardData.widgets).toEqual([]);
      expect(dashboardData.alerts).toEqual([]);
    });
  });

  describe('Trend Analysis and Forecasting', () => {
    test('should perform trend analysis for sales revenue', async () => {
      const trendAnalysis = await biService.getTrendAnalysis({
        metric: 'sales_revenue',
        period: 'daily',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        branchId: 'test-branch-id',
      });

      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis.metric).toBe('sales_revenue');
      expect(trendAnalysis.period).toBe('daily');
      expect(trendAnalysis.dataPoints).toBeInstanceOf(Array);
      expect(trendAnalysis.forecast).toBeInstanceOf(Array);
      expect(trendAnalysis.insights).toBeInstanceOf(Array);
      expect(trendAnalysis.seasonality).toBeDefined();
    });

    test('should perform trend analysis for production volume', async () => {
      const trendAnalysis = await biService.getTrendAnalysis({
        metric: 'production_volume',
        period: 'weekly',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        branchId: 'test-branch-id',
      });

      expect(trendAnalysis).toBeDefined();
      expect(trendAnalysis.metric).toBe('production_volume');
      expect(trendAnalysis.period).toBe('weekly');
    });

    test('should handle unsupported metric gracefully', async () => {
      await expect(biService.getTrendAnalysis({
        metric: 'unsupported_metric' as any,
        period: 'daily',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      })).rejects.toThrow('Unsupported metric');
    });
  });

  describe('Drill-down Reporting', () => {
    test('should provide drill-down data for sales trend chart', async () => {
      const drillDownData = await biService.getDrillDownData({
        chartId: 'sales_trend',
        dataPoint: '2024-01-15',
        filters: { branch: 'test-branch-id' },
        level: 0,
      });

      expect(drillDownData).toBeDefined();
      expect(drillDownData.title).toContain('Daily Sales');
      expect(drillDownData.level).toBe(0);
      expect(drillDownData.breadcrumb).toBeInstanceOf(Array);
      expect(drillDownData.data).toBeInstanceOf(Array);
      expect(drillDownData.availableFilters).toBeInstanceOf(Array);
      expect(drillDownData.canDrillDown).toBe(true);
      expect(drillDownData.nextLevelOptions).toBeInstanceOf(Array);
    });

    test('should provide drill-down data for production trend chart', async () => {
      const drillDownData = await biService.getDrillDownData({
        chartId: 'production_trend',
        dataPoint: '2024-01-15',
        filters: {},
        level: 0,
      });

      expect(drillDownData).toBeDefined();
      expect(drillDownData.title).toContain('Daily Production');
      expect(drillDownData.canDrillDown).toBe(true);
    });

    test('should handle unsupported chart ID gracefully', async () => {
      await expect(biService.getDrillDownData({
        chartId: 'unsupported_chart',
        dataPoint: '2024-01-15',
        filters: {},
        level: 0,
      })).rejects.toThrow('Unsupported chart for drill-down');
    });
  });

  describe('Real-time Data Updates', () => {
    test('should get real-time data for dashboard widgets', async () => {
      const realtimeData = await biService.getRealtimeData({
        dashboardId: 'production-dashboard',
        widgets: ['recent_production_orders', 'production_kpis'],
        lastUpdate: new Date('2024-01-15T10:00:00Z'),
      });

      expect(realtimeData).toBeDefined();
      expect(realtimeData.timestamp).toBeInstanceOf(Date);
      expect(realtimeData.updates).toBeInstanceOf(Array);
      expect(realtimeData.updates).toHaveLength(2);
      expect(realtimeData.hasChanges).toBeDefined();

      // Check widget updates structure
      realtimeData.updates.forEach(update => {
        expect(update.widgetId).toBeDefined();
        expect(update.data).toBeDefined();
        expect(update.hasChanged).toBeDefined();
        expect(update.lastModified).toBeInstanceOf(Date);
      });
    });

    test('should handle empty widget list', async () => {
      const realtimeData = await biService.getRealtimeData({
        dashboardId: 'test-dashboard',
        widgets: [],
      });

      expect(realtimeData).toBeDefined();
      expect(realtimeData.updates).toEqual([]);
      expect(realtimeData.hasChanges).toBe(false);
    });
  });

  describe('Custom Report Builder', () => {
    test('should create custom report with table format', async () => {
      const customReport = await biService.createCustomReport({
        name: 'Sales Performance Report',
        description: 'Monthly sales performance analysis',
        dataSource: 'sales_orders',
        fields: [
          { field: 'orderNumber', label: 'Order Number', type: 'string' },
          { field: 'totalAmount', label: 'Total Amount', type: 'number', aggregation: 'sum' },
          { field: 'orderDate', label: 'Order Date', type: 'date' },
        ],
        filters: [
          { field: 'status', operator: 'eq', value: 'CONFIRMED' },
          { field: 'orderDate', operator: 'gte', value: '2024-01-01' },
        ],
        groupBy: ['customer'],
        sortBy: [{ field: 'totalAmount', direction: 'desc' }],
        format: 'table',
      });

      expect(customReport).toBeDefined();
      expect(customReport.id).toMatch(/^RPT_\d+$/);
      expect(customReport.name).toBe('Sales Performance Report');
      expect(customReport.description).toBe('Monthly sales performance analysis');
      expect(customReport.data).toBeInstanceOf(Array);
      expect(customReport.metadata).toBeDefined();
      expect(customReport.metadata.dataSource).toBe('sales_orders');
      expect(customReport.metadata.totalRows).toBeDefined();
      expect(customReport.metadata.executionTime).toBeDefined();
      expect(customReport.generatedAt).toBeInstanceOf(Date);
    });

    test('should create custom report with chart format', async () => {
      const customReport = await biService.createCustomReport({
        name: 'Production Trend Chart',
        dataSource: 'production_orders',
        fields: [
          { field: 'scheduledStartDate', label: 'Date', type: 'date' },
          { field: 'quantity', label: 'Quantity', type: 'number', aggregation: 'sum' },
        ],
        filters: [],
        groupBy: ['scheduledStartDate'],
        format: 'chart',
        chartType: 'line',
      });

      expect(customReport).toBeDefined();
      expect(customReport.name).toBe('Production Trend Chart');
      expect(customReport.metadata.dataSource).toBe('production_orders');
    });
  });

  describe('Access Control and Permissions', () => {
    test('should get user permissions for super admin', async () => {
      const permissions = await biService.getUserPermissions('user-123', 'super_admin');

      expect(permissions).toBeDefined();
      expect(permissions.dashboards).toContain('executive');
      expect(permissions.dashboards).toContain('production');
      expect(permissions.dashboards).toContain('sales');
      expect(permissions.dashboards).toContain('finance');
      expect(permissions.dashboards).toContain('hr');
      expect(permissions.dashboards).toContain('service');
      expect(permissions.canCreateReports).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.canViewAllBranches).toBe(true);
    });

    test('should get limited permissions for production manager', async () => {
      const permissions = await biService.getUserPermissions('user-456', 'production_manager');

      expect(permissions).toBeDefined();
      expect(permissions.dashboards).toEqual(['production']);
      expect(permissions.reports).toEqual(['production']);
      expect(permissions.kpis).toEqual(['production', 'quality']);
      expect(permissions.canCreateReports).toBe(false);
      expect(permissions.canExportData).toBe(false);
      expect(permissions.canViewAllBranches).toBe(false);
    });

    test('should get no permissions for unknown role', async () => {
      const permissions = await biService.getUserPermissions('user-789', 'unknown_role');

      expect(permissions).toBeDefined();
      expect(permissions.dashboards).toEqual([]);
      expect(permissions.reports).toEqual([]);
      expect(permissions.kpis).toEqual([]);
      expect(permissions.canCreateReports).toBe(false);
      expect(permissions.canExportData).toBe(false);
      expect(permissions.canViewAllBranches).toBe(false);
    });
  });

  describe('Executive Dashboard', () => {
    test('should get comprehensive executive dashboard', async () => {
      const executiveDashboard = await biService.getExecutiveDashboard('test-branch-id', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(executiveDashboard).toBeDefined();
      expect(executiveDashboard.period).toBeDefined();
      expect(executiveDashboard.summary).toBeDefined();
      expect(executiveDashboard.kpis).toBeInstanceOf(Array);
      expect(executiveDashboard.trends).toBeInstanceOf(Array);
      expect(executiveDashboard.alerts).toBeInstanceOf(Array);
      expect(executiveDashboard.recommendations).toBeInstanceOf(Array);

      // Check summary structure
      expect(executiveDashboard.summary.totalRevenue).toBeDefined();
      expect(executiveDashboard.summary.revenueGrowth).toBeDefined();
      expect(executiveDashboard.summary.totalOrders).toBeDefined();
      expect(executiveDashboard.summary.profitMargin).toBeDefined();

      // Check KPI structure
      executiveDashboard.kpis.forEach(kpi => {
        expect(kpi.name).toBeDefined();
        expect(kpi.value).toBeDefined();
        expect(kpi.target).toBeDefined();
        expect(kpi.achievement).toBeDefined();
        expect(['UP', 'DOWN', 'STABLE']).toContain(kpi.trend);
        expect(['high', 'medium', 'low']).toContain(kpi.priority);
        expect(['on_track', 'at_risk', 'behind']).toContain(kpi.status);
      });
    });
  });

  describe('Data Export', () => {
    test('should prepare dashboard export for authorized user', async () => {
      const exportData = await biService.exportDashboardData(
        'production-dashboard',
        'json',
        'user-123',
        'general_manager'
      );

      expect(exportData).toBeDefined();
      expect(exportData.downloadUrl).toMatch(/^\/api\/bi\/download\/EXP_/);
      expect(exportData.expiresAt).toBeInstanceOf(Date);
      expect(exportData.format).toBe('json');
      expect(exportData.size).toBeGreaterThan(0);
    });

    test('should reject export for unauthorized user', async () => {
      await expect(biService.exportDashboardData(
        'production-dashboard',
        'json',
        'user-456',
        'production_manager'
      )).rejects.toThrow('User does not have permission to export data');
    });
  });

  describe('Advanced Analytics', () => {
    test('should generate advanced analytics with correlations and predictions', async () => {
      const analytics = await biService.getAdvancedAnalytics(
        ['sales_revenue', 'production_volume', 'customer_satisfaction'],
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        'test-branch-id'
      );

      expect(analytics).toBeDefined();
      expect(analytics.correlations).toBeInstanceOf(Array);
      expect(analytics.anomalies).toBeInstanceOf(Array);
      expect(analytics.predictions).toBeInstanceOf(Array);
      expect(analytics.insights).toBeInstanceOf(Array);

      // Check correlations structure
      analytics.correlations.forEach(correlation => {
        expect(correlation.metric1).toBeDefined();
        expect(correlation.metric2).toBeDefined();
        expect(correlation.correlation).toBeGreaterThanOrEqual(-1);
        expect(correlation.correlation).toBeLessThanOrEqual(1);
      });

      // Check predictions structure
      analytics.predictions.forEach(prediction => {
        expect(prediction.metric).toBeDefined();
        expect(prediction.nextPeriodValue).toBeDefined();
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });

      // Check insights structure
      analytics.insights.forEach(insight => {
        expect(insight.type).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.impact).toBeDefined();
        expect(insight.recommendation).toBeDefined();
      });
    });
  });
});