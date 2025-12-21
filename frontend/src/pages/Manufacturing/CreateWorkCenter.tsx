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
  Build as BuildIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateWorkCenterMutation } from '../../services/api';

// Validation schema
const operationSchema = yup.object({
  name: yup.string().required('Operation name is required'),
  code: yup.string().required('Operation code is required'),
  standardTime: yup.number().positive('Standard time must be positive').required('Standard time is required'),
  setupTime: yup.number().min(0, 'Setup time must be non-negative').required('Setup time is required'),
  costPerHour: yup.number().positive('Cost per hour must be positive').required('Cost per hour is required'),
});

const schema = yup.object({
  name: yup.string().required('Work center name is required'),
  code: yup.string().required('Work center code is required'),
  type: yup.string().required('Work center type is required'),
  capacity: yup.number().positive('Capacity must be positive').required('Capacity is required'),
  costPerHour: yup.number().positive('Cost per hour must be positive').required('Cost per hour is required'),
  setupTime: yup.number().min(0, 'Setup time must be non-negative').required('Setup time is required'),
  location: yup.string().required('Location is required'),
  description: yup.string().optional(),
  operations: yup.array().of(operationSchema).optional(),
});

interface WorkCenterFormData {
  name: string;
  code: string;
  type: string;
  capacity: number;
  costPerHour: number;
  setupTime: number;
  location: string;
  description?: string;
  operations?: {
    name: string;
    code: string;
    standardTime: number;
    setupTime: number;
    costPerHour: number;
  }[];
}

const CreateWorkCenter: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [createWorkCenter, { isLoading }] = useCreateWorkCenterMutation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WorkCenterFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      capacity: 24,
      setupTime: 15,
      costPerHour: 100,
      operations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'operations',
  });

  const watchedCostPerHour = watch('costPerHour');

  const onSubmit = async (data: WorkCenterFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(false);

      await createWorkCenter(data).unwrap();
      
      setSubmitSuccess(true);
      
      // Navigate back to work center management after a short delay
      setTimeout(() => {
        navigate('/manufacturing/work-center-management');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating work center:', err);
      setSubmitError(err?.data?.error?.message || 'Failed to create work center');
    }
  };

  const handleCancel = () => {
    navigate('/manufacturing/work-center-management');
  };

  const addOperation = () => {
    append({
      name: '',
      code: '',
      standardTime: 30,
      setupTime: 10,
      costPerHour: watchedCostPerHour || 100,
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
              navigate('/manufacturing/work-center-management');
            }}
            sx={{ fontSize: '0.75rem' }}
          >
            Work Centers
          </Link>
          <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>New Work Center</Typography>
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
              <BuildIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Create New Work Center
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Set up a new work center with operations and capacity
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Success Message */}
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 1.5 }}>
            Work center created successfully! Redirecting to work center management...
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
                    {/* Work Center Name */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Work Center Name *"
                            fullWidth
                            error={!!errors.name}
                            helperText={errors.name?.message}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Work Center Code */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Work Center Code *"
                            fullWidth
                            error={!!errors.code}
                            helperText={errors.code?.message}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Type */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!errors.type} size="small">
                        <InputLabel>Type *</InputLabel>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Type *"
                            >
                              <MenuItem value="MACHINING">Machining</MenuItem>
                              <MenuItem value="WELDING">Welding</MenuItem>
                              <MenuItem value="ASSEMBLY">Assembly</MenuItem>
                              <MenuItem value="PAINTING">Painting</MenuItem>
                              <MenuItem value="QUALITY">Quality Control</MenuItem>
                            </Select>
                          )}
                        />
                        {errors.type && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1.5 }}>
                            {errors.type.message}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Location */}
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="location"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Location *"
                            fullWidth
                            error={!!errors.location}
                            helperText={errors.location?.message}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Capacity */}
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="capacity"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Capacity (hrs/day) *"
                            type="number"
                            fullWidth
                            error={!!errors.capacity}
                            helperText={errors.capacity?.message}
                            inputProps={{ min: 1, max: 24 }}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Cost per Hour */}
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="costPerHour"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Cost per Hour *"
                            type="number"
                            fullWidth
                            error={!!errors.costPerHour}
                            helperText={errors.costPerHour?.message}
                            InputProps={{ startAdornment: '₹' }}
                            inputProps={{ min: 0, step: 0.01 }}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Setup Time */}
                    <Grid item xs={12} md={4}>
                      <Controller
                        name="setupTime"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Setup Time (minutes) *"
                            type="number"
                            fullWidth
                            error={!!errors.setupTime}
                            helperText={errors.setupTime?.message}
                            inputProps={{ min: 0 }}
                            size="small"
                          />
                        )}
                      />
                    </Grid>

                    {/* Description */}
                    <Grid item xs={12}>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                            size="small"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Operations */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary, 
                      fontSize: '0.875rem' 
                    }}>
                      Operations (Optional)
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                      onClick={addOperation}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5
                      }}
                    >
                      Add Operation
                    </Button>
                  </Box>

                  {fields.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 3, 
                      color: 'text.secondary',
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        No operations added yet. Click "Add Operation" to define work center operations.
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {fields.map((field, index) => (
                        <Grid item xs={12} key={field.id}>
                          <Box sx={{ 
                            p: 1.5, 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 1,
                            bgcolor: 'grey.50'
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                Operation {index + 1}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => remove(index)}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Controller
                                  name={`operations.${index}.name`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      label="Operation Name *"
                                      fullWidth
                                      error={!!errors.operations?.[index]?.name}
                                      helperText={errors.operations?.[index]?.name?.message}
                                      size="small"
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Controller
                                  name={`operations.${index}.code`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      label="Operation Code *"
                                      fullWidth
                                      error={!!errors.operations?.[index]?.code}
                                      helperText={errors.operations?.[index]?.code?.message}
                                      size="small"
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Controller
                                  name={`operations.${index}.standardTime`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      label="Standard Time (min) *"
                                      type="number"
                                      fullWidth
                                      error={!!errors.operations?.[index]?.standardTime}
                                      helperText={errors.operations?.[index]?.standardTime?.message}
                                      inputProps={{ min: 1 }}
                                      size="small"
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Controller
                                  name={`operations.${index}.setupTime`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      label="Setup Time (min) *"
                                      type="number"
                                      fullWidth
                                      error={!!errors.operations?.[index]?.setupTime}
                                      helperText={errors.operations?.[index]?.setupTime?.message}
                                      inputProps={{ min: 0 }}
                                      size="small"
                                    />
                                  )}
                                />
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Controller
                                  name={`operations.${index}.costPerHour`}
                                  control={control}
                                  render={({ field }) => (
                                    <TextField
                                      {...field}
                                      label="Cost per Hour *"
                                      type="number"
                                      fullWidth
                                      error={!!errors.operations?.[index]?.costPerHour}
                                      helperText={errors.operations?.[index]?.costPerHour?.message}
                                      InputProps={{ startAdornment: '₹' }}
                                      inputProps={{ min: 0, step: 0.01 }}
                                      size="small"
                                    />
                                  )}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
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
                  {isLoading ? 'Creating...' : 'Create Work Center'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
    </Box>
  );
};

export default CreateWorkCenter;