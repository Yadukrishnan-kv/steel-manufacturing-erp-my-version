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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Calculate,
  LocationOn,
  Phone,

} from '@mui/icons-material';
import { useGetSalesOrdersQuery } from '../../services/api';

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

interface EstimationDialogProps {
  open: boolean;
  onClose: () => void;
}

const EstimationDialog: React.FC<EstimationDialogProps> = ({ open, onClose }) => {
  const [estimationData, setEstimationData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    address: '',
    productType: '',
    width: '',
    height: '',
    quantity: '',
    coatingType: '',
    hardwareType: '',
    laborType: '',
  });

  const handleInputChange = (field: string) => (event: any) => {
    setEstimationData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const calculateEstimation = () => {
    // Mock calculation logic
    const basePrice = parseFloat(estimationData.width) * parseFloat(estimationData.height) * 150; // ₹150 per sq ft
    const coatingCost = estimationData.coatingType === 'premium' ? basePrice * 0.3 : basePrice * 0.15;
    const hardwareCost = estimationData.hardwareType === 'premium' ? 2000 : 1000;
    const laborCost = estimationData.laborType === 'installation' ? basePrice * 0.2 : 0;
    const totalPerUnit = basePrice + coatingCost + hardwareCost + laborCost;
    const totalAmount = totalPerUnit * parseInt(estimationData.quantity || '1');

    alert(`Estimation: ₹${totalAmount.toLocaleString()} for ${estimationData.quantity} units`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Estimation</DialogTitle>
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
              value={estimationData.customerName}
              onChange={handleInputChange('customerName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Number"
              value={estimationData.contactNumber}
              onChange={handleInputChange('contactNumber')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={estimationData.email}
              onChange={handleInputChange('email')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Address"
              value={estimationData.address}
              onChange={handleInputChange('address')}
            />
          </Grid>

          {/* Product Specifications */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Product Specifications</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Product Type</InputLabel>
              <Select
                value={estimationData.productType}
                onChange={handleInputChange('productType')}
                label="Product Type"
              >
                <MenuItem value="door">Steel Door</MenuItem>
                <MenuItem value="window">Steel Window</MenuItem>
                <MenuItem value="frame">Steel Frame</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={estimationData.quantity}
              onChange={handleInputChange('quantity')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Width (ft)"
              type="number"
              value={estimationData.width}
              onChange={handleInputChange('width')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Height (ft)"
              type="number"
              value={estimationData.height}
              onChange={handleInputChange('height')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Coating Type</InputLabel>
              <Select
                value={estimationData.coatingType}
                onChange={handleInputChange('coatingType')}
                label="Coating Type"
              >
                <MenuItem value="standard">Standard Coating</MenuItem>
                <MenuItem value="premium">Premium Coating</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Hardware Type</InputLabel>
              <Select
                value={estimationData.hardwareType}
                onChange={handleInputChange('hardwareType')}
                label="Hardware Type"
              >
                <MenuItem value="standard">Standard Hardware</MenuItem>
                <MenuItem value="premium">Premium Hardware</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Labor Type</InputLabel>
              <Select
                value={estimationData.laborType}
                onChange={handleInputChange('laborType')}
                label="Labor Type"
              >
                <MenuItem value="supply_only">Supply Only</MenuItem>
                <MenuItem value="installation">Supply + Installation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={calculateEstimation} variant="contained" startIcon={<Calculate />}>
          Calculate Estimation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SalesOrderManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  
  const {
    data: salesOrders,
    isLoading,
    error,
  } = useGetSalesOrdersQuery();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for demonstration
  const mockSalesOrders = salesOrders || [
    {
      id: '1',
      orderNumber: 'SO-2024-001',
      customerName: 'ABC Industries',
      contactNumber: '+91 9876543210',
      email: 'contact@abcindustries.com',
      productType: 'Steel Door',
      quantity: 5,
      totalAmount: 125000,
      status: 'CONFIRMED',
      orderDate: '2024-01-15',
      deliveryDate: '2024-02-15',
      location: 'Kochi, Kerala',
    },
    {
      id: '2',
      orderNumber: 'SO-2024-002',
      customerName: 'XYZ Construction',
      contactNumber: '+91 9876543211',
      email: 'orders@xyzconstruction.com',
      productType: 'Steel Window',
      quantity: 12,
      totalAmount: 180000,
      status: 'PENDING',
      orderDate: '2024-01-16',
      deliveryDate: '2024-02-20',
      location: 'Chennai, Tamil Nadu',
    },
  ];

  const mockLeads = [
    {
      id: '1',
      leadNumber: 'LD-2024-001',
      customerName: 'New Customer 1',
      contactNumber: '+91 9876543212',
      source: 'Facebook',
      productInterest: 'Steel Door',
      status: 'NEW',
      createdDate: '2024-01-17',
      location: 'Trivandrum, Kerala',
    },
    {
      id: '2',
      leadNumber: 'LD-2024-002',
      customerName: 'New Customer 2',
      contactNumber: '+91 9876543213',
      source: 'Google Ads',
      productInterest: 'Steel Frame',
      status: 'CONTACTED',
      createdDate: '2024-01-17',
      location: 'Coimbatore, Tamil Nadu',
    },
  ];

  const filteredOrders = mockSalesOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = mockLeads.filter(lead =>
    lead.leadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      case 'NEW': return 'info';
      case 'CONTACTED': return 'primary';
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
        Failed to load sales data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sales Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={() => setEstimationDialogOpen(true)}
          >
            Create Estimation
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Navigate to create order */}}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Total Orders</Typography>
              <Typography variant="h4">{mockSalesOrders.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Confirmed</Typography>
              <Typography variant="h4">
                {mockSalesOrders.filter(o => o.status === 'CONFIRMED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Pending</Typography>
              <Typography variant="h4">
                {mockSalesOrders.filter(o => o.status === 'PENDING').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">New Leads</Typography>
              <Typography variant="h4">{mockLeads.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by order number or customer name..."
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

      {/* Tabs for Orders and Leads */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Sales Orders" />
            <Tab label="Leads" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Delivery Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.customerName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Phone sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {order.contactNumber}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {order.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{order.productType}</TableCell>
                      <TableCell align="right">{order.quantity}</TableCell>
                      <TableCell align="right">₹{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit Order">
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
                    <TableCell>Lead Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Product Interest</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {lead.leadNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {lead.customerName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Phone sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {lead.contactNumber}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {lead.location}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.source} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{lead.productInterest}</TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status}
                          color={getStatusColor(lead.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(lead.createdDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Convert to Order">
                          <Add />
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

      {/* Estimation Dialog */}
      <EstimationDialog
        open={estimationDialogOpen}
        onClose={() => setEstimationDialogOpen(false)}
      />
    </Box>
  );
};

export default SalesOrderManagement;