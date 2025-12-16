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
  LocationOn,
  Notifications,
  AdminPanelSettings,
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
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCart />,
    path: '/sales',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: <Inventory />,
    path: '/inventory',
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: <ShoppingCart />,
    path: '/procurement',
  },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: <Assignment />,
    path: '/qc',
  },
  {
    id: 'service',
    label: 'Service',
    icon: <Build />,
    path: '/service',
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: <People />,
    children: [
      { id: 'employees', label: 'Employees', path: '/hr/employees' },
      { id: 'attendance', label: 'Attendance', path: '/hr/attendance' },
      { id: 'payroll', label: 'Payroll', path: '/hr/payroll' },
      { id: 'performance', label: 'Performance', path: '/hr/performance' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <AccountBalance />,
    children: [
      { id: 'invoices', label: 'Invoices', path: '/finance/invoices' },
      { id: 'payments', label: 'Payments', path: '/finance/payments' },
      { id: 'reports', label: 'Financial Reports', path: '/finance/reports' },
      { id: 'cost-analysis', label: 'Cost Analysis', path: '/finance/cost-analysis' },
    ],
  },
  {
    id: 'reports',
    label: 'Business Intelligence',
    icon: <Assessment />,
    children: [
      { id: 'dashboards', label: 'Dashboards', path: '/bi/dashboards' },
      { id: 'analytics', label: 'Analytics', path: '/bi/analytics' },
      { id: 'trends', label: 'Trend Analysis', path: '/bi/trends' },
    ],
  },
  {
    id: 'field',
    label: 'Field Operations',
    icon: <LocationOn />,
    children: [
      { id: 'geo-tagging', label: 'Geo Tagging', path: '/field/geo-tagging' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts & Notifications',
    icon: <Notifications />,
    path: '/alerts',
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
      <Box sx={{ display: 'flex', height: '100vh' }}>
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
            padding: theme.spacing(3),
            minHeight: 'calc(100vh - 64px)',
            transition: 'margin-left 0.3s ease',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </StyledThemeProvider>
  );
};

export default AppLayout;