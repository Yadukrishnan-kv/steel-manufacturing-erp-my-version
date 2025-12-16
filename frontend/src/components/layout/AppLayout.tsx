import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import type { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { useLogoutMutation } from '../../services/api';
import { ModernSidebar } from '../modern/Navigation/ModernSidebar';
import { ModernAppBar } from '../modern/Navigation/ModernAppBar';
import { MobileNavigationDrawer } from '../modern/Navigation/MobileNavigationDrawer';
import { useResponsiveNavigation } from '../modern/Navigation/useResponsiveNavigation';
import { NavigationItem } from '../modern/types';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import {
  Dashboard,
  Factory,
  Inventory,
  ShoppingCart,
  Assignment,
  Build,
  People,
  AccountBalance,
  Assessment,
  Notifications,
  AdminPanelSettings,
  Business,
  IntegrationInstructions,
  PersonOutline,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;

// Navigation items for ModernSidebar
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: <Factory />,
    path: '/manufacturing',
    children: [
      { id: 'bom-management', label: 'BOM Management', path: '/manufacturing/bom-management' },
      { id: 'work-center-management', label: 'Work Center Management', path: '/manufacturing/work-center-management' },
      { id: 'material-consumption', label: 'Material Consumption Tracking', path: '/manufacturing/material-consumption' },
      { id: 'scrap-tracking', label: 'Scrap Tracking', path: '/manufacturing/scrap-tracking' },
      { id: 'gantt-chart', label: 'Gantt Chart Visualization', path: '/manufacturing/gantt-chart' },
      { id: 'calendar-view', label: 'Calendar View', path: '/manufacturing/calendar-view' },
      { id: 'engineering-changes', label: 'Engineering Change Requests', path: '/manufacturing/engineering-changes' },
      { id: 'delivery-calculations', label: 'Delivery Date Calculations', path: '/manufacturing/delivery-calculations' },
      { id: 'production-rescheduling', label: 'Production Order Rescheduling', path: '/manufacturing/production-rescheduling' },
      { id: 'machine-schedule', label: 'Machine Schedule', path: '/manufacturing/machine-schedule' },
      { id: 'overtime-calculations', label: 'Overtime Calculations', path: '/manufacturing/overtime-calculations' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCart />,
    path: '/sales',
    children: [
      { id: 'lead-management', label: 'Lead Management', path: '/sales/lead-management' },
      { id: 'site-measurements', label: 'Site Measurements', path: '/sales/site-measurements' },
      { id: 'estimation-generation', label: 'Estimation Generation', path: '/sales/estimation-generation' },
      { id: 'discount-approval', label: 'Discount Approval Workflow', path: '/sales/discount-approval' },
      { id: 'customer-management', label: 'Customer Management', path: '/sales/customer-management' },
      { id: 'lead-status-updates', label: 'Lead Status Updates', path: '/sales/lead-status-updates' },
      { id: 'estimate-approval', label: 'Estimate Approval', path: '/sales/estimate-approval' },
      { id: 'sales-analytics', label: 'Sales Analytics', path: '/sales/sales-analytics' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Inventory />,
    path: '/inventory',
    children: [
      { id: 'multi-warehouse', label: 'Multi-warehouse Management', path: '/inventory/multi-warehouse' },
      { id: 'rack-bin-location', label: 'Rack/Bin Location Management', path: '/inventory/rack-bin-location' },
      { id: 'batch-lot-tracking', label: 'Batch/Lot Tracking', path: '/inventory/batch-lot-tracking' },
      { id: 'stock-transactions', label: 'Stock Transactions', path: '/inventory/stock-transactions' },
      { id: 'safety-stock', label: 'Safety Stock Monitoring', path: '/inventory/safety-stock' },
      { id: 'material-allocation', label: 'Order-wise Material Allocation', path: '/inventory/material-allocation' },
      { id: 'inter-branch-transfers', label: 'Inter-branch Stock Transfers', path: '/inventory/inter-branch-transfers' },
      { id: 'inventory-valuation', label: 'Inventory Valuation', path: '/inventory/inventory-valuation' },
      { id: 'cycle-counting', label: 'Cycle Counting', path: '/inventory/cycle-counting' },
      { id: 'goods-receipt', label: 'Goods Receipt Processing', path: '/inventory/goods-receipt' },
      { id: 'put-away', label: 'Put-away Management', path: '/inventory/put-away' },
      { id: 'stock-inquiry', label: 'Stock Inquiry and Reporting', path: '/inventory/stock-inquiry' },
      { id: 'aging-reports', label: 'Inventory Aging Reports', path: '/inventory/aging-reports' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCart />,
    path: '/procurement',
    children: [
      { id: 'purchase-requisition', label: 'Purchase Requisition Management', path: '/procurement/purchase-requisition' },
      { id: 'automatic-pr', label: 'Automatic PR Generation', path: '/procurement/automatic-pr' },
      { id: 'rfq-management', label: 'RFQ Management', path: '/procurement/rfq-management' },
      { id: 'supplier-evaluation', label: 'Supplier Evaluation', path: '/procurement/supplier-evaluation' },
      { id: 'purchase-order', label: 'Purchase Order Management', path: '/procurement/purchase-order' },
      { id: 'grn-processing', label: 'GRN Processing', path: '/procurement/grn-processing' },
      { id: 'transfer-requests', label: 'Inter-branch Transfer Requests', path: '/procurement/transfer-requests' },
      { id: 'procurement-dashboard', label: 'Procurement Dashboard', path: '/procurement/procurement-dashboard' },
      { id: 'supplier-performance', label: 'Supplier Performance Reports', path: '/procurement/supplier-performance' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: <Assignment />,
    path: '/qc',
    children: [
      { id: 'qc-checklists', label: 'Stage-specific QC Checklists', path: '/qc/qc-checklists' },
      { id: 'inspector-assignment', label: 'QC Inspector Assignment', path: '/qc/inspector-assignment' },
      { id: 'inspection-recording', label: 'QC Inspection Recording', path: '/qc/inspection-recording' },
      { id: 'rework-job-cards', label: 'Rework Job Card Generation', path: '/qc/rework-job-cards' },
      { id: 'qc-analytics', label: 'QC Analytics', path: '/qc/qc-analytics' },
      { id: 'qc-reports', label: 'QC Report Generation', path: '/qc/qc-reports' },
      { id: 'qc-delivery-linking', label: 'QC-Delivery Linking', path: '/qc/qc-delivery-linking' },
      { id: 'inspector-workload', label: 'Inspector Workload Management', path: '/qc/inspector-workload' },
      { id: 'production-qc-status', label: 'Production Order QC Status', path: '/qc/production-qc-status' },
      { id: 'customer-requirements', label: 'Customer Requirements Integration', path: '/qc/customer-requirements' },
      { id: 'qc-certificates', label: 'QC Certificate Generation', path: '/qc/qc-certificates' },
      { id: 'customer-approval', label: 'Customer Approval Workflows', path: '/qc/customer-approval' },
      { id: 'qc-dashboard', label: 'QC Dashboard', path: '/qc/qc-dashboard' },
      { id: 'production-integration', label: 'Production Integration', path: '/qc/production-integration' },
    ],
  },
  {
    id: 'service',
    label: 'Service',
    icon: <Build />,
    path: '/service',
    children: [
      { id: 'technician-assignment', label: 'Technician Assignment', path: '/service/technician-assignment' },
      { id: 'amc-contracts', label: 'AMC Contract Management', path: '/service/amc-contracts' },
      { id: 'warranty-validation', label: 'Warranty Validation', path: '/service/warranty-validation' },
      { id: 'installation-scheduling', label: 'Installation Scheduling', path: '/service/installation-scheduling' },
      { id: 'rma-management', label: 'RMA Management', path: '/service/rma-management' },
      { id: 'service-completion', label: 'Service Completion', path: '/service/service-completion' },
      { id: 'performance-metrics', label: 'Service Performance Metrics', path: '/service/performance-metrics' },
      { id: 'cost-breakdown', label: 'Service Cost Breakdown', path: '/service/cost-breakdown' },
      { id: 'invoice-generation', label: 'Service Invoice Generation', path: '/service/invoice-generation' },
      { id: 'mobile-integration', label: 'Mobile App Integration', path: '/service/mobile-integration' },
      { id: 'parts-inventory', label: 'Service Parts Inventory', path: '/service/parts-inventory' },
      { id: 'service-analytics', label: 'Service Analytics', path: '/service/service-analytics' },
    ],
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: <People />,
    children: [
      { id: 'employee-master', label: 'Employee Master Data', path: '/hr/employee-master' },
      { id: 'biometric-attendance', label: 'Biometric Attendance', path: '/hr/biometric-attendance' },
      { id: 'geo-attendance', label: 'Geo-tagged Attendance', path: '/hr/geo-attendance' },
      { id: 'attendance-reports', label: 'Attendance Reports', path: '/hr/attendance-reports' },
      { id: 'overtime-calculations', label: 'Overtime Calculations', path: '/hr/overtime-calculations' },
      { id: 'payroll-management', label: 'Payroll Management', path: '/hr/payroll-management' },
      { id: 'kpi-management', label: 'KPI Management', path: '/hr/kpi-management' },
      { id: 'leave-management', label: 'Leave Management', path: '/hr/leave-management' },
      { id: 'leave-balance', label: 'Leave Balance Tracking', path: '/hr/leave-balance' },
      { id: 'performance-reviews', label: 'Performance Reviews', path: '/hr/performance-reviews' },
      { id: 'self-assessment', label: 'Self-assessment', path: '/hr/self-assessment' },
      { id: 'appraisal-management', label: 'Appraisal Management', path: '/hr/appraisal-management' },
      { id: 'promotion-processing', label: 'Promotion Processing', path: '/hr/promotion-processing' },
      { id: 'incentive-management', label: 'Incentive Management', path: '/hr/incentive-management' },
      { id: 'organizational-hierarchy', label: 'Organizational Hierarchy', path: '/hr/organizational-hierarchy' },
      { id: 'training-programs', label: 'Training Programs', path: '/hr/training-programs' },
      { id: 'training-enrollments', label: 'Training Enrollments', path: '/hr/training-enrollments' },
      { id: 'performance-analytics', label: 'Performance Analytics', path: '/hr/performance-analytics' },
    ],
  },
  {
    id: 'employee-portal',
    label: 'Employee Portal',
    icon: <PersonOutline />,
    children: [
      { id: 'employee-dashboard', label: 'Employee Dashboard', path: '/employee-portal/employee-dashboard' },
      { id: 'profile-management', label: 'Profile Management', path: '/employee-portal/profile-management' },
      { id: 'attendance-tracking', label: 'Attendance Tracking', path: '/employee-portal/attendance-tracking' },
      { id: 'leave-requests', label: 'Leave Requests', path: '/employee-portal/leave-requests' },
      { id: 'payroll-access', label: 'Payroll Access', path: '/employee-portal/payroll-access' },
      { id: 'performance-reviews', label: 'Performance Reviews', path: '/employee-portal/performance-reviews' },
      { id: 'training-management', label: 'Training Management', path: '/employee-portal/training-management' },
      { id: 'employee-directory', label: 'Employee Directory', path: '/employee-portal/employee-directory' },
      { id: 'document-management', label: 'Document Management', path: '/employee-portal/document-management' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <AccountBalance />,
    children: [
      { id: 'accounts-receivable', label: 'Accounts Receivable', path: '/finance/accounts-receivable' },
      { id: 'accounts-payable', label: 'Accounts Payable', path: '/finance/accounts-payable' },
      { id: 'tax-calculations', label: 'Tax Calculations', path: '/finance/tax-calculations' },
      { id: 'pl-reporting', label: 'P&L Reporting', path: '/finance/pl-reporting' },
      { id: 'cash-flow-forecasting', label: 'Cash Flow Forecasting', path: '/finance/cash-flow-forecasting' },
      { id: 'manufacturing-cost-analysis', label: 'Manufacturing Cost Analysis', path: '/finance/manufacturing-cost-analysis' },
      { id: 'credit-management', label: 'Credit Management', path: '/finance/credit-management' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', path: '/finance/bank-reconciliation' },
      { id: 'collection-analysis', label: 'Collection Analysis', path: '/finance/collection-analysis' },
    ],
  },
  {
    id: 'supplier-management',
    label: 'Supplier Management',
    icon: <Business />,
    children: [
      { id: 'supplier-master', label: 'Supplier Master Data', path: '/supplier/supplier-master' },
      { id: 'vendor-performance', label: 'Vendor Performance Tracking', path: '/supplier/vendor-performance' },
      { id: 'quote-comparison', label: 'Quote Comparison', path: '/supplier/quote-comparison' },
      { id: 'payment-terms', label: 'Payment Terms Management', path: '/supplier/payment-terms' },
      { id: 'communication-logging', label: 'Communication Logging', path: '/supplier/communication-logging' },
      { id: 'document-management', label: 'Document Management', path: '/supplier/document-management' },
      { id: 'vendor-portal', label: 'Vendor Portal Integration', path: '/supplier/vendor-portal' },
      { id: 'supplier-reports', label: 'Supplier Reports', path: '/supplier/supplier-reports' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alert Management',
    icon: <Notifications />,
    children: [
      { id: 'sla-configuration', label: 'SLA Configuration', path: '/alerts/sla-configuration' },
      { id: 'alert-creation', label: 'Alert Creation', path: '/alerts/alert-creation' },
      { id: 'notification-management', label: 'Notification Management', path: '/alerts/notification-management' },
      { id: 'escalation-processing', label: 'Escalation Processing', path: '/alerts/escalation-processing' },
      { id: 'reminder-generation', label: 'Reminder Generation', path: '/alerts/reminder-generation' },
      { id: 'sla-performance', label: 'SLA Performance Metrics', path: '/alerts/sla-performance' },
    ],
  },
  {
    id: 'reports',
    label: 'Business Intelligence',
    icon: <Assessment />,
    children: [
      { id: 'role-dashboards', label: 'Role-based Dashboards', path: '/bi/role-dashboards' },
      { id: 'trend-analysis', label: 'Trend Analysis', path: '/bi/trend-analysis' },
      { id: 'drill-down-reporting', label: 'Drill-down Reporting', path: '/bi/drill-down-reporting' },
      { id: 'real-time-updates', label: 'Real-time Data Updates', path: '/bi/real-time-updates' },
      { id: 'custom-report-builder', label: 'Custom Report Builder', path: '/bi/custom-report-builder' },
      { id: 'executive-dashboards', label: 'Executive Dashboards', path: '/bi/executive-dashboards' },
      { id: 'advanced-analytics', label: 'Advanced Analytics', path: '/bi/advanced-analytics' },
      { id: 'data-export', label: 'Data Export', path: '/bi/data-export' },
    ],
  },
  {
    id: 'integrations',
    label: 'External Integrations',
    icon: <IntegrationInstructions />,
    children: [
      { id: 'meta-lead-sync', label: 'Meta/Facebook Lead Sync', path: '/integrations/meta-lead-sync' },
      { id: 'google-ads', label: 'Google Ads Integration', path: '/integrations/google-ads' },
      { id: 'whatsapp-notifications', label: 'WhatsApp Notifications', path: '/integrations/whatsapp-notifications' },
      { id: 'communication-management', label: 'Communication Management', path: '/integrations/communication-management' },
      { id: 'lead-scoring', label: 'Lead Scoring', path: '/integrations/lead-scoring' },
      { id: 'integration-statistics', label: 'Integration Statistics', path: '/integrations/integration-statistics' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <AdminPanelSettings />,
    children: [
      { id: 'users', label: 'User Management', path: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', path: '/admin/users' },
    ],
  },
];

const AppLayout: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  // Use responsive navigation hook for modern navigation behavior
  const {
    isMobile,
    sidebarCollapsed,
    mobileDrawerOpen,
    toggleSidebarCollapse,
    toggleMobileDrawer,
    closeMobileDrawer,
  } = useResponsiveNavigation({
    defaultCollapsed: false,
    persistCollapsedState: true,
    storageKey: 'steelforge-sidebar-collapsed',
  });

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Handle logout error if needed
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleNavigationClick = (item: NavigationItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  // Mark active navigation items based on current location
  const getNavigationItemsWithActiveState = (items: NavigationItem[]): NavigationItem[] => {
    return items.map(item => ({
      ...item,
      active: item.path === location.pathname,
      children: item.children ? getNavigationItemsWithActiveState(item.children) : undefined,
    }));
  };

  const activeNavigationItems = getNavigationItemsWithActiveState(navigationItems);

  return (
    <StyledThemeProvider theme={theme as any}>
      <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
        {/* Modern App Bar */}
        <ModernAppBar
          title="SteelForge Manufacturing ERP"
          user={user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          } : undefined}
          sidebarWidth={DRAWER_WIDTH}
          sidebarCollapsed={sidebarCollapsed}
          sidebarCollapsedWidth={64}
          showSearch={true}
          showNotifications={true}
          showThemeToggle={true}
          notificationCount={0}
          onMobileMenuClick={toggleMobileDrawer}
          onProfileClick={handleProfile}
          onSettingsClick={handleSettings}
          onLogout={handleLogout}
        />

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            component="nav"
            sx={{ 
              width: sidebarCollapsed ? 64 : DRAWER_WIDTH,
              flexShrink: 0,
              position: 'fixed',
              left: 0,
              top: 0,
              height: '100vh',
              zIndex: theme.zIndex.drawer,
            }}
          >
            <ModernSidebar
              items={activeNavigationItems}
              collapsed={sidebarCollapsed}
              onItemClick={handleNavigationClick}
              onToggleCollapse={toggleSidebarCollapse}
              width={DRAWER_WIDTH}
              collapsedWidth={64}
            />
          </Box>
        )}

        {/* Mobile Navigation Drawer */}
        <MobileNavigationDrawer
          open={mobileDrawerOpen}
          onClose={closeMobileDrawer}
          items={activeNavigationItems}
          onItemClick={handleNavigationClick}
        />

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            marginLeft: isMobile ? 0 : (sidebarCollapsed ? '64px' : `${DRAWER_WIDTH}px`),
            marginTop: '64px', // AppBar height
            padding: 0, // Remove all padding to allow full width utilization
            minHeight: 'calc(100vh - 64px)',
            transition: 'margin-left 0.3s ease',
            backgroundColor: theme.palette.background.default,
            // Remove explicit width to let flexGrow handle it
            overflow: 'auto', // Allow scrolling if needed
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </StyledThemeProvider>
  );
};

export default AppLayout;