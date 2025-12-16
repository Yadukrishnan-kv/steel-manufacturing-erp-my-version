import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney,
  Refresh,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetSalesDashboardQuery, useGetSalesPipelineAnalyticsQuery } from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesDashboard: React.FC = () => {
  const [period, setPeriod] = useState('MONTH');
  const [branchId, setBranchId] = useState('');

  // API calls
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useGetSalesDashboardQuery({ branchId: branchId || undefined, period });

  const { 
    data: pipelineData, 
    isLoading: isPipelineLoading 
  } = useGetSalesPipelineAnalyticsQuery({ branchId: branchId || undefined });

  const isLoading = isDashboardLoading || isPipelineLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please try again.
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No dashboard data available.
        </Alert>
      </Box>
    );
  }

  // Transform pipeline data for charts
  const pipelineChartData = pipelineData?.pipelineByStatus?.map((item: any, index: number) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [
    { name: 'New Leads', value: 156, color: '#0088FE' },
    { name: 'Qualified', value: 89, color: '#00C49F' },
    { name: 'Estimates', value: 67, color: '#FFBB28' },
    { name: 'Approved', value: 45, color: '#FF8042' },
    { name: 'Converted', value: 34, color: '#8884D8' },
  ];

  const sourcePerformanceData = dashboardData?.sourcePerformance || [];



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'QUALIFIED': return 'primary';
      case 'CONVERTED': return 'success';
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sales Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetchDashboard()}
            size="small"
          >
            Refresh
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="TODAY">Today</MenuItem>
              <MenuItem value="WEEK">This Week</MenuItem>
              <MenuItem value="MONTH">This Month</MenuItem>
              <MenuItem value="QUARTER">This Quarter</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              label="Branch"
            >
              <MenuItem value="">All Branches</MenuItem>
              <MenuItem value="KL001">Kochi</MenuItem>
              <MenuItem value="TN001">Chennai</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="primary">
                    {dashboardData?.metrics?.totalLeads || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Leads
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {dashboardData?.metrics?.convertedLeads || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Converted Leads
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {dashboardData?.metrics?.conversionRate || 0}% conversion rate
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {dashboardData?.metrics?.approvedEstimates || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved Estimates
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    {dashboardData?.metrics?.estimateApprovalRate || 0}% approval rate
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" color="info.main">
                    ₹{((dashboardData?.metrics?.totalRevenue || 0) / 100000).toFixed(1)}L
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    ₹{((dashboardData?.metrics?.averageOrderValue || 0) / 1000).toFixed(0)}K avg order
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Pipeline */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sales Pipeline
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Source Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead Source Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourcePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leadCount" fill="#8884d8" name="Lead Count" />
                  <Bar dataKey="averageValue" fill="#82ca9d" name="Avg Value (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Conversion Funnel */}
        {pipelineData?.conversionFunnel && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conversion Funnel
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {pipelineData.conversionFunnel.totalLeads}
                      </Typography>
                      <Typography variant="body2">Total Leads</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {pipelineData.conversionFunnel.qualifiedLeads}
                      </Typography>
                      <Typography variant="body2">Qualified</Typography>
                      <Typography variant="caption" color="info.main">
                        {pipelineData.conversionFunnel.qualificationRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {pipelineData.conversionFunnel.estimatesGenerated}
                      </Typography>
                      <Typography variant="body2">Estimates</Typography>
                      <Typography variant="caption" color="warning.main">
                        {pipelineData.conversionFunnel.estimateRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {pipelineData.conversionFunnel.convertedLeads}
                      </Typography>
                      <Typography variant="body2">Converted</Typography>
                      <Typography variant="caption" color="success.main">
                        {pipelineData.conversionFunnel.conversionRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Leads */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Leads
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lead #</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentActivities?.leads?.map((lead: any) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {lead.leadNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lead.contactName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={lead.source} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.status}
                            color={getStatusColor(lead.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          ₹{lead.estimatedValue ? (lead.estimatedValue / 1000).toFixed(0) : '0'}K
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No recent leads
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Estimates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Estimates
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Estimate #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentActivities?.estimates?.map((estimate: any) => (
                      <TableRow key={estimate.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {estimate.estimateNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {estimate.lead?.contactName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={estimate.status}
                            color={getStatusColor(estimate.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          ₹{(estimate.finalAmount / 1000).toFixed(0)}K
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No recent estimates
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesDashboard;