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

// Navigation items for ModernSidebar - Ordered by implementation dependencies and complexity
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  
  // PHASE 1: FOUNDATION MODULES (Complete - No Dependencies)
  {
    id: 'admin',
    label: 'Administration',
    icon: <AdminPanelSettings />,
    path: '/admin',
    children: [
      { id: 'branches', label: 'Branch Management', path: '/admin/branches' },
      { id: 'users', label: 'User Management', path: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', path: '/admin/roles' },
    ],
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: <Factory />,
    path: '/manufacturing',
    children: [
      { id: 'manufacturing-dashboard', label: 'Manufacturing Dashboard', path: '/manufacturing' },
      // Foundation modules (Complete - No dependencies)
      { id: 'work-center-management', label: 'Work Center Management', path: '/manufacturing/work-center-management' },
      { id: 'bom-management', label: 'BOM Management', path: '/manufacturing/bom-management' },
      { id: 'production-orders', label: 'Production Orders', path: '/manufacturing/production-orders' },
      // Dependent modules (Backend Ready - Depends on above)
      { id: 'material-consumption', label: 'Material Consumption', path: '/manufacturing/material-consumption' },
      { id: 'scrap-tracking', label: 'Scrap Tracking', path: '/manufacturing/scrap-tracking' },
      { id: 'gantt-chart', label: 'Production Schedule', path: '/manufacturing/gantt-chart' },
      { id: 'engineering-changes', label: 'Engineering Changes', path: '/manufacturing/engineering-changes' },
    ],
  },
  
  // PHASE 2: CORE BUSINESS MODULES (High Priority)
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCart />,
    path: '/sales',
    children: [
      { id: 'sales-dashboard', label: 'Sales Dashboard', path: '/sales/dashboard' },
      // Foundation modules (Partial Frontend - High Priority)
      { id: 'customers', label: 'Customer Management', path: '/sales/customers' },
      { id: 'lead-management', label: 'Lead Management', path: '/sales/lead-management' },
      { id: 'estimates', label: 'Estimates', path: '/sales/estimates' },
      { id: 'sales-orders', label: 'Sales Orders', path: '/sales/orders' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'site-measurements', label: 'Site Measurements', path: '/sales/site-measurements' },
      { id: 'discount-approval', label: 'Discount Approval', path: '/sales/discount-approval' },
      { id: 'analytics', label: 'Sales Analytics', path: '/sales/analytics' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Inventory />,
    path: '/inventory',
    children: [
      // Foundation modules (Backend Ready - High Priority)
      { id: 'inventory-items', label: 'Inventory Items', path: '/inventory/items' },
      { id: 'stock-levels', label: 'Stock Levels', path: '/inventory/stock-levels' },
      { id: 'stock-transactions', label: 'Stock Transactions', path: '/inventory/stock-transactions' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'location-management', label: 'Location Management', path: '/inventory/location-management' },
      { id: 'batch-tracking', label: 'Batch/Lot Tracking', path: '/inventory/batch-tracking' },
      { id: 'material-allocation', label: 'Material Allocation', path: '/inventory/material-allocation' },
      { id: 'safety-stock', label: 'Safety Stock Alerts', path: '/inventory/safety-stock' },
      { id: 'inter-branch-transfers', label: 'Inter-branch Transfers', path: '/inventory/inter-branch-transfers' },
      // Advanced modules (Backend Ready - Low Priority)
      { id: 'barcode-scanning', label: 'Barcode Scanning', path: '/inventory/barcode-scanning' },
      { id: 'inventory-valuation', label: 'Inventory Valuation', path: '/inventory/inventory-valuation' },
    ],
  },
  
  // PHASE 3: OPERATIONAL MODULES (Medium Priority)
  {
    id: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCart />,
    path: '/procurement',
    children: [
      // Core procurement (Backend Ready - High Priority)
      { id: 'purchase-requisitions', label: 'Purchase Requisitions', path: '/procurement/purchase-requisitions' },
      { id: 'rfq-management', label: 'RFQ Management', path: '/procurement/rfq-management' },
      { id: 'purchase-orders', label: 'Purchase Orders', path: '/procurement/purchase-orders' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'supplier-evaluation', label: 'Supplier Evaluation', path: '/procurement/supplier-evaluation' },
      { id: 'grn-processing', label: 'GRN Processing', path: '/procurement/grn-processing' },
    ],
  },
  {
    id: 'suppliers',
    label: 'Supplier Management',
    icon: <Business />,
    path: '/suppliers',
    children: [
      // Foundation (Backend Ready - High Priority)
      { id: 'supplier-master', label: 'Supplier Master', path: '/suppliers/master' },
      { id: 'vendor-performance', label: 'Vendor Performance', path: '/suppliers/performance' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'quote-comparison', label: 'Quote Comparison', path: '/suppliers/quote-comparison' },
      { id: 'payment-terms', label: 'Payment Terms', path: '/suppliers/payment-terms' },
      // Advanced modules (Backend Ready - Low Priority)
      { id: 'communication-logging', label: 'Communication Log', path: '/suppliers/communications' },
      { id: 'document-management', label: 'Document Management', path: '/suppliers/documents' },
      { id: 'vendor-portal', label: 'Vendor Portal', path: '/suppliers/vendor-portal' },
    ],
  },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: <Assignment />,
    path: '/qc',
    children: [
      // Core QC (Backend Ready - High Priority)
      { id: 'qc-inspections', label: 'QC Inspections', path: '/qc/inspections' },
      { id: 'inspection-checklists', label: 'Inspection Checklists', path: '/qc/checklists' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'rework-management', label: 'Rework Management', path: '/qc/rework-management' },
      { id: 'qc-reports', label: 'QC Reports', path: '/qc/reports' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <AccountBalance />,
    path: '/finance',
    children: [
      // Core finance (High Priority)
      { id: 'invoices', label: 'Invoice Management', path: '/finance/invoices' },
      { id: 'accounts-receivable', label: 'Accounts Receivable', path: '/finance/accounts-receivable' },
      { id: 'payments', label: 'Payment Management', path: '/finance/payments' },
      // Supporting modules (Backend Ready - Medium Priority)
      { id: 'tax-calculations', label: 'Tax Calculations', path: '/finance/tax-calculations' },
      { id: 'pl-reporting', label: 'P&L Reporting', path: '/finance/pl-reporting' },
      // Advanced modules (Backend Ready - Low Priority)
      { id: 'cash-flow-forecasting', label: 'Cash Flow Forecasting', path: '/finance/cash-flow-forecasting' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', path: '/finance/bank-reconciliation' },
    ],
  },
  
  // PHASE 4: SERVICE & SUPPORT MODULES (Medium Priority)
  {
    id: 'service',
    label: 'Service',
    icon: <Build />,
    path: '/service',
    children: [
      // Core service (Backend Ready - High Priority)
      { id: 'service-requests', label: 'Service Requests', path: '/service/requests' },
      { id: 'technician-assignment', label: 'Technician Assignment', path: '/service/technician-assignment' },
      // Contract management (Backend Ready - Medium Priority)
      { id: 'amc-contracts', label: 'AMC Contracts', path: '/service/amc-contracts' },
      { id: 'warranty-validation', label: 'Warranty Validation', path: '/service/warranty-validation' },
      { id: 'installation-scheduling', label: 'Installation Scheduling', path: '/service/installation-scheduling' },
      { id: 'rma-management', label: 'RMA Management', path: '/service/rma-management' },
      { id: 'service-completion', label: 'Service Completion', path: '/service/service-completion' },
      // Analytics & mobile (Backend Ready - Low Priority)
      { id: 'performance-metrics', label: 'Performance Metrics', path: '/service/performance-metrics' },
      { id: 'cost-breakdown', label: 'Cost Breakdown', path: '/service/cost-breakdown' },
      { id: 'mobile-sync', label: 'Mobile Sync', path: '/service/mobile-sync' },
    ],
  },
  
  // PHASE 5: HR & EMPLOYEE MODULES (Medium Priority)
  {
    id: 'hr',
    label: 'Human Resources',
    icon: <People />,
    path: '/hr',
    children: [
      // Core HR (Partial Frontend - High Priority)
      { id: 'employee-master', label: 'Employee Management', path: '/hr/employee-master' },
      // Attendance & payroll (Backend Ready - Medium Priority)
      { id: 'biometric-attendance', label: 'Biometric Attendance', path: '/hr/biometric-attendance' },
      { id: 'geo-attendance', label: 'Geo-tagged Attendance', path: '/hr/geo-attendance' },
      { id: 'payroll-management', label: 'Payroll Management', path: '/hr/payroll-management' },
      { id: 'leave-management', label: 'Leave Management', path: '/hr/leave-management' },
      // Performance management (Backend Ready - Low Priority)
      { id: 'kpi-management', label: 'KPI Management', path: '/hr/kpi-management' },
      { id: 'performance-reviews', label: 'Performance Reviews', path: '/hr/performance-reviews' },
    ],
  },
  {
    id: 'employee-portal',
    label: 'Employee Portal',
    icon: <PersonOutline />,
    path: '/employee-portal',
    children: [
      // Core portal (Backend Ready - Medium Priority)
      { id: 'employee-dashboard', label: 'Employee Dashboard', path: '/employee-portal/dashboard' },
      { id: 'profile-management', label: 'Profile Management', path: '/employee-portal/profile' },
      { id: 'attendance-tracking', label: 'Attendance Tracking', path: '/employee-portal/attendance' },
      { id: 'leave-requests', label: 'Leave Requests', path: '/employee-portal/leave-requests' },
      // Advanced portal (Backend Ready - Low Priority)
      { id: 'payroll-access', label: 'Payroll Access', path: '/employee-portal/payroll' },
      { id: 'performance-reviews', label: 'Performance Reviews', path: '/employee-portal/performance' },
    ],
  },
  
  // PHASE 6: ANALYTICS & SYSTEM MODULES (Low Priority)
  {
    id: 'reports',
    label: 'Business Intelligence',
    icon: <Assessment />,
    path: '/bi',
    children: [
      // Core BI (Backend Ready - Medium Priority)
      { id: 'role-dashboards', label: 'Role-based Dashboards', path: '/bi/dashboards' },
      { id: 'custom-reports', label: 'Custom Reports', path: '/bi/custom-reports' },
      // Advanced analytics (Backend Ready - Low Priority)
      { id: 'trend-analysis', label: 'Trend Analysis', path: '/bi/trends' },
      { id: 'drill-down-reporting', label: 'Drill-down Reports', path: '/bi/drill-down' },
      { id: 'real-time-updates', label: 'Real-time Data', path: '/bi/real-time' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alert Management',
    icon: <Notifications />,
    path: '/alerts',
    children: [
      // Core alerts (Backend Ready - Medium Priority)
      { id: 'alert-management', label: 'Alert Management', path: '/alerts/management' },
      { id: 'notification-management', label: 'Notifications', path: '/alerts/notifications' },
      // Advanced alerts (Backend Ready - Low Priority)
      { id: 'sla-configuration', label: 'SLA Configuration', path: '/alerts/sla-configuration' },
      { id: 'escalation-processing', label: 'Escalation Processing', path: '/alerts/escalation' },
    ],
  },
  {
    id: 'integrations',
    label: 'External Integrations',
    icon: <IntegrationInstructions />,
    path: '/integrations',
    children: [
      // Core integrations (Backend Ready - Low Priority)
      { id: 'communication-management', label: 'Communication Management', path: '/integrations/communications' },
      { id: 'whatsapp-notifications', label: 'WhatsApp Notifications', path: '/integrations/whatsapp' },
      // Marketing integrations (Backend Ready - Low Priority)
      { id: 'meta-lead-sync', label: 'Meta Lead Sync', path: '/integrations/meta-sync' },
      { id: 'google-ads', label: 'Google Ads Integration', path: '/integrations/google-ads' },
      { id: 'lead-scoring', label: 'Lead Scoring', path: '/integrations/lead-scoring' },
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