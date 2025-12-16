/**
 * Navigation Components Demo
 * Demonstrates how to use the modern navigation components together
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
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
  Security,
} from '@mui/icons-material';
import { ModernSidebar } from './ModernSidebar';
import { ModernAppBar } from './ModernAppBar';
import { MobileNavigationDrawer } from './MobileNavigationDrawer';
import { useResponsiveNavigation } from './useResponsiveNavigation';
import { NavigationItem } from '../types';

// Demo container
const DemoContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => theme.palette.background.default};
`;

// Main content area
const MainContent = styled.main<{
  $sidebarWidth: number;
  $sidebarCollapsed: boolean;
  $sidebarCollapsedWidth: number;
  $isMobile: boolean;
  theme: any;
}>`
  flex: 1;
  margin-left: ${({ $isMobile, $sidebarCollapsed, $sidebarWidth, $sidebarCollapsedWidth }) => 
    $isMobile ? '0' : ($sidebarCollapsed ? `${$sidebarCollapsedWidth}px` : `${$sidebarWidth}px`)};
  margin-top: 64px;
  padding: ${({ theme }) => theme.spacing(3)};
  transition: margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
`;

// Demo content
const DemoContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const DemoTitle = styled.h1<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.palette.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing(3)};
`;

const DemoSection = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const DemoSectionTitle = styled.h2<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.palette.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

// Mock navigation items
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    active: true,
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
    badge: 3,
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
    badge: 12,
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <AdminPanelSettings />,
    children: [
      { id: 'users', label: 'User Management', path: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', path: '/admin/roles' },
    ],
  },
];

// Mock user data
const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@steelerp.com',
  role: 'System Administrator',
};

// Mock breadcrumbs
const mockBreadcrumbs = [
  { label: 'Dashboard' },
  { label: 'Manufacturing' },
  { label: 'Production Orders', active: true },
];

/**
 * Navigation Demo Component
 * 
 * Demonstrates the complete navigation system with:
 * - Responsive sidebar with collapse functionality
 * - Modern app bar with user menu and actions
 * - Mobile navigation drawer
 * - Smooth animations and transitions
 */
export const NavigationDemo: React.FC = () => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  
  // Use the responsive navigation hook
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
  });

  // Handle navigation item clicks
  const handleNavigationClick = (item: NavigationItem) => {
    console.log('Navigate to:', item.path);
    setCurrentPage(item.label);
    
    // Close mobile drawer after navigation
    if (isMobile) {
      closeMobileDrawer();
    }
  };

  // Handle app bar actions
  const handleSearch = () => {
    console.log('Search clicked');
  };

  const handleNotifications = () => {
    console.log('Notifications clicked');
  };

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked');
  };

  const handleProfile = () => {
    console.log('Profile clicked');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  return (
    <DemoContainer theme={theme}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <ModernSidebar
          items={navigationItems}
          collapsed={sidebarCollapsed}
          onItemClick={handleNavigationClick}
          onToggleCollapse={toggleSidebarCollapse}
          width={280}
          collapsedWidth={64}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <MobileNavigationDrawer
        open={mobileDrawerOpen}
        onClose={closeMobileDrawer}
        items={navigationItems}
        onItemClick={handleNavigationClick}
      />

      {/* App Bar */}
      <ModernAppBar
        breadcrumbs={mockBreadcrumbs}
        user={mockUser}
        sidebarWidth={280}
        sidebarCollapsed={sidebarCollapsed}
        sidebarCollapsedWidth={64}
        notificationCount={5}
        onMobileMenuClick={toggleMobileDrawer}
        onSearchClick={handleSearch}
        onNotificationsClick={handleNotifications}
        onThemeToggle={handleThemeToggle}
        onProfileClick={handleProfile}
        onSettingsClick={handleSettings}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <MainContent
        $sidebarWidth={280}
        $sidebarCollapsed={sidebarCollapsed}
        $sidebarCollapsedWidth={64}
        $isMobile={isMobile}
        theme={theme}
      >
        <DemoContent>
          <DemoTitle theme={theme}>
            Modern Navigation System Demo
          </DemoTitle>
          
          <DemoSection theme={theme}>
            <DemoSectionTitle theme={theme}>
              Current Page: {currentPage}
            </DemoSectionTitle>
            <p>
              This demo showcases the modern navigation components with responsive design,
              smooth animations, and professional styling inspired by Procore.
            </p>
          </DemoSection>

          <DemoSection theme={theme}>
            <DemoSectionTitle theme={theme}>
              Features Demonstrated
            </DemoSectionTitle>
            <ul>
              <li>Collapsible sidebar with icon-only mode</li>
              <li>Responsive mobile navigation drawer</li>
              <li>Modern app bar with user menu and actions</li>
              <li>Smooth animations and transitions</li>
              <li>Tooltip support for collapsed sidebar items</li>
              <li>Nested navigation with expand/collapse</li>
              <li>Badge support for notifications</li>
              <li>Breadcrumb navigation</li>
              <li>Theme-aware styling</li>
              <li>Accessibility compliance</li>
            </ul>
          </DemoSection>

          <DemoSection theme={theme}>
            <DemoSectionTitle theme={theme}>
              Responsive Behavior
            </DemoSectionTitle>
            <p>
              The navigation system automatically adapts to different screen sizes:
            </p>
            <ul>
              <li><strong>Desktop:</strong> Full sidebar with collapse functionality</li>
              <li><strong>Tablet:</strong> Auto-collapsed sidebar for more content space</li>
              <li><strong>Mobile:</strong> Hidden sidebar with mobile drawer overlay</li>
            </ul>
          </DemoSection>

          <DemoSection theme={theme}>
            <DemoSectionTitle theme={theme}>
              Try It Out
            </DemoSectionTitle>
            <p>
              Try the following interactions:
            </p>
            <ul>
              <li>Click the collapse button to toggle sidebar width</li>
              <li>Hover over collapsed sidebar items to see tooltips</li>
              <li>Click on items with children to expand/collapse them</li>
              <li>Resize your browser window to see responsive behavior</li>
              <li>Click the user avatar to open the user menu</li>
              <li>Try the search, notifications, and theme toggle buttons</li>
            </ul>
          </DemoSection>
        </DemoContent>
      </MainContent>
    </DemoContainer>
  );
};

export default NavigationDemo;