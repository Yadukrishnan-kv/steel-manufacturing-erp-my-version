import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { People, TrendingUp, Schedule, Assessment } from '@mui/icons-material';

// Mock data for demonstration
const attendanceData = [
  { month: 'Jan', present: 92, absent: 8, late: 5 },
  { month: 'Feb', present: 89, absent: 11, late: 7 },
  { month: 'Mar', present: 94, absent: 6, late: 4 },
  { month: 'Apr', present: 91, absent: 9, late: 6 },
  { month: 'May', present: 93, absent: 7, late: 3 },
  { month: 'Jun', present: 95, absent: 5, late: 2 },
];

const departmentData = [
  { name: 'Production', employees: 45, color: '#8884d8' },
  { name: 'Sales', employees: 12, color: '#82ca9d' },
  { name: 'Quality', employees: 8, color: '#ffc658' },
  { name: 'Admin', employees: 6, color: '#ff7300' },
  { name: 'Finance', employees: 4, color: '#00ff88' },
];

const topPerformers = [
  { id: 1, name: 'Rajesh Kumar', department: 'Production', kpiScore: 95, avatar: 'RK' },
  { id: 2, name: 'Priya Sharma', department: 'Sales', kpiScore: 92, avatar: 'PS' },
  { id: 3, name: 'Amit Singh', department: 'Quality', kpiScore: 90, avatar: 'AS' },
  { id: 4, name: 'Sunita Devi', department: 'Production', kpiScore: 88, avatar: 'SD' },
  { id: 5, name: 'Vikram Nair', department: 'Sales', kpiScore: 87, avatar: 'VN' },
];

const recentActivities = [
  { id: 1, employee: 'Rajesh Kumar', action: 'Clocked In', time: '09:00 AM', status: 'On Time' },
  { id: 2, employee: 'Priya Sharma', action: 'Leave Applied', time: '10:30 AM', status: 'Pending' },
  { id: 3, employee: 'Amit Singh', action: 'KPI Updated', time: '11:15 AM', status: 'Completed' },
  { id: 4, employee: 'Sunita Devi', action: 'Overtime Logged', time: '06:30 PM', status: 'Approved' },
];

const HRDashboard: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Time': return 'success';
      case 'Completed': return 'success';
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Late': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        HR Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Employees
                  </Typography>
                  <Typography variant="h5">
                    75
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +3 this month
                    </Typography>
                  </Box>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Present Today
                  </Typography>
                  <Typography variant="h5">
                    68
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="success.main">
                      90.7% attendance
                    </Typography>
                  </Box>
                </Box>
                <Schedule color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg KPI Score
                  </Typography>
                  <Typography variant="h5">
                    82.5
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="success.main">
                      +2.3 points
                    </Typography>
                  </Box>
                </Box>
                <Assessment color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Leaves
                  </Typography>
                  <Typography variant="h5">
                    12
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography variant="body2" color="warning.main">
                      Requires approval
                    </Typography>
                  </Box>
                </Box>
                <Schedule color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Attendance Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Attendance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#82ca9d" strokeWidth={2} name="Present %" />
                  <Line type="monotone" dataKey="absent" stroke="#ff7300" strokeWidth={2} name="Absent %" />
                  <Line type="monotone" dataKey="late" stroke="#8884d8" strokeWidth={2} name="Late %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="employees"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Top Performers */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Performers (KPI Score)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell align="right">KPI Score</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topPerformers.map((performer) => (
                      <TableRow key={performer.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {performer.avatar}
                            </Avatar>
                            {performer.name}
                          </Box>
                        </TableCell>
                        <TableCell>{performer.department}</TableCell>
                        <TableCell align="right">{performer.kpiScore}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinearProgress
                              variant="determinate"
                              value={performer.kpiScore}
                              sx={{ width: 60, mr: 1 }}
                              color={performer.kpiScore >= 90 ? 'success' : performer.kpiScore >= 80 ? 'info' : 'warning'}
                            />
                            <Typography variant="body2">{performer.kpiScore}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.employee}</TableCell>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>{activity.time}</TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status}
                            color={getStatusColor(activity.status) as any}
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default HRDashboard;