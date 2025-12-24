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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  NavigateNext,
  Assignment as BOMIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useCreateBOMMutation,
  useGetProductsQuery,
  useGetInventoryItemsForBOMQuery,
} from '../../services/api';

// Validation schema
const bomItemSchema = yup.object({
  inventoryItemId: yup.string().required('Inventory item is required'),
  quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  unit: yup.string().required('Unit is required'),
  scrapPercentage: yup.number().min(0, 'Scrap percentage must be non-negative').max(100, 'Scrap percentage cannot exceed 100%').required('Scrap percentage is required'),
  operation: yup.string().optional(),
  level: yup.number().min(1, 'Level must be at least 1').required('Level is required'),
  sequence: yup.number().min(1, 'Sequence must be at least 1').required('Sequence is required'),
});

const schema = yup.object({
  productId: yup.string().required('Product is required'),
  revision: yup.string().required('Revision is required'),
  effectiveDate: yup.string().required('Effective date is required'),
  engineeringChangeNumber: yup.string().optional(),
  items: yup.array().of(bomItemSchema).required().min(1, 'At least one BOM item is required'),
});

interface BOMFormData {
  productId: string;
  revision: string;
  effectiveDate: string;
  engineeringChangeNumber?: string;
  items: {
    inventoryItemId: string;
    quantity: number;
    unit: string;
    scrapPercentage: number;
    operation?: string;
    level: number;
    sequence: number;
  }[];
}

const CreateBOM: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [createBOM, { isLoading }] = useCreateBOMMutation();
  const { data: productsData } = useGetProductsQuery();
  const { data: inventoryItemsData } = useGetInventoryItemsForBOMQuery();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Extract data from API response
  const products = Array.isArray(productsData) ? productsData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BOMFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      effectiveDate: new Date().toISOString().split('T')[0],
      items: [
        {
          inventoryItemId: '',
          quantity: 1,
          unit: '',
          scrapPercentage: 0,
          operation: '',
          level: 1,
          sequence: 1,
        }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onSubmit = async (data: BOMFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      // Prepare BOM data
      const bomData = {
        productId: data.productId,
        revision: data.revision,
        effectiveDate: new Date(data.effectiveDate).toISOString(),
        engineeringChangeNumber: data.engineeringChangeNumber || undefined,
        items: data.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unit: item.unit,
          scrapPercentage: item.scrapPercentage,
          operation: item.operation || '',
          level: item.level,
          sequence: item.sequence,
        })),
      };

      await createBOM(bomData).unwrap();
      
      setSubmitSuccess(true);
      
      // Navigate back to BOM management after a short delay
      setTimeout(() => {
        navigate('/manufacturing/bom-management');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating BOM:', err);
      setSubmitError(err?.data?.error?.message || 'Failed to create BOM');
    }
  };

  const handleCancel = () => {
    navigate('/manufacturing/bom-management');
  };

  const addBOMItem = () => {
    append({
      inventoryItemId: '',
      quantity: 1,
      unit: '',
      scrapPercentage: 0,
      operation: '',
      level: 1,
      sequence: fields.length + 1,
    });
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
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/manufacturing/bom-management');
            }}
            sx={{ fontSize: '0.75rem' }}
          >
            BOM Management
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>New BOM</Typography>
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
              <BOMIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Create New Bill of Materials
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Define product structure with multi-level BOM support
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success Message */}
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            BOM created successfully! Redirecting to BOM management...
          </Alert>
        )}

        {/* Error Message */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {submitError}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1.5}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1.5, 
                    color: theme.palette.text.primary, 
                    fontSize: '0.875rem' 
                  }}>
                    Basic Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Product Selection */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!errors.productId} size="small">
                        <InputLabel>Product *</InputLabel>
                        <Controller
                          name="productId"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Product *"
                            >
                              {products.map((product: any) => (
                                <MenuItem key={product.id} value={product.id}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                      {product.code} - {product.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                      {product.category} | {product.type}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                        {errors.productId && (
                          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                            {errors.productId.message}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Revision */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="revision"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Revision *"
                            fullWidth
                            error={!!errors.revision}
                            helperText={errors.revision?.message}
                            placeholder="e.g., Rev-001, V1.0, A"
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Effective Date */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="effectiveDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Effective Date *"
                            type="date"
                            fullWidth
                            error={!!errors.effectiveDate}
                            helperText={errors.effectiveDate?.message}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Engineering Change Number */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="engineeringChangeNumber"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Engineering Change Number"
                            fullWidth
                            error={!!errors.engineeringChangeNumber}
                            helperText={errors.engineeringChangeNumber?.message}
                            placeholder="e.g., ECN-2024-001"
                            size="small"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* BOM Items */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary, 
                      fontSize: '0.875rem' 
                    }}>
                      BOM Items ({fields.length})
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                      onClick={addBOMItem}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5
                      }}
                    >
                      Add Item
                    </Button>
                  </Box>

                  {fields.length > 0 ? (
                    <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Inventory Item *</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Qty *</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Unit *</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Scrap %</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Operation</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Level</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Seq</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell sx={{ p: 1 }}>
                                <FormControl fullWidth size="small" error={!!errors.items?.[index]?.inventoryItemId}>
                                  <Controller
                                    name={`items.${index}.inventoryItemId`}
                                    control={control}
                                    render={({ field }) => (
                                      <Select
                                        {...field}
                                        displayEmpty
                                        sx={{ fontSize: '0.75rem' }}
                                      >
                                        <MenuItem value="" disabled>
                                          Select item
                                        </MenuItem>
                                        {inventoryItems.map((item: any) => (
                                          <MenuItem key={item.id} value={item.id}>
                                            <Box>
                                              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                {item.itemCode}
                                              </Typography>
                                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                                {item.name}
                                              </Typography>
                                            </Box>
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    )}
                                  />
                                </FormControl>
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.quantity`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      error={!!errors.items?.[index]?.quantity}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      sx={{ width: 80 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.unit`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      size="small"
                                      error={!!errors.items?.[index]?.unit}
                                      placeholder="kg, pcs"
                                      sx={{ width: 80 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.scrapPercentage`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      error={!!errors.items?.[index]?.scrapPercentage}
                                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                                      sx={{ width: 70 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.operation`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      size="small"
                                      placeholder="CUTTING"
                                      sx={{ width: 100 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.level`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      error={!!errors.items?.[index]?.level}
                                      inputProps={{ min: 1, max: 10 }}
                                      sx={{ width: 60 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <Controller
                                  name={`items.${index}.sequence`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      type="number"
                                      size="small"
                                      error={!!errors.items?.[index]?.sequence}
                                      inputProps={{ min: 1 }}
                                      sx={{ width: 60 }}
                                    />
                                  )}
                                />
                              </TableCell>
                              <TableCell sx={{ p: 1 }}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{
                      p: 3,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                      backgroundColor: 'grey.50',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        No BOM items added yet.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                        Click "Add Item" to define the materials and components needed for this product.
                      </Typography>
                    </Box>
                  )}

                  {errors.items && (
                    <Alert severity="error" sx={{ mt: 1.5, fontSize: '0.75rem' }}>
                      {errors.items.message}
                    </Alert>
                  )}
                </CardContent>
              </Card>
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
                  {isLoading ? 'Creating...' : 'Create BOM'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
    </Box>
  );
};

export default CreateBOM;