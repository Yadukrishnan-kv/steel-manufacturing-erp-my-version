import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,

  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Delete,
  LocationOn,
  Phone,
  Email,
  Work,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  salary: number;
  kpiScore: number;
  attendancePercentage: number;
  location: string;
  manager: string;
  avatar?: string;
}

// Mock data
const mockEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@company.com',
    phone: '+91 9876543210',
    department: 'Production',
    designation: 'Production Manager',
    joiningDate: '2022-01-15',
    status: 'Active',
    salary: 75000,
    kpiScore: 95,
    attendancePercentage: 96,
    location: 'Kerala Branch',
    manager: 'Suresh Nair',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@company.com',
    phone: '+91 9876543211',
    department: 'Sales',
    designation: 'Sales Executive',
    joiningDate: '2022-03-20',
    status: 'Active',
    salary: 45000,
    kpiScore: 92,
    attendancePercentage: 94,
    location: 'Tamil Nadu Branch',
    manager: 'Vikram Singh',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    firstName: 'Amit',
    lastName: 'Singh',
    email: 'amit.singh@company.com',
    phone: '+91 9876543212',
    department: 'Quality',
    designation: 'QC Inspector',
    joiningDate: '2021-11-10',
    status: 'Active',
    salary: 35000,
    kpiScore: 90,
    attendancePercentage: 98,
    location: 'Kerala Branch',
    manager: 'Rajesh Kumar',
  },
];

const EmployeeManagement: React.FC = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'On Leave': return 'warning';
      default: return 'default';
    }
  };

  const getKPIColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'info';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const filteredEmployees = filterDepartment === 'All' 
    ? employees 
    : employees.filter(emp => emp.department === filterDepartment);

  const departments = ['All', ...Array.from(new Set(employees.map(emp => emp.department)))];

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setOpenDialog(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEmployee(null);
  };

  const EmployeeDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              defaultValue={selectedEmployee?.employeeId || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                defaultValue={selectedEmployee?.status || 'Active'}
                label="Status"
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="On Leave">On Leave</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              defaultValue={selectedEmployee?.firstName || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              defaultValue={selectedEmployee?.lastName || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              defaultValue={selectedEmployee?.email || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              defaultValue={selectedEmployee?.phone || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                defaultValue={selectedEmployee?.department || ''}
                label="Department"
              >
                <MenuItem value="Production">Production</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Quality">Quality</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Designation"
              defaultValue={selectedEmployee?.designation || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Joining Date"
              value={selectedEmployee?.joiningDate ? new Date(selectedEmployee.joiningDate) : null}
              onChange={() => {}}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Salary"
              type="number"
              defaultValue={selectedEmployee?.salary || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                defaultValue={selectedEmployee?.location || ''}
                label="Location"
              >
                <MenuItem value="Kerala Branch">Kerala Branch</MenuItem>
                <MenuItem value="Tamil Nadu Branch">Tamil Nadu Branch</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Manager"
              defaultValue={selectedEmployee?.manager || ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button variant="contained" onClick={handleCloseDialog}>
          {selectedEmployee ? 'Update' : 'Add'} Employee
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employee Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateEmployee}
        >
          Add Employee
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h5">
                {employees.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Employees
              </Typography>
              <Typography variant="h5" color="success.main">
                {employees.filter(emp => emp.status === 'Active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg KPI Score
              </Typography>
              <Typography variant="h5">
                {(employees.reduce((sum, emp) => sum + emp.kpiScore, 0) / employees.length).toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Attendance
              </Typography>
              <Typography variant="h5">
                {(employees.reduce((sum, emp) => sum + emp.attendancePercentage, 0) / employees.length).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
              <Tab label="All Employees" />
              <Tab label="Active" />
              <Tab label="Performance" />
            </Tabs>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDepartment}
                label="Department"
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Employee Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">KPI Score</TableCell>
                  <TableCell align="center">Attendance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          {employee.firstName[0]}{employee.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Email sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {employee.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {employee.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{employee.employeeId}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Work sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {employee.department}
                      </Box>
                    </TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        {employee.location}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.kpiScore}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={employee.kpiScore}
                          sx={{ width: 60, mt: 0.5 }}
                          color={getKPIColor(employee.kpiScore) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {employee.attendancePercentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={employee.attendancePercentage}
                          sx={{ width: 60, mt: 0.5 }}
                          color={employee.attendancePercentage >= 95 ? 'success' : employee.attendancePercentage >= 90 ? 'info' : 'warning'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.status}
                        color={getStatusColor(employee.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <EmployeeDialog />
    </Box>
  );
};

export default EmployeeManagement;