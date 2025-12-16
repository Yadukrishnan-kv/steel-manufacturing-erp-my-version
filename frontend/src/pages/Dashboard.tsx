import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Factory,
  ShoppingCart,
  Inventory,
  Assignment,
  TrendingUp,
  People,
} from '@mui/icons-material';
import type { RootState } from '../store/store';
import { useGetDashboardDataQuery } from '../services/api';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color: string;
  subtitle?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: 1,
            p: 1,
            mr: 2,
            color: 'white',
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useGetDashboardDataQuery(
    { role: user?.role || 'user' },
    { skip: !user?.role }
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  // Default dashboard cards (will be replaced with real data)
  const defaultCards = [
    {
      title: 'Active Production Orders',
      value: dashboardData?.productionOrders || 24,
      icon: <Factory />,
      color: '#1976d2',
      subtitle: '3 behind schedule',
    },
    {
      title: 'Pending Sales Orders',
      value: dashboardData?.salesOrders || 18,
      icon: <ShoppingCart />,
      color: '#388e3c',
      subtitle: '₹2.4M total value',
    },
    {
      title: 'Low Stock Items',
      value: dashboardData?.lowStockItems || 7,
      icon: <Inventory />,
      color: '#f57c00',
      subtitle: 'Require attention',
    },
    {
      title: 'QC Inspections',
      value: dashboardData?.qcInspections || 12,
      icon: <Assignment />,
      color: '#7b1fa2',
      subtitle: '2 pending approval',
    },
    {
      title: 'Service Requests',
      value: dashboardData?.serviceRequests || 9,
      icon: <TrendingUp />,
      color: '#d32f2f',
      subtitle: '3 overdue',
    },
    {
      title: 'Active Employees',
      value: dashboardData?.activeEmployees || 156,
      icon: <People />,
      color: '#303f9f',
      subtitle: '98% attendance today',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back, {user?.firstName}! Here's what's happening in your organization.
      </Typography>

      <Grid container spacing={3}>
        {defaultCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <DashboardCard {...card} />
          </Grid>
        ))}
      </Grid>

      {/* Additional dashboard sections can be added here */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          More dashboard features and charts will be implemented in subsequent tasks.
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;