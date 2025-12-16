import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  FilterList,
  Refresh,
  Download,
  NavigateNext,
} from '@mui/icons-material';

// Mock data for different drill-down levels
const summaryData = {
  totalRevenue: 15750000,
  totalOrders: 1250,
  avgOrderValue: 12600,
  profitMargin: 18.5,
};

const monthlyData = [
  { month: 'Jan', revenue: 2500000, orders: 180, profit: 450000, expenses: 2050000 },
  { month: 'Feb', revenue: 2800000, orders: 210, profit: 520000, expenses: 2280000 },
  { month: 'Mar', revenue: 2200000, orders: 165, profit: 380000, expenses: 1820000 },
  { month: 'Apr', revenue: 3100000, orders: 245, profit: 620000, expenses: 2480000 },
  { month: 'May', revenue: 2650000, orders: 195, profit: 485000, expenses: 2165000 },
  { month: 'Jun', revenue: 2500000, orders: 255, profit: 475000, expenses: 2025000 },
];

const productCategoryData = [
  { category: 'Steel Doors', revenue: 6500000, orders: 450, margin: 22, color: '#8884d8' },
  { category: 'Windows', revenue: 4200000, orders: 380, margin: 18, color: '#82ca9d' },
  { category: 'Frames', revenue: 3100000, orders: 280, margin: 15, color: '#ffc658' },
  { category: 'Custom Work', revenue: 1950000, orders: 140, margin: 25, color: '#ff7300' },
];

const branchPerformance = [
  { branch: 'Kerala Main', revenue: 8500000, orders: 625, employees: 45, efficiency: 92 },
  { branch: 'Tamil Nadu', revenue: 4200000, orders: 385, employees: 28, efficiency: 88 },
  { branch: 'Kerala North', revenue: 3050000, orders: 240, employees: 22, efficiency: 85 },
];

const customerSegmentData = [
  { segment: 'Enterprise', revenue: 7200000, customers: 45, avgValue: 160000 },
  { segment: 'SME', revenue: 5100000, customers: 180, avgValue: 28333 },
  { segment: 'Individual', revenue: 3450000, customers: 520, avgValue: 6635 },
];

interface DrillDownLevel {
  level: string;
  title: string;
  data?: any;
}

const BIDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  // const [selectedMetric] = useState('revenue');
  const [drillDownPath, setDrillDownPath] = useState<DrillDownLevel[]>([
    { level: 'summary', title: 'Business Overview' }
  ]);

  const currentLevel = drillDownPath[drillDownPath.length - 1];

  const handleDrillDown = (level: string, title: string, data?: any) => {
    setDrillDownPath([...drillDownPath, { level, title, data }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setDrillDownPath(drillDownPath.slice(0, index + 1));
  };

  const renderSummaryView = () => (
    <>
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('revenue', 'Revenue Analysis')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    ₹{(summaryData.totalRevenue / 10000000).toFixed(1)}Cr
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +15.2% YoY
                    </Typography>
                  </Box>
                </Box>
                <Assessment color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('orders', 'Order Analysis')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h5">
                    {summaryData.totalOrders.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +8.7% YoY
                    </Typography>
                  </Box>
                </Box>
                <Assessment color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('aov', 'Average Order Value')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Order Value
                  </Typography>
                  <Typography variant="h5">
                    ₹{summaryData.avgOrderValue.toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +5.9% YoY
                    </Typography>
                  </Box>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer' }} onClick={() => handleDrillDown('profit', 'Profitability Analysis')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Profit Margin
                  </Typography>
                  <Typography variant="h5">
                    {summaryData.profitMargin}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingDown color="warning" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="warning.main">
                      -2.1% YoY
                    </Typography>
                  </Box>
                </Box>
                <Assessment color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue & Profit Trend (Click to drill down)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData} onClick={(data) => data && handleDrillDown('monthly', `Monthly Analysis - ${data.activeLabel}`, data)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => [
                    name === 'orders' ? value : `₹${Number(value).toLocaleString()}`,
                    name
                  ]} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar yAxisId="left" dataKey="profit" fill="#82ca9d" name="Profit" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#ff7300" strokeWidth={2} name="Orders" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Categories (Click to drill down)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart onClick={(data) => data && handleDrillDown('category', `Category Analysis - ${data.activeLabel}`, data)}>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, revenue }) => `${category}: ₹${(revenue/1000000).toFixed(1)}M`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {productCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Branch Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Branch Performance (Click row to drill down)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Branch</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">Employees</TableCell>
                  <TableCell align="right">Efficiency</TableCell>
                  <TableCell align="center">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {branchPerformance.map((branch) => (
                  <TableRow 
                    key={branch.branch} 
                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    onClick={() => handleDrillDown('branch', `Branch Analysis - ${branch.branch}`, branch)}
                  >
                    <TableCell>{branch.branch}</TableCell>
                    <TableCell align="right">₹{(branch.revenue/1000000).toFixed(1)}M</TableCell>
                    <TableCell align="right">{branch.orders}</TableCell>
                    <TableCell align="right">{branch.employees}</TableCell>
                    <TableCell align="right">{branch.efficiency}%</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={branch.efficiency >= 90 ? 'Excellent' : branch.efficiency >= 85 ? 'Good' : 'Needs Improvement'}
                        color={branch.efficiency >= 90 ? 'success' : branch.efficiency >= 85 ? 'info' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  );

  const renderDrillDownView = () => {
    switch (currentLevel.level) {
      case 'revenue':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Breakdown by Customer Segment
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={customerSegmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Customer Segment Details
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Segment</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                          <TableCell align="right">Customers</TableCell>
                          <TableCell align="right">Avg Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {customerSegmentData.map((segment) => (
                          <TableRow key={segment.segment}>
                            <TableCell>{segment.segment}</TableCell>
                            <TableCell align="right">₹{segment.revenue.toLocaleString()}</TableCell>
                            <TableCell align="right">{segment.customers}</TableCell>
                            <TableCell align="right">₹{segment.avgValue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );
      
      case 'orders':
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Analysis - Monthly Trend
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6">
                Detailed analysis for {currentLevel.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This would show detailed drill-down data for the selected metric.
              </Typography>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Business Intelligence Dashboard
          </Typography>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            {drillDownPath.map((level, index) => (
              <Link
                key={index}
                color={index === drillDownPath.length - 1 ? 'text.primary' : 'inherit'}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleBreadcrumbClick(index);
                }}
                sx={{ cursor: 'pointer' }}
              >
                {level.title}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="1month">1 Month</MenuItem>
              <MenuItem value="3months">3 Months</MenuItem>
              <MenuItem value="6months">6 Months</MenuItem>
              <MenuItem value="1year">1 Year</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<FilterList />}>Filters</Button>
          <Button startIcon={<Refresh />}>Refresh</Button>
          <Button startIcon={<Download />}>Export</Button>
        </Box>
      </Box>

      {/* Content */}
      {currentLevel.level === 'summary' ? renderSummaryView() : renderDrillDownView()}
    </Box>
  );
};

export default BIDashboard;