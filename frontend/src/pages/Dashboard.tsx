import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import {
  Factory,
  ShoppingCart,
  Inventory,
  Assignment,
  TrendingUp,
  People,
  Warning,
  CheckCircle,
  Schedule,
  AttachMoney,
  Notifications,
  Speed,
} from '@mui/icons-material';
import type { RootState } from '../store/store';
import { 
  useGetDashboardDataQuery,
  useGetFinanceDashboardQuery,
  useGetBIDashboardQuery,
  useGetAlertsQuery,
} from '../services/api';
import { ModernDashboardCard } from '../components/modern/Dashboard/ModernDashboardCard';
import { ModernGrid } from '../components/modern/Dashboard/ModernGrid';
import { ModernChart } from '../components/modern/Dashboard/ModernChart';
import { ModernDataTable } from '../components/modern/Dashboard/ModernDataTable';
import { ModernAlert } from '../components/modern/Alert/ModernAlert';


// Compact dashboard container with minimal padding
const DashboardContainer = styled.div<{
  theme: any;
}>`
  padding: ${({ theme }) => theme.custom.spacing[3]};
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
  min-height: 100vh;
  transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Compact dashboard header
const DashboardHeader = styled.div<{
  theme: any;
}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.custom.spacing[4]};
  padding: ${({ theme }) => theme.custom.spacing[3]} ${({ theme }) => theme.custom.spacing[4]};
  background-color: ${({ theme }) => theme.custom.colors.neutral.white};
  border-radius: ${({ theme }) => theme.custom.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.custom.shadows.sm};
  animation: slideInFromTop 0.6s ease-out 0.1s both;
  
  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const HeaderLeft = styled.div<{
  theme: any;
}>`
  display: flex;
  flex-direction: column;
`;

const DashboardTitle = styled.h1<{
  theme: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.tight};
`;

const DashboardSubtitle = styled.p<{
  theme: any;
}>`
  margin: 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.normal};
`;

const HeaderRight = styled.div<{
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[4]};
`;

const StatusIndicator = styled.div<{
  $status: 'online' | 'warning' | 'error';
  theme: any;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[2]};
  padding: ${({ theme }) => theme.custom.spacing[2]} ${({ theme }) => theme.custom.spacing[3]};
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  font-size: ${({ theme }) => theme.custom.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.medium};
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'online':
        return `
          background-color: ${theme.custom.colors.semantic.success[100]};
          color: ${theme.custom.colors.semantic.success[700]};
        `;
      case 'warning':
        return `
          background-color: ${theme.custom.colors.semantic.warning[100]};
          color: ${theme.custom.colors.semantic.warning[700]};
        `;
      case 'error':
        return `
          background-color: ${theme.custom.colors.semantic.error[100]};
          color: ${theme.custom.colors.semantic.error[700]};
        `;
      default:
        return '';
    }
  }}
`;

// Compact section headers
const SectionHeader = styled.h2<{
  theme: any;
}>`
  margin: ${({ theme }) => theme.custom.spacing[4]} 0 ${({ theme }) => theme.custom.spacing[2]} 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.tight};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.custom.spacing[2]};
  
  &::before {
    content: '';
    width: 4px;
    height: 20px;
    background-color: ${({ theme }) => theme.custom.colors.primary[500]};
    border-radius: 2px;
  }
`;

// Compact card for smaller metrics
const CompactMetricCard = styled.div<{
  theme: any;
}>`
  background-color: ${({ theme }) => theme.custom.colors.neutral.white};
  border-radius: ${({ theme }) => theme.custom.borderRadius.md};
  padding: ${({ theme }) => theme.custom.spacing[3]};
  box-shadow: ${({ theme }) => theme.custom.shadows.sm};
  border: 1px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: ${({ theme }) => theme.custom.shadows.md};
    transform: translateY(-1px);
  }
`;

const MetricValue = styled.div<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
  margin-bottom: ${({ theme }) => theme.custom.spacing[1]};
`;

const MetricLabel = styled.div<{
  theme: any;
}>`
  font-size: ${({ theme }) => theme.custom.typography.fontSize.xs};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Two-column layout for better space utilization
const TwoColumnLayout = styled.div<{
  theme: any;
}>`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.custom.spacing[4]};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div<{
  theme: any;
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.custom.spacing[4]};
`;

