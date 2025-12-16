/**
 * Dashboard Components Demo
 * Showcases all modern dashboard components
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '@mui/material/styles';
import {
  Factory,
  ShoppingCart,
  Inventory,
  Assignment,
  TrendingUp,
  People,
} from '@mui/icons-material';
import {
  ModernDashboardCard,
  ModernDataTable,
  ModernChart,
  ModernGrid,
  ModernGridItem,
  TableColumn,
  ChartData,
} from './index';

const DemoContainer = styled.div<{ theme: any }>`
  padding: ${({ theme }) => theme.custom.spacing[6]};
  background-color: ${({ theme }) => theme.custom.colors.neutral.gray[50]};
  min-height: 100vh;
`;

const DemoSection = styled.div<{ theme: any }>`
  margin-bottom: ${({ theme }) => theme.custom.spacing[8]};
`;

const SectionTitle = styled.h2<{ theme: any }>`
  margin: 0 0 ${({ theme }) => theme.custom.spacing[4]} 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.custom.typography.fontWeight.bold};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[900]};
`;

const SectionDescription = styled.p<{ theme: any }>`
  margin: 0 0 ${({ theme }) => theme.custom.spacing[6]} 0;
  font-size: ${({ theme }) => theme.custom.typography.fontSize.base};
  color: ${({ theme }) => theme.custom.colors.neutral.gray[600]};
  line-height: ${({ theme }) => theme.custom.typography.lineHeight.relaxed};
`;

interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  salary: number;
  status: 'Active' | 'Inactive';
}

const DashboardDemo: React.FC = () => {
  const theme = useTheme();
  
  // Sample data for table
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const employeeData: Employee[] = [
    { id: '1', name: 'John Doe', department: 'Engineering', role: 'Senior Developer', salary: 95000, status: 'Active' },
    { id: '2', name: 'Jane Smith', department: 'Design', role: 'UX Designer', salary: 75000, status: 'Active' },
    { id: '3', name: 'Bob Johnson', department: 'Sales', role: 'Sales Manager', salary: 85000, status: 'Active' },
    { id: '4', name: 'Alice Brown', department: 'HR', role: 'HR Specialist', salary: 65000, status: 'Inactive' },
    { id: '5', name: 'Charlie Wilson', department: 'Engineering', role: 'Frontend Developer', salary: 80000, status: 'Active' },
  ];
  
  const tableColumns: TableColumn<Employee>[] = [
    { id: 'name', label: 'Name', accessor: 'name', sortable: true },
    { id: 'department', label: 'Department', accessor: 'department', sortable: true },
    { id: 'role', label: 'Role', accessor: 'role' },
    { 
      id: 'salary', 
      label: 'Salary', 
      accessor: 'salary', 
      sortable: true, 
      align: 'right',
      render: (value) => `$${value.toLocaleString()}`
    },
    { 
      id: 'status', 
      label: 'Status', 
      accessor: 'status',
      render: (value) => (
        <span style={{ 
          color: value === 'Active' ? theme.custom.colors.semantic.success[600] : theme.custom.colors.neutral.gray[500],
          fontWeight: theme.custom.typography.fontWeight.medium
        }}>
          {value}
        </span>
      )
    },
  ];
  
  // Sample chart data
  const salesChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Sales Revenue',
        data: [120000, 150000, 135000, 180000, 165000, 200000],
      },
      {
        label: 'Target Revenue',
        data: [130000, 140000, 150000, 160000, 170000, 180000],
      },
    ],
  };
  
  const productionChartData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Units Produced',
        data: [450, 520, 480, 600],
      },
    ],
  };
  
  return (
    <DemoContainer theme={theme}>
      {/* Dashboard Cards Section */}
      <DemoSection theme={theme}>
        <SectionTitle theme={theme}>Dashboard Cards</SectionTitle>
        <SectionDescription theme={theme}>
          Modern KPI cards with clean design, trend indicators, and interactive capabilities.
        </SectionDescription>
        
        <ModernGrid columns={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap={4}>
          <ModernDashboardCard
            title="Active Production Orders"
            value={24}
            subtitle="3 behind schedule"
            icon={<Factory />}
            color={theme.custom.colors.primary[600]}
            trend={{ value: 12, direction: 'up', label: 'vs last month' }}
            onClick={() => alert('Navigate to Production Orders')}
          />
          
          <ModernDashboardCard
            title="Pending Sales Orders"
            value="18"
            subtitle="₹2.4M total value"
            icon={<ShoppingCart />}
            color={theme.custom.colors.semantic.success[600]}
            trend={{ value: -5, direction: 'down', label: 'vs last month' }}
          />
          
          <ModernDashboardCard
            title="Low Stock Items"
            value={7}
            subtitle="Require attention"
            icon={<Inventory />}
            color={theme.custom.colors.semantic.warning[600]}
            trend={{ value: 0, direction: 'neutral', label: 'no change' }}
          />
          
          <ModernDashboardCard
            title="QC Inspections"
            value={12}
            subtitle="2 pending approval"
            icon={<Assignment />}
            color={theme.custom.colors.secondary[600]}
          />
          
          <ModernDashboardCard
            title="Service Requests"
            value={9}
            subtitle="3 overdue"
            icon={<TrendingUp />}
            color={theme.custom.colors.semantic.error[600]}
            trend={{ value: 25, direction: 'up', label: 'vs last week' }}
          />
          
          <ModernDashboardCard
            title="Active Employees"
            value={1560000}
            subtitle="98% attendance today"
            icon={<People />}
            color={theme.custom.colors.accent[600]}
            loading={false}
          />
        </ModernGrid>
      </DemoSection>
      
      {/* Data Table Section */}
      <DemoSection theme={theme}>
        <SectionTitle theme={theme}>Data Table</SectionTitle>
        <SectionDescription theme={theme}>
          High-density data table with sorting, selection, pagination, and responsive design.
        </SectionDescription>
        
        <ModernDataTable
          columns={tableColumns}
          data={employeeData}
          selectable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          pagination={{
            page: currentPage,
            pageSize: 3,
            total: employeeData.length,
            onPageChange: setCurrentPage,
            onPageSizeChange: () => {},
          }}
          density="comfortable"
          stickyHeader
          maxHeight={400}
        />
      </DemoSection>
      
      {/* Charts Section */}
      <DemoSection theme={theme}>
        <SectionTitle theme={theme}>Charts</SectionTitle>
        <SectionDescription theme={theme}>
          Modern chart components with consistent styling and responsive design.
        </SectionDescription>
        
        <ModernGrid columns={{ sm: 1, lg: 2 }} gap={6}>
          <ModernChart
            type="line"
            data={salesChartData}
            title="Sales Performance"
            subtitle="Monthly revenue vs targets"
            height={300}
            showLegend
          />
          
          <ModernChart
            type="bar"
            data={productionChartData}
            title="Production Output"
            subtitle="Weekly production units"
            height={300}
            showLegend
          />
        </ModernGrid>
      </DemoSection>
      
      {/* Grid Layout Section */}
      <DemoSection theme={theme}>
        <SectionTitle theme={theme}>Responsive Grid</SectionTitle>
        <SectionDescription theme={theme}>
          Flexible CSS Grid system with responsive breakpoints and auto-fit capabilities.
        </SectionDescription>
        
        <ModernGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={4}>
          <ModernGridItem span={{ sm: 1, lg: 2 }}>
            <ModernDashboardCard
              title="Wide Card"
              value="Spans 2 columns on large screens"
              subtitle="Responsive grid item"
              color={theme.custom.colors.primary[500]}
            />
          </ModernGridItem>
          
          <ModernDashboardCard
            title="Regular Card 1"
            value="Normal width"
            color={theme.custom.colors.secondary[500]}
          />
          
          <ModernDashboardCard
            title="Regular Card 2"
            value="Normal width"
            color={theme.custom.colors.accent[500]}
          />
          
          <ModernGridItem span={{ sm: 1, md: 2, lg: 4 }}>
            <ModernDashboardCard
              title="Full Width Card"
              value="Spans full width on all screens"
              subtitle="Perfect for summary information"
              color={theme.custom.colors.semantic.info[500]}
            />
          </ModernGridItem>
        </ModernGrid>
      </DemoSection>
      
      {/* Loading States Section */}
      <DemoSection theme={theme}>
        <SectionTitle theme={theme}>Loading States</SectionTitle>
        <SectionDescription theme={theme}>
          Elegant loading skeletons that maintain layout structure.
        </SectionDescription>
        
        <ModernGrid columns={{ sm: 1, md: 2, lg: 3 }} gap={4}>
          <ModernDashboardCard
            title="Loading Card"
            value={0}
            loading
          />
          
          <ModernChart
            type="line"
            data={salesChartData}
            title="Loading Chart"
            loading
            height={200}
          />
          
          <ModernDataTable
            columns={tableColumns.slice(0, 3)}
            data={[]}
            loading
          />
        </ModernGrid>
      </DemoSection>
    </DemoContainer>
  );
};

export default DashboardDemo;