import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Chip,
} from '@mui/material';
import {
  Factory,
  Schedule,
  Warning,
  CheckCircle,
  Add,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useGetProductionOrdersQuery, useGetProductionScheduleQuery } from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const ManufacturingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  const {
    data: productionOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetProductionOrdersQuery();
  
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useGetProductionScheduleQuery();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock Gantt chart data (will be replaced with real data)
  const ganttData = scheduleData?.ganttData || [
    {
      operation: 'Cutting',
      planned: 8,
      actual: 6,
      capacity: 10,
    },
    {
      operation: 'CNC',
      planned: 5,
      actual: 4,
      capacity: 8,
    },
    {
      operation: 'Bending',
      planned: 6,
      actual: 7,
      capacity: 8,
    },
    {
      operation: 'Welding',
      planned: 4,
      actual: 3,
      capacity: 6,
    },
    {
      operation: 'Coating',
      planned: 3,
      actual: 2,
      capacity: 4,
    },
    {
      operation: 'Assembly',
      planned: 7,
      actual: 8,
      capacity: 10,
    },
  ];

  const statusCards = [
    {
      title: 'Active Orders',
      value: productionOrders?.filter(order => order.status === 'IN_PROGRESS').length || 12,
      icon: <Factory />,
      color: '#1976d2',
    },
    {
      title: 'Scheduled Today',
      value: productionOrders?.filter(order => 
        new Date(order.scheduledStartDate).toDateString() === new Date().toDateString()
      ).length || 8,
      icon: <Schedule />,
      color: '#388e3c',
    },
    {
      title: 'Behind Schedule',
      value: productionOrders?.filter(order => order.status === 'DELAYED').length || 3,
      icon: <Warning />,
      color: '#f57c00',
    },
    {
      title: 'Completed Today',
      value: productionOrders?.filter(order => 
        order.status === 'COMPLETED' && 
        new Date(order.actualEndDate).toDateString() === new Date().toDateString()
      ).length || 5,
      icon: <CheckCircle />,
      color: '#388e3c',
    },
  ];

  if (ordersLoading || scheduleLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (ordersError || scheduleError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load manufacturing data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manufacturing Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {/* Navigate to create production order */}}
        >
          New Production Order
        </Button>
      </Box>

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statusCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      borderRadius: 1,
                      p: 1,
                      mr: 2,
                      color: 'white',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6">{card.title}</Typography>
                </Box>
                <Typography variant="h4">{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for different views */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Capacity Overview" />
            <Tab label="Production Schedule" />
            <Tab label="Active Orders" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Production Capacity by Operation
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={ganttData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operation" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="#e3f2fd" name="Total Capacity" />
                <Bar dataKey="planned" fill="#1976d2" name="Planned" />
                <Bar dataKey="actual" fill="#388e3c" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Production Schedule (Gantt View)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Interactive Gantt chart will be implemented with advanced scheduling features
            </Typography>
            {/* Placeholder for Gantt chart - will be enhanced in future iterations */}
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body1" color="text.secondary">
                Gantt Chart Visualization Coming Soon
              </Typography>
            </Box>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Active Production Orders
            </Typography>
            <Grid container spacing={2}>
              {(productionOrders || []).slice(0, 6).map((order: any, index: number) => (
                <Grid item xs={12} md={6} key={order.id || index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {order.productCode || `PO-${1000 + index}`}
                        </Typography>
                        <Chip
                          label={order.status || 'IN_PROGRESS'}
                          color={order.status === 'COMPLETED' ? 'success' : 
                                 order.status === 'DELAYED' ? 'error' : 'primary'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {order.quantity || 50} | Due: {order.scheduledEndDate ? 
                          new Date(order.scheduledEndDate).toLocaleDateString() : 
                          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default ManufacturingDashboard;