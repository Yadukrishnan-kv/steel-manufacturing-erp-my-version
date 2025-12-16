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
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  Settings as PrecisionIcon,
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
import { useTheme } from '@mui/material';
import { useGetProductionOrdersQuery, useGetProductionScheduleQuery } from '../../services/api';
import { useNavigate } from 'react-router-dom';

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
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  const {
    data: productionOrders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useGetProductionOrdersQuery({});
  
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
    error: scheduleError,
  } = useGetProductionScheduleQuery({});

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

  // Ensure productionOrders is an array
  const ordersArray = Array.isArray(productionOrders) ? productionOrders : [];

  const statusCards = [
    {
      title: 'Active Orders',
      value: ordersArray.filter(order => order.status === 'IN_PROGRESS').length || 0,
      icon: <Factory />,
      color: '#1976d2',
    },
    {
      title: 'Scheduled Today',
      value: ordersArray.filter(order => 
        order.scheduledStartDate && 
        new Date(order.scheduledStartDate).toDateString() === new Date().toDateString()
      ).length || 0,
      icon: <Schedule />,
      color: '#388e3c',
    },
    {
      title: 'Behind Schedule',
      value: ordersArray.filter(order => order.status === 'DELAYED').length || 0,
      icon: <Warning />,
      color: '#f57c00',
    },
    {
      title: 'Completed Today',
      value: ordersArray.filter(order => 
        order.status === 'COMPLETED' && 
        order.actualEndDate &&
        new Date(order.actualEndDate).toDateString() === new Date().toDateString()
      ).length || 0,
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
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1.5,
          pb: 1,
          borderBottom: '2px solid',
          borderColor: theme.palette.primary.main,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Factory sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Manufacturing Dashboard
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Production overview, scheduling, and performance monitoring
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/gantt')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Gantt View
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/calendar')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Calendar
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrecisionIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/work-centers')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Work Centers
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/create-order')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              New Order
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Box sx={{
          display: 'flex',
          gap: 1,
          mb: 1.5,
          flexWrap: 'wrap',
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider'
        }}>
          {statusCards.map((card, index) => (
            <Chip
              key={index}
              icon={card.icon}
              label={`${card.value} ${card.title}`}
              size="small"
              sx={{
                bgcolor: index === 0 ? `${theme.palette.primary.light}15` : 
                        index === 1 ? '#e8f5e8' :
                        index === 2 ? '#fff3e0' : '#e8f5e8',
                color: index === 0 ? theme.palette.primary.main :
                       index === 1 ? '#2e7d32' :
                       index === 2 ? '#f57c00' : '#2e7d32',
                fontWeight: 600,
                height: 28,
                fontSize: '0.75rem',
                '& .MuiChip-icon': { 
                  color: index === 0 ? theme.palette.primary.main :
                         index === 1 ? '#2e7d32' :
                         index === 2 ? '#f57c00' : '#2e7d32',
                  fontSize: 16 
                }
              }}
            />
          ))}
        </Box>

        {/* Tabs for different views */}
        <Card sx={{ borderRadius: 1.5 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab 
                label="Capacity Overview" 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  fontSize: '0.875rem' 
                }} 
              />
              <Tab 
                label="Production Schedule" 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  fontSize: '0.875rem' 
                }} 
              />
              <Tab 
                label="Active Orders" 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  fontSize: '0.875rem' 
                }} 
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary, 
                fontSize: '0.875rem' 
              }}>
                Production Capacity by Operation
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={ganttData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="operation" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="capacity" fill={`${theme.palette.primary.light}30`} name="Total Capacity" />
                  <Bar dataKey="planned" fill={theme.palette.primary.main} name="Planned" />
                  <Bar dataKey="actual" fill="#2e7d32" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: '0.875rem' 
                }}>
                  Production Schedule (Gantt View)
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate('/manufacturing/gantt')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5
                  }}
                >
                  Open Full View
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem' }}>
                Interactive Gantt chart with advanced scheduling features
              </Typography>
              {/* Placeholder for Gantt chart preview */}
              <Box sx={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                bgcolor: 'grey.50',
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Gantt Chart Preview
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    Click "Open Full View" for interactive scheduling
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary, 
                  fontSize: '0.875rem' 
                }}>
                  Active Production Orders
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/manufacturing/orders')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5
                  }}
                >
                  View All
                </Button>
              </Box>
              <Grid container spacing={1}>
                {ordersArray.slice(0, 6).map((order: any, index: number) => (
                  <Grid item xs={12} md={6} key={order.id || index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 1.5,
                        '&:hover': { 
                          backgroundColor: 'rgba(25, 118, 210, 0.04)',
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => navigate(`/manufacturing/orders/${order.id || index}`)}
                    >
                      <CardContent sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600, 
                              fontSize: '0.75rem',
                              color: theme.palette.primary.main
                            }}
                          >
                            {order.productCode || `PO-${1000 + index}`}
                          </Typography>
                          <Chip
                            label={order.status || 'IN_PROGRESS'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: order.status === 'COMPLETED' ? '#e8f5e8' : 
                                       order.status === 'DELAYED' ? '#ffebee' : `${theme.palette.primary.light}15`,
                              color: order.status === 'COMPLETED' ? '#2e7d32' : 
                                     order.status === 'DELAYED' ? '#d32f2f' : theme.palette.primary.main,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
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