import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  NavigateNext,
  Factory as FactoryIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateProductionOrderMutation, useGetBOMsQuery, useGetBranchesQuery } from '../../services/api';

// Validation schema
const schema = yup.object({
  bomId: yup.string().required('BOM is required'),
  quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  priority: yup.number().min(1).max(10).optional(),
  bufferDays: yup.number().min(0).optional(),
  branchId: yup.string().required('Branch is required'),
  salesOrderId: yup.string().optional(),
  productId: yup.string().optional(),
});

interface ProductionOrderFormData {
  bomId: string;
  quantity: number;
  priority?: number;
  bufferDays?: number;
  branchId: string;
  salesOrderId?: string;
  productId?: string;
}

// Mock data for sales orders (would come from API in real implementation)
const mockSalesOrders = [
  { id: '1', orderNumber: 'SO-2024-001', customerName: 'ABC Construction' },
  { id: '2', orderNumber: 'SO-2024-002', customerName: 'XYZ Builders' },
  { id: '3', orderNumber: 'SO-2024-003', customerName: 'DEF Contractors' },
];

const CreateProductionOrder: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [createProductionOrder, { isLoading }] = useCreateProductionOrderMutation();
  const { data: boms, isLoading: bomsLoading } = useGetBOMsQuery({});
  const { data: branches, isLoading: branchesLoading } = useGetBranchesQuery({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductionOrderFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      quantity: 1,
      priority: 5,
      bufferDays: 2,
    },
  });

  const onSubmit = async (data: ProductionOrderFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      await createProductionOrder(data).unwrap();
      
      setSubmitSuccess(true);
      
      // Navigate back to manufacturing dashboard after a short delay
      setTimeout(() => {
        navigate('/manufacturing');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating production order:', err);
      setSubmitError(err?.data?.error?.message || 'Failed to create production order');
    }
  };

  const handleCancel = () => {
    navigate('/manufacturing');
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1.5 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/manufacturing');
            }}
            sx={{ fontSize: '0.75rem' }}
          >
            Manufacturing
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>New Production Order</Typography>
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
              onClick={handleCancel}
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
              <FactoryIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Create New Production Order
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Set up a new production order with BOM, quantities, and scheduling
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success Message */}
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            Production order created successfully! Redirecting to dashboard...
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <Card sx={{ borderRadius: 1.5 }}>
          <CardContent sx={{ p: 1.5 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1, 
                    color: theme.palette.text.primary, 
                    fontSize: '0.875rem' 
                  }}>
                    Basic Information
                  </Typography>
                </Grid>

              {/* BOM Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.bomId}>
                  <InputLabel>Bill of Materials (BOM) *</InputLabel>
                  <Controller
                    name="bomId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Bill of Materials (BOM) *"
                      >
                        {bomsLoading ? (
                          <MenuItem disabled>Loading BOMs...</MenuItem>
                        ) : (
                          (boms || []).map((bom: any) => (
                            <MenuItem key={bom.id} value={bom.id}>
                              {bom.product?.name || 'Unknown Product'} - {bom.revision}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    )}
                  />
                  {errors.bomId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.bomId.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Branch Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.branchId}>
                  <InputLabel>Branch *</InputLabel>
                  <Controller
                    name="branchId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Branch *"
                      >
                        {branchesLoading ? (
                          <MenuItem disabled>Loading branches...</MenuItem>
                        ) : (
                          (branches?.data || []).map((branch: any) => (
                            <MenuItem key={branch.id} value={branch.id}>
                              {branch.name} - {branch.city}, {branch.state}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    )}
                  />
                  {errors.branchId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.branchId.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity *"
                      type="number"
                      fullWidth
                      error={!!errors.quantity}
                      helperText={errors.quantity?.message}
                      inputProps={{ min: 1 }}
                    />
                  )}
                />
              </Grid>

              {/* Priority */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Priority (1-10)"
                      type="number"
                      fullWidth
                      error={!!errors.priority}
                      helperText={errors.priority?.message || "1 = Lowest, 10 = Highest"}
                      inputProps={{ min: 1, max: 10 }}
                    />
                  )}
                />
              </Grid>

              {/* Buffer Days */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="bufferDays"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Buffer Days"
                      type="number"
                      fullWidth
                      error={!!errors.bufferDays}
                      helperText={errors.bufferDays?.message || "Additional days for delivery"}
                      inputProps={{ min: 0 }}
                    />
                  )}
                />
              </Grid>

                {/* Optional Information */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1, 
                    mt: 1,
                    color: theme.palette.text.primary, 
                    fontSize: '0.875rem' 
                  }}>
                    Optional Information
                  </Typography>
                </Grid>

              {/* Sales Order */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sales Order (Optional)</InputLabel>
                  <Controller
                    name="salesOrderId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Sales Order (Optional)"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {mockSalesOrders.map((order) => (
                          <MenuItem key={order.id} value={order.id}>
                            {order.orderNumber} - {order.customerName}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              {/* Product ID (if not linked to sales order) */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="productId"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Product ID (Optional)"
                      fullWidth
                      helperText="Leave empty if linked to sales order"
                    />
                  )}
                />
              </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleCancel}
                      disabled={isLoading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      startIcon={isLoading ? <CircularProgress size={16} /> : <Save sx={{ fontSize: 16 }} />}
                      disabled={isLoading}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5
                      }}
                    >
                      {isLoading ? 'Creating...' : 'Create Order'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
    </Box>
  );
};

export default CreateProductionOrder;