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
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Build,
  Schedule,
  LocationOn,
  Phone,
  CheckCircle,

  Assignment,
  Person,
} from '@mui/icons-material';
import { useGetServiceRequestsQuery } from '../../services/api';

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

interface ServiceRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

const ServiceRequestDialog: React.FC<ServiceRequestDialogProps> = ({ open, onClose }) => {
  const [serviceData, setServiceData] = useState({
    customerName: '',
    contactNumber: '',
    address: '',
    serviceType: '',
    priority: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    assignedTechnician: '',
  });

  const serviceTypes = [
    'INSTALLATION',
    'MAINTENANCE',
    'REPAIR',
    'WARRANTY_CLAIM',
  ];

  const priorities = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ];

  const mockTechnicians = [
    { id: '1', name: 'Rajesh Kumar', expertise: 'Installation', location: 'Kochi' },
    { id: '2', name: 'Suresh Nair', expertise: 'Repair', location: 'Chennai' },
    { id: '3', name: 'Arun Pillai', expertise: 'Maintenance', location: 'Trivandrum' },
  ];

  const handleInputChange = (field: string) => (event: any) => {
    setServiceData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const createServiceRequest = () => {
    console.log('Creating service request:', serviceData);
    alert('Service request created successfully!');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Service Request</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Customer Information</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Customer Name"
              value={serviceData.customerName}
              onChange={handleInputChange('customerName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              value={serviceData.contactNumber}
              onChange={handleInputChange('contactNumber')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Address"
              multiline
              rows={2}
              value={serviceData.address}
              onChange={handleInputChange('address')}
            />
          </Grid>

          {/* Service Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Service Details</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={serviceData.serviceType}
                onChange={handleInputChange('serviceType')}
                label="Service Type"
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={serviceData.priority}
                onChange={handleInputChange('priority')}
                label="Priority"
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Service Description"
              multiline
              rows={3}
              value={serviceData.description}
              onChange={handleInputChange('description')}
            />
          </Grid>

          {/* Scheduling */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Scheduling</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preferred Date"
              type="date"
              value={serviceData.preferredDate}
              onChange={handleInputChange('preferredDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preferred Time"
              type="time"
              value={serviceData.preferredTime}
              onChange={handleInputChange('preferredTime')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Assign Technician</InputLabel>
              <Select
                value={serviceData.assignedTechnician}
                onChange={handleInputChange('assignedTechnician')}
                label="Assign Technician"
              >
                {mockTechnicians.map((tech) => (
                  <MenuItem key={tech.id} value={tech.id}>
                    {tech.name} - {tech.expertise} ({tech.location})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={createServiceRequest} variant="contained">
          Create Service Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ServiceManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);

  const {
    data: serviceRequests,
    isLoading,
    error,
  } = useGetServiceRequestsQuery();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for demonstration
  const mockServiceRequests = serviceRequests || [
    {
      id: '1',
      requestNumber: 'SR-2024-001',
      customerName: 'ABC Industries',
      contactNumber: '+91 9876543210',
      serviceType: 'INSTALLATION',
      priority: 'HIGH',
      status: 'SCHEDULED',
      assignedTechnician: 'Rajesh Kumar',
      scheduledDate: '2024-01-18',
      location: 'Kochi, Kerala',
      description: 'Steel door installation at new facility',
    },
    {
      id: '2',
      requestNumber: 'SR-2024-002',
      customerName: 'XYZ Construction',
      contactNumber: '+91 9876543211',
      serviceType: 'REPAIR',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      assignedTechnician: 'Suresh Nair',
      scheduledDate: '2024-01-17',
      location: 'Chennai, Tamil Nadu',
      description: 'Window frame alignment issue',
    },
  ];

  const mockAMCContracts = [
    {
      id: '1',
      contractNumber: 'AMC-2024-001',
      customerName: 'ABC Industries',
      contractValue: 50000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'ACTIVE',
      nextServiceDue: '2024-02-01',
      servicesCompleted: 2,
      totalServices: 12,
    },
    {
      id: '2',
      contractNumber: 'AMC-2024-002',
      customerName: 'DEF Corporation',
      contractValue: 75000,
      startDate: '2024-01-15',
      endDate: '2025-01-14',
      status: 'ACTIVE',
      nextServiceDue: '2024-01-25',
      servicesCompleted: 0,
      totalServices: 12,
    },
  ];

  const mockTechnicians = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      expertise: 'Installation',
      location: 'Kochi',
      activeJobs: 3,
      completedJobs: 45,
      rating: 4.8,
      status: 'AVAILABLE',
    },
    {
      id: '2',
      name: 'Suresh Nair',
      expertise: 'Repair',
      location: 'Chennai',
      activeJobs: 2,
      completedJobs: 38,
      rating: 4.6,
      status: 'BUSY',
    },
    {
      id: '3',
      name: 'Arun Pillai',
      expertise: 'Maintenance',
      location: 'Trivandrum',
      activeJobs: 1,
      completedJobs: 52,
      rating: 4.9,
      status: 'AVAILABLE',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      case 'ACTIVE': return 'success';
      case 'EXPIRED': return 'error';
      case 'AVAILABLE': return 'success';
      case 'BUSY': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

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
        Failed to load service data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Service Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setServiceDialogOpen(true)}
        >
          New Service Request
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Build sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Service Requests</Typography>
              </Box>
              <Typography variant="h4">{mockServiceRequests.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">In Progress</Typography>
              </Box>
              <Typography variant="h4">
                {mockServiceRequests.filter(sr => sr.status === 'IN_PROGRESS').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">AMC Contracts</Typography>
              </Box>
              <Typography variant="h4">{mockAMCContracts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Available Technicians</Typography>
              </Box>
              <Typography variant="h4">
                {mockTechnicians.filter(t => t.status === 'AVAILABLE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by request number, customer name, or technician..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Service Requests" />
            <Tab label="AMC Contracts" />
            <Tab label="Technicians" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Service Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Technician</TableCell>
                    <TableCell>Scheduled Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockServiceRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {request.requestNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {request.customerName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Phone sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {request.contactNumber}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {request.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={request.serviceType.replace('_', ' ')} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.priority}
                          color={getPriorityColor(request.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status.replace('_', ' ')}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{request.assignedTechnician}</TableCell>
                      <TableCell>{new Date(request.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit Request">
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Next Service</TableCell>
                    <TableCell align="center">Progress</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockAMCContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {contract.contractNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{contract.customerName}</TableCell>
                      <TableCell align="right">₹{contract.contractValue.toLocaleString()}</TableCell>
                      <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(contract.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(contract.nextServiceDue).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {contract.servicesCompleted}/{contract.totalServices}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Schedule Service">
                          <Schedule />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Technician</TableCell>
                    <TableCell>Expertise</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="center">Active Jobs</TableCell>
                    <TableCell align="center">Completed</TableCell>
                    <TableCell align="center">Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockTechnicians.map((technician) => (
                    <TableRow key={technician.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {technician.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {technician.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{technician.expertise}</TableCell>
                      <TableCell>{technician.location}</TableCell>
                      <TableCell align="center">{technician.activeJobs}</TableCell>
                      <TableCell align="center">{technician.completedJobs}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 0.5 }}>
                            {technician.rating}
                          </Typography>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={technician.status}
                          color={getStatusColor(technician.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Profile">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Assign Job">
                          <Assignment />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Service Request Dialog */}
      <ServiceRequestDialog
        open={serviceDialogOpen}
        onClose={() => setServiceDialogOpen(false)}
      />
    </Box>
  );
};

export default ServiceManagement;