const Sidebar = styled.div<{
  theme: any;
}>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.custom.spacing[4]};
`;

// Loading container
const LoadingContainer = styled.div<{
  theme: any;
}>`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.custom.spacing[12]};
`;

const LoadingSpinner = styled.div<{
  theme: any;
}>`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.custom.colors.neutral.gray[200]};
  border-top: 3px solid ${({ theme }) => theme.custom.colors.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Animated grid container for staggered animations
const AnimatedGridContainer = styled.div<{
  $delay?: number;
  theme: any;
}>`
  animation: slideInUp 0.6s ease-out ${({ $delay = 0 }) => $delay * 0.1}s both;
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Fetch only essential dashboard data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useGetDashboardDataQuery(
    { role: user?.role || 'user' },
    { skip: !user?.role }
  );

  const {
    data: alertsData,
    isLoading: alertsLoading,
  } = useGetAlertsQuery(undefined, {
    skip: !user?.id
  });

  const isLoading = dashboardLoading || alertsLoading;

  if (isLoading) {
    return (
      <DashboardContainer theme={theme}>
        <LoadingContainer theme={theme}>
          <LoadingSpinner theme={theme} data-testid="loading-spinner" />
        </LoadingContainer>
      </DashboardContainer>
    );
  }

  if (dashboardError) {
    return (
      <DashboardContainer theme={theme}>
        <ModernAlert severity="error">
          <strong>Dashboard Error:</strong> Failed to load dashboard data. Please try again.
        </ModernAlert>
      </DashboardContainer>
    );
  }

  // Comprehensive ERP metrics covering all modules
  const coreMetrics = [
    {
      title: 'Production Orders',
      value: dashboardData?.productionOrders || 24,
      icon: <Factory />,
      color: theme.custom.colors.primary[500],
      subtitle: '3 behind schedule',
      trend: { value: -5.2, direction: 'down' as const, label: 'vs last month' },
    },
    {
      title: 'Sales Orders',
      value: dashboardData?.salesOrders || 18,
      icon: <ShoppingCart />,
      color: theme.custom.colors.semantic.success[500],
      subtitle: '₹2.4M total value',
      trend: { value: 12.3, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Inventory Items',
      value: dashboardData?.lowStockItems || 7,
      icon: <Inventory />,
      color: theme.custom.colors.semantic.warning[500],
      subtitle: 'Low stock alerts',
      trend: { value: -15.8, direction: 'down' as const, label: 'vs last month' },
    },
    {
      title: 'QC Inspections',
      value: dashboardData?.qcInspections || 12,
      icon: <Assignment />,
      color: theme.custom.colors.secondary[500],
      subtitle: '2 pending approval',
      trend: { value: 8.7, direction: 'up' as const, label: 'vs last month' },
    },
    {
      title: 'Service Requests',
      value: dashboardData?.serviceRequests || 9,
      icon: <TrendingUp />,
      color: theme.custom.colors.semantic.error[500],
      subtitle: '3 overdue',
      trend: { value: -22.1, direction: 'down' as const, label: 'vs last month' },
    },
    {
      title: 'Active Employees',
      value: dashboardData?.activeEmployees || 156,
      icon: <People />,
      color: theme.custom.colors.accent[500],
      subtitle: '98% attendance',
      trend: { value: 2.4, direction: 'up' as const, label: 'vs last month' },
    },
  ];

  // Financial metrics
  const financialMetrics = [
    { label: 'Revenue', value: '₹12.4M', change: '+8.2%', positive: true },
    { label: 'Profit Margin', value: '18.5%', change: '+2.1%', positive: true },
    { label: 'Cash Flow', value: '₹3.2M', change: '-5.3%', positive: false },
    { label: 'Expenses', value: '₹9.8M', change: '+3.4%', positive: false },
  ];

  // Operational metrics
  const operationalMetrics = [
    { label: 'Production Efficiency', value: '94.2%', change: '+1.8%', positive: true },
    { label: 'Quality Score', value: '98.7%', change: '+0.5%', positive: true },
    { label: 'On-Time Delivery', value: '92.1%', change: '-2.3%', positive: false },
    { label: 'Equipment Uptime', value: '96.8%', change: '+1.2%', positive: true },
  ];

  // System alerts and notifications
  const systemAlerts = (Array.isArray(alertsData) ? alertsData.slice(0, 5) : null) || [
    { id: 1, type: 'warning', message: 'Low inventory: Steel Rods (5 units remaining)', time: '2 min ago' },
    { id: 2, type: 'error', message: 'Production line 2 maintenance overdue', time: '15 min ago' },
    { id: 3, type: 'info', message: 'New sales order #SO-2024-156 received', time: '1 hour ago' },
    { id: 4, type: 'success', message: 'Quality inspection batch #QC-001 approved', time: '2 hours ago' },
    { id: 5, type: 'warning', message: 'Employee overtime threshold exceeded', time: '3 hours ago' },
  ];

  // Recent activities across all modules
  const recentActivities = [
    { id: 1, module: 'Production', action: 'Order #PO-2024-001 started', user: 'John Smith', time: '10:30 AM', status: 'Active' },
    { id: 2, module: 'Sales', action: 'Quote #QT-2024-045 sent', user: 'Sarah Johnson', time: '09:45 AM', status: 'Pending' },
    { id: 3, module: 'Inventory', action: 'Stock updated: Steel Rods', user: 'Mike Wilson', time: '09:15 AM', status: 'Completed' },
    { id: 4, module: 'QC', action: 'Inspection #QC-001 completed', user: 'Lisa Chen', time: '08:30 AM', status: 'Approved' },
    { id: 5, module: 'HR', action: 'Employee onboarding: Alex Brown', user: 'David Brown', time: '08:00 AM', status: 'In Progress' },
    { id: 6, module: 'Finance', action: 'Invoice #INV-2024-089 generated', user: 'Emma Davis', time: '07:45 AM', status: 'Sent' },
  ];



  // Chart data
  const productionTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Production',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: theme.custom.colors.primary[500],
        borderColor: theme.custom.colors.primary[600],
      },
      {
        label: 'Quality Pass',
        data: [62, 56, 78, 79, 54, 53],
        backgroundColor: theme.custom.colors.semantic.success[500],
        borderColor: theme.custom.colors.semantic.success[600],
      },
    ],
  };

  const revenueData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Revenue (₹M)',
        data: [2.4, 3.1, 2.8, 3.5],
        backgroundColor: theme.custom.colors.semantic.success[500],
        borderColor: theme.custom.colors.semantic.success[600],
      },
    ],
  };

  const activitiesColumns = [
    { id: 'module', label: 'Module', accessor: 'module' as const, width: '100px' },
    { id: 'action', label: 'Action', accessor: 'action' as const },
    { id: 'user', label: 'User', accessor: 'user' as const, width: '120px' },
    { id: 'time', label: 'Time', accessor: 'time' as const, width: '80px' },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status' as const,
      width: '100px',
      render: (value: string) => (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            backgroundColor: 
              value === 'Completed' || value === 'Approved' || value === 'Active' || value === 'Sent'
                ? theme.custom.colors.semantic.success[100]
                : value === 'Pending' || value === 'In Progress'
                ? theme.custom.colors.semantic.warning[100]
                : theme.custom.colors.semantic.error[100],
            color:
              value === 'Completed' || value === 'Approved' || value === 'Active' || value === 'Sent'
                ? theme.custom.colors.semantic.success[700]
                : value === 'Pending' || value === 'In Progress'
                ? theme.custom.colors.semantic.warning[700]
                : theme.custom.colors.semantic.error[700],
          }}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <DashboardContainer theme={theme}>
      {/* Compact Header */}
      <DashboardHeader theme={theme}>
        <HeaderLeft theme={theme}>
          <DashboardTitle theme={theme}>Steel Manufacturing ERP Dashboard</DashboardTitle>
          <DashboardSubtitle theme={theme}>
            Welcome back, {user?.firstName}! {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </DashboardSubtitle>
        </HeaderLeft>
        <HeaderRight theme={theme}>
          <StatusIndicator $status="online" theme={theme}>
            <CheckCircle style={{ width: 16, height: 16 }} />
            System Online
          </StatusIndicator>
          <StatusIndicator $status="warning" theme={theme}>
            <Warning style={{ width: 16, height: 16 }} />
            {Array.isArray(alertsData) ? alertsData.length : 5} Alerts
          </StatusIndicator>
        </HeaderRight>
      </DashboardHeader>

      <TwoColumnLayout theme={theme}>
        <MainContent theme={theme}>
          {/* Core Business Metrics */}
          <AnimatedGridContainer $delay={1} theme={theme}>
            <ModernGrid
              columns={{ sm: 2, md: 3, lg: 6 }}
              gap={3}
              data-testid="dashboard-kpi-grid"
            >
              {coreMetrics.map((metric, index) => (
                <ModernDashboardCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  color={metric.color}
                  subtitle={metric.subtitle}
                  trend={metric.trend}
                  data-testid={`dashboard-card-${index}`}
                />
              ))}
            </ModernGrid>
          </AnimatedGridContainer>

          {/* Financial & Operational Metrics */}
          <AnimatedGridContainer $delay={2} theme={theme}>
            <ModernGrid columns={{ sm: 1, lg: 2 }} gap={4}>
              <div>
                <SectionHeader theme={theme}>
                  <AttachMoney style={{ width: 20, height: 20 }} />
                  Financial Metrics
                </SectionHeader>
                <ModernGrid columns={{ sm: 2, md: 4 }} gap={2}>
                  {financialMetrics.map((metric, index) => (
                    <CompactMetricCard key={index} theme={theme}>
                      <MetricValue theme={theme}>{metric.value}</MetricValue>
                      <MetricLabel theme={theme}>{metric.label}</MetricLabel>
                      <div style={{ 
                        fontSize: '11px', 
                        color: metric.positive ? theme.custom.colors.semantic.success[600] : theme.custom.colors.semantic.error[600],
                        marginTop: '4px'
                      }}>
                        {metric.change}
                      </div>
                    </CompactMetricCard>
                  ))}
                </ModernGrid>
              </div>
              
              <div>
                <SectionHeader theme={theme}>
                  <Speed style={{ width: 20, height: 20 }} />
                  Operational Metrics
                </SectionHeader>
                <ModernGrid columns={{ sm: 2, md: 4 }} gap={2}>
                  {operationalMetrics.map((metric, index) => (
                    <CompactMetricCard key={index} theme={theme}>
                      <MetricValue theme={theme}>{metric.value}</MetricValue>
                      <MetricLabel theme={theme}>{metric.label}</MetricLabel>
                      <div style={{ 
                        fontSize: '11px', 
                        color: metric.positive ? theme.custom.colors.semantic.success[600] : theme.custom.colors.semantic.error[600],
                        marginTop: '4px'
                      }}>
                        {metric.change}
                      </div>
                    </CompactMetricCard>
                  ))}
                </ModernGrid>
              </div>
            </ModernGrid>
          </AnimatedGridContainer>

          {/* Charts */}
          <AnimatedGridContainer $delay={3} theme={theme}>
            <SectionHeader theme={theme}>
              <TrendingUp style={{ width: 20, height: 20 }} />
              Performance Trends
            </SectionHeader>
            <ModernGrid columns={{ sm: 1, lg: 2 }} gap={4} data-testid="dashboard-charts-grid">
              <ModernChart
                type="line"
                data={productionTrendData}
                title="Production & Quality Trends"
                subtitle="Monthly production and quality metrics"
                height={250}
                data-testid="production-chart"
              />
              <ModernChart
                type="bar"
                data={revenueData}
                title="Revenue Performance"
                subtitle="Quarterly revenue breakdown"
                height={250}
                data-testid="sales-chart"
              />
            </ModernGrid>
          </AnimatedGridContainer>

          {/* Recent Activities */}
          <AnimatedGridContainer $delay={4} theme={theme}>
            <SectionHeader theme={theme}>
              <Schedule style={{ width: 20, height: 20 }} />
              Recent Activities
            </SectionHeader>
            <ModernDataTable
              columns={activitiesColumns}
              data={recentActivities}
              density="compact"
              stickyHeader
              maxHeight="300px"
              data-testid="recent-activities-table"
            />
          </AnimatedGridContainer>
        </MainContent>

        <Sidebar theme={theme}>
          {/* System Alerts */}
          <AnimatedGridContainer $delay={2} theme={theme}>
            <SectionHeader theme={theme}>
              <Notifications style={{ width: 20, height: 20 }} />
              System Alerts
            </SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.custom.spacing[2] }}>
              {systemAlerts.map((alert) => (
                <ModernAlert
                  key={alert.id}
                  severity={alert.type === 'error' ? 'error' : alert.type === 'warning' ? 'warning' : alert.type === 'success' ? 'success' : 'info'}
                  variant="outlined"
                >
                  <div style={{ fontSize: '12px' }}>
                    <div>{alert.message}</div>
                    <div style={{ color: theme.custom.colors.neutral.gray[500], marginTop: '2px' }}>
                      {alert.time}
                    </div>
                  </div>
                </ModernAlert>
              ))}
            </div>
          </AnimatedGridContainer>


        </Sidebar>
      </TwoColumnLayout>
    </DashboardContainer>
  );
};

export default Dashboard;