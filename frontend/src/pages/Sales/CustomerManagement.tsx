import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  NavigateNext,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
} from '../../services/api';

// Validation schema
const customerSchema = yup.object({
  name: yup.string().required('Customer name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  pincode: yup.string().required('Pincode is required'),
  gstNumber: yup.string().optional(),
  contactPerson: yup.string().required('Contact person is required'),
  customerType: yup.string().required('Customer type is required'),
});

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  contactPerson: string;
  customerType: string;
}

const CustomerManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  
  // API hooks
  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useGetCustomersQuery({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();

  // Extract data
  const customers = Array.isArray(customersData) ? customersData : customersData?.customers || [];
  const totalCount = customersData?.pagination?.total || customers.length;

  // Form handling
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormData>({
    resolver: yupResolver(customerSchema) as any,
    defaultValues: {
      customerType: 'RETAIL',
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      await createCustomer(data).unwrap();
      setCreateDialog(false);
      reset();
      refetch();
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  // Customer type configuration
  const customerTypeConfig = {
    RETAIL: { color: '#e3f2fd', textColor: '#1976d2', label: 'Retail' },
    WHOLESALE: { color: '#f3e5f5', textColor: '#7b1fa2', label: 'Wholesale' },
    CORPORATE: { color: '#e8f5e9', textColor: '#388e3c', label: 'Corporate' },
    GOVERNMENT: { color: '#fff3e0', textColor: '#f57c00', label: 'Government' },
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: 'calc(100vh - 64px)', py: 1.5, px: 1.5 }}>
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
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          Customer Management
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
              Customer Management
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Manage customer information and relationships
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => setCreateDialog(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          New Customer
        </Button>
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
        <Chip
          icon={<BusinessIcon />}
          label={`${totalCount} Total Customers`}
          size="small"
          sx={{
            bgcolor: `${theme.palette.primary.light}15`,
            color: theme.palette.primary.main,
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { color: theme.palette.primary.main, fontSize: 16 }
          }}
        />
      </Box>

      {/* Search Section */}
      <Box sx={{
        display: 'flex',
        gap: 1.5,
        mb: 1.5,
        p: 1.5,
        backgroundColor: '#f8f9fa',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <TextField
          size="small"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: { height: 32, fontSize: '0.75rem' }
          }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      {/* Data Table */}
      <TableContainer sx={{
        maxHeight: 'calc(100vh - 320px)',
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Customer Name
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Contact Person
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Contact Info
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Location
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Type
              </TableCell>
              <TableCell sx={{
                fontWeight: 700,
                fontSize: '0.75rem',
                p: '6px 8px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                borderBottom: '2px solid',
                borderColor: 'divider'
              }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer: any) => (
              <TableRow 
                key={customer.id}
                hover
                sx={{
                  '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                  '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
                      {customer.name}
                    </Typography>
                    {customer.gstNumber && (
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        GST: {customer.gstNumber}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  {customer.contactPerson}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {customer.phone}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                        {customer.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {customer.city}, {customer.state}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Chip
                    label={customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.label || customer.customerType}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.color,
                      color: customerTypeConfig[customer.customerType as keyof typeof customerTypeConfig]?.textColor,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        sx={{ p: 0.5 }}
                        onClick={() => navigate(`/sales/customers/${customer.id}`)}
                      >
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" sx={{ p: 0.5 }}>
                        <EditIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          '.MuiTablePagination-toolbar': { minHeight: 40, padding: '4px 12px' },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem', m: 0 },
          '.MuiTablePagination-select': { fontSize: '0.75rem' },
          '.MuiIconButton-root': { padding: '4px', '& .MuiSvgIcon-root': { fontSize: 16 } }
        }}
      />

      {/* Create Customer Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Customer Name *"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="contactPerson"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Contact Person *"
                      fullWidth
                      size="small"
                      error={!!errors.contactPerson}
                      helperText={errors.contactPerson?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email *"
                      fullWidth
                      size="small"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Phone *"
                      fullWidth
                      size="small"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address *"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="City *"
                      fullWidth
                      size="small"
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="State *"
                      fullWidth
                      size="small"
                      error={!!errors.state}
                      helperText={errors.state?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Controller
                  name="pincode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Pincode *"
                      fullWidth
                      size="small"
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="gstNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="GST Number"
                      fullWidth
                      size="small"
                      error={!!errors.gstNumber}
                      helperText={errors.gstNumber?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="customerType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.customerType}>
                      <InputLabel>Customer Type *</InputLabel>
                      <Select {...field} label="Customer Type *">
                        <MenuItem value="RETAIL">Retail</MenuItem>
                        <MenuItem value="WHOLESALE">Wholesale</MenuItem>
                        <MenuItem value="CORPORATE">Corporate</MenuItem>
                        <MenuItem value="GOVERNMENT">Government</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit(onSubmit)}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Customer details are now shown in the dedicated detail page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Loading and Error States */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading customers...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load customers. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default CustomerManagement;
