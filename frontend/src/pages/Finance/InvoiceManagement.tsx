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
  Paper,
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  Download,
  Send,
  FilterList,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  gstRate: number;
}

// Mock data
const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customer: 'ABC Steel Works',
    amount: 50000,
    gstAmount: 9000,
    totalAmount: 59000,
    status: 'Paid',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    items: [],
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customer: 'XYZ Construction',
    amount: 75000,
    gstAmount: 13500,
    totalAmount: 88500,
    status: 'Sent',
    issueDate: '2024-01-20',
    dueDate: '2024-02-20',
    items: [],
  },
  {
    id: '3',
    invoiceNumber: 'INV-2024-003',
    customer: 'Modern Builders',
    amount: 32000,
    gstAmount: 5760,
    totalAmount: 37760,
    status: 'Overdue',
    issueDate: '2024-01-10',
    dueDate: '2024-02-10',
    items: [],
  },
];

const InvoiceManagement: React.FC = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Sent': return 'info';
      case 'Draft': return 'default';
      case 'Overdue': return 'error';
      case 'Cancelled': return 'secondary';
      default: return 'default';
    }
  };

  const filteredInvoices = filterStatus === 'All' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus);

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setOpenDialog(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const InvoiceDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedInvoice ? 'Edit Invoice' : 'Create New Invoice'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Customer"
              defaultValue={selectedInvoice?.customer || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              defaultValue={selectedInvoice?.invoiceNumber || ''}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Issue Date"
              value={selectedInvoice?.issueDate ? new Date(selectedInvoice.issueDate) : null}
              onChange={() => {}}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Due Date"
              value={selectedInvoice?.dueDate ? new Date(selectedInvoice.dueDate) : null}
              onChange={() => {}}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Invoice Items
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">GST %</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <TextField size="small" placeholder="Item description" />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" sx={{ width: 100 }} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" sx={{ width: 80 }} />
                    </TableCell>
                    <TableCell align="right">₹0.00</TableCell>
                    <TableCell align="center">
                      <Button size="small">Add</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Grid container spacing={2} sx={{ maxWidth: 300 }}>
                <Grid item xs={6}>
                  <Typography>Subtotal:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right">₹{selectedInvoice?.amount.toLocaleString() || '0.00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>GST:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography align="right">₹{selectedInvoice?.gstAmount.toLocaleString() || '0.00'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h6" align="right">₹{selectedInvoice?.totalAmount.toLocaleString() || '0.00'}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button variant="contained" onClick={handleCloseDialog}>
          {selectedInvoice ? 'Update' : 'Create'} Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Invoice Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateInvoice}
        >
          Create Invoice
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Invoices
              </Typography>
              <Typography variant="h5">
                {invoices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h5">
                ₹{invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Paid Amount
              </Typography>
              <Typography variant="h5" color="success.main">
                ₹{invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Outstanding
              </Typography>
              <Typography variant="h5" color="warning.main">
                ₹{invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
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
              <Tab label="All Invoices" />
              <Tab label="Recent" />
              <Tab label="Overdue" />
            </Tabs>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Draft">Draft</MenuItem>
                  <MenuItem value="Sent">Sent</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
              <Button startIcon={<FilterList />}>More Filters</Button>
            </Box>
          </Box>

          {/* Invoice Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">GST</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customer}</TableCell>
                    <TableCell align="right">₹{invoice.amount.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{invoice.gstAmount.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{invoice.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{invoice.issueDate}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.status}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleEditInvoice(invoice)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Download />
                      </IconButton>
                      <IconButton size="small">
                        <Send />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <InvoiceDialog />
    </Box>
  );
};

export default InvoiceManagement;