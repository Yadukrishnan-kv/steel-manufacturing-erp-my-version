import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  NavigateNext,
  Assignment as OrderIcon,
  Receipt as InvoiceIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import {
  useGetCustomerQuery,
  useGetSalesOrdersQuery,
} from '../../services/api';

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

const CustomerDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [editDialog, setEditDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // API hooks
  const {
    data: customer,
    isLoading,
    error,
  } = useGetCustomerQuery(id!, { skip: !id });

  const { data: salesOrdersData } = useGetSalesOrdersQuery({
    customerId: id,
    page: 1,
    limit: 10,
  }, { skip: !id });

  const salesOrders = Array.isArray(salesOrdersData) ? salesOrdersData : salesOrdersData?.orders || [];

  // Customer type configuration
  const customerTypeConfig = {
    RETAIL: { color: '#e3f2fd', textColor: '#1976d2', label: 'Retail' },
    WHOLESALE: { color: '#f3e5f5', textColor: '#7b1fa2', label: 'Wholesale' },
    CORPORATE: { color: '#e8f5e9', textColor: '#388e3c', label: 'Corporate' },
    GOVERNMENT: { color: '#fff3e0', textColor: '#f57c00', label: 'Government' },
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading customer details...</Typography>
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        <Alert severity="error">
          Failed to load customer details. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1.5 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/sales');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Sales
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/sales/customers');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Customer Management
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          {customer.name}
        </Typography>
      </Breadcrumbs>

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
          <IconButton
            onClick={() => navigate('/sales/customers')}
            sx={{ p: 0.5 }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{
            p: 1,
            borderRadius: 1.5,
            backgroundColor: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BusinessIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              mb: 0,
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1.2
            }}>
              {customer.name}
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Customer Details & History
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          onClick={() => setEditDialog(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          Edit Customer
        </Button>
      </Box>

      <Grid container spacing={1.5}>
        {/* Customer Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Customer Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Customer Type
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.label || customer.customerType}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.color,
                          color: customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.textColor,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Contact Person
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, mt: 0.5 }}>
                      {customer.contactPerson}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Phone
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {customer.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Email
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {customer.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Address
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {customer.address}, {customer.city}, {customer.state} - {customer.pincode}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                {customer.gstNumber && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        GST Number
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, mt: 0.5, color: theme.palette.primary.main }}>
                        {customer.gstNumber}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs for Orders, Invoices, etc. */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 0 }}>
              <Tabs 
                value={tabValue} 
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Sales Orders" sx={{ textTransform: 'none', fontSize: '0.875rem' }} />
                <Tab label="Invoices" sx={{ textTransform: 'none', fontSize: '0.875rem' }} />
                <Tab label="Payments" sx={{ textTransform: 'none', fontSize: '0.875rem' }} />
              </Tabs>
              
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1.5, 
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem'
                  }}>
                    Recent Sales Orders
                  </Typography>
                  
                  {salesOrders.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Order No</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salesOrders.map((order: any) => (
                            <TableRow key={order.id}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{order.orderNumber}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {new Date(order.orderDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                ₹{order.totalAmount?.toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Chip label={order.status} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      No sales orders found for this customer.
                    </Typography>
                  )}
                </Box>
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Invoice history will be displayed here.
                  </Typography>
                </Box>
              </TabPanel>
              
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Payment history will be displayed here.
                  </Typography>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OrderIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/sales/orders?customer=${customer.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Create Sales Order
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InvoiceIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/finance/invoices?customer=${customer.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  View Invoices
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Customer Statistics */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Customer Statistics
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Orders
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {salesOrders.length}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: theme.palette.primary.main }}>
                    ₹{salesOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0).toFixed(2)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Customer Since
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {customer.createdAt ? new Date(customer.createdAt).getFullYear() : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Customer editing functionality will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerDetail;