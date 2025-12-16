import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,

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
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Send,
  CheckCircle,
  Schedule,

  ShoppingCart,
} from '@mui/icons-material';

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

interface RFQDialogProps {
  open: boolean;
  onClose: () => void;
}

const RFQDialog: React.FC<RFQDialogProps> = ({ open, onClose }) => {
  const [rfqData, setRfqData] = useState({
    title: '',
    description: '',
    requiredDate: '',
    items: [{ itemCode: '', description: '', quantity: '', unit: '' }],
    selectedSuppliers: [] as string[],
  });

  const mockSuppliers = [
    { id: '1', name: 'TATA Steel Ltd', category: 'Raw Materials' },
    { id: '2', name: 'Asian Paints', category: 'Coatings' },
    { id: '3', name: 'Godrej Hardware', category: 'Hardware' },
  ];

  const handleInputChange = (field: string) => (event: any) => {
    setRfqData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const addItem = () => {
    setRfqData(prev => ({
      ...prev,
      items: [...prev.items, { itemCode: '', description: '', quantity: '', unit: '' }],
    }));
  };

  const removeItem = (index: number) => {
    setRfqData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    setRfqData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const sendRFQ = () => {
    console.log('Sending RFQ:', rfqData);
    alert('RFQ sent to selected suppliers!');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Request for Quotation (RFQ)</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="RFQ Title"
              value={rfqData.title}
              onChange={handleInputChange('title')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Required Date"
              type="date"
              value={rfqData.requiredDate}
              onChange={handleInputChange('requiredDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={rfqData.description}
              onChange={handleInputChange('description')}
            />
          </Grid>

          {/* Items Section */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Items Required</Typography>
              <Button onClick={addItem} size="small" startIcon={<Add />}>
                Add Item
              </Button>
            </Box>
            {rfqData.items.map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Item Code"
                    value={item.itemCode}
                    onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={1}>
                  <Button
                    onClick={() => removeItem(index)}
                    color="error"
                    size="small"
                    disabled={rfqData.items.length === 1}
                  >
                    ×
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Grid>

          {/* Suppliers Selection */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Select Suppliers</Typography>
            <FormControl fullWidth>
              <InputLabel>Suppliers</InputLabel>
              <Select
                multiple
                value={rfqData.selectedSuppliers}
                onChange={(e) => setRfqData(prev => ({ ...prev, selectedSuppliers: e.target.value as string[] }))}
                label="Suppliers"
              >
                {mockSuppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name} - {supplier.category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={sendRFQ} variant="contained" startIcon={<Send />}>
          Send RFQ
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ProcurementManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [rfqDialogOpen, setRfqDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for demonstration
  const mockPurchaseOrders = [
    {
      id: '1',
      poNumber: 'PO-2024-001',
      supplierName: 'TATA Steel Ltd',
      totalAmount: 250000,
      status: 'APPROVED',
      orderDate: '2024-01-15',
      expectedDelivery: '2024-01-25',
      items: 5,
    },
    {
      id: '2',
      poNumber: 'PO-2024-002',
      supplierName: 'Asian Paints',
      totalAmount: 75000,
      status: 'PENDING_APPROVAL',
      orderDate: '2024-01-16',
      expectedDelivery: '2024-01-30',
      items: 3,
    },
  ];

  const mockRFQs = [
    {
      id: '1',
      rfqNumber: 'RFQ-2024-001',
      title: 'Steel Sheets and Coating Materials',
      status: 'SENT',
      sentDate: '2024-01-10',
      responseDeadline: '2024-01-20',
      suppliersCount: 3,
      responsesReceived: 2,
    },
    {
      id: '2',
      rfqNumber: 'RFQ-2024-002',
      title: 'Hardware Components',
      status: 'DRAFT',
      sentDate: null,
      responseDeadline: '2024-01-25',
      suppliersCount: 2,
      responsesReceived: 0,
    },
  ];

  const mockPurchaseRequisitions = [
    {
      id: '1',
      prNumber: 'PR-2024-001',
      requestedBy: 'Production Team',
      department: 'Manufacturing',
      status: 'APPROVED',
      requestDate: '2024-01-12',
      requiredDate: '2024-01-22',
      items: 4,
      estimatedValue: 180000,
    },
    {
      id: '2',
      prNumber: 'PR-2024-002',
      requestedBy: 'Inventory Team',
      department: 'Warehouse',
      status: 'PENDING',
      requestDate: '2024-01-14',
      requiredDate: '2024-01-28',
      items: 2,
      estimatedValue: 95000,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING_APPROVAL': case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'SENT': return 'info';
      case 'DRAFT': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Procurement Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Send />}
            onClick={() => setRfqDialogOpen(true)}
          >
            Create RFQ
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Navigate to create PO */}}
          >
            New Purchase Order
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Purchase Orders</Typography>
              </Box>
              <Typography variant="h4">{mockPurchaseOrders.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Send sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Active RFQs</Typography>
              </Box>
              <Typography variant="h4">{mockRFQs.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Pending Approvals</Typography>
              </Box>
              <Typography variant="h4">
                {mockPurchaseOrders.filter(po => po.status === 'PENDING_APPROVAL').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Approved This Month</Typography>
              </Box>
              <Typography variant="h4">
                {mockPurchaseOrders.filter(po => po.status === 'APPROVED').length}
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
            placeholder="Search by PO number, supplier, or RFQ..."
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
            <Tab label="Purchase Orders" />
            <Tab label="RFQs" />
            <Tab label="Purchase Requisitions" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Expected Delivery</TableCell>
                    <TableCell align="center">Items</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {po.poNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{po.supplierName}</TableCell>
                      <TableCell align="right">₹{po.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={po.status.replace('_', ' ')}
                          color={getStatusColor(po.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(po.expectedDelivery).toLocaleDateString()}</TableCell>
                      <TableCell align="center">{po.items}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit PO">
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
                    <TableCell>RFQ Number</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent Date</TableCell>
                    <TableCell>Deadline</TableCell>
                    <TableCell align="center">Suppliers</TableCell>
                    <TableCell align="center">Responses</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockRFQs.map((rfq) => (
                    <TableRow key={rfq.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {rfq.rfqNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{rfq.title}</TableCell>
                      <TableCell>
                        <Chip
                          label={rfq.status}
                          color={getStatusColor(rfq.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {rfq.sentDate ? new Date(rfq.sentDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{new Date(rfq.responseDeadline).toLocaleDateString()}</TableCell>
                      <TableCell align="center">{rfq.suppliersCount}</TableCell>
                      <TableCell align="center">
                        {rfq.responsesReceived}/{rfq.suppliersCount}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit RFQ">
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

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>PR Number</TableCell>
                    <TableCell>Requested By</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Request Date</TableCell>
                    <TableCell>Required Date</TableCell>
                    <TableCell align="right">Est. Value</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPurchaseRequisitions.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {pr.prNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{pr.requestedBy}</TableCell>
                      <TableCell>{pr.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={pr.status}
                          color={getStatusColor(pr.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(pr.requestDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(pr.requiredDate).toLocaleDateString()}</TableCell>
                      <TableCell align="right">₹{pr.estimatedValue.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Approve/Reject">
                          <CheckCircle />
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

      {/* RFQ Dialog */}
      <RFQDialog
        open={rfqDialogOpen}
        onClose={() => setRfqDialogOpen(false)}
      />
    </Box>
  );
};

export default ProcurementManagement;