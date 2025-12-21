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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  NavigateNext,
  Settings as SettingsIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import {
  useGetWorkCentersQuery,
  useGetWorkCenterUtilizationQuery,
  useGetMachineScheduleQuery,
} from '../../services/api';

const WorkCenterDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [editDialog, setEditDialog] = useState(false);
  const [operationDialog, setOperationDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // API hooks
  const { data: workCenters, isLoading, error } = useGetWorkCentersQuery();
  
  const { data: utilizationData } = useGetWorkCenterUtilizationQuery({
    startDate: new Date(dateRange.start).toISOString(),
    endDate: new Date(dateRange.end).toISOString(),
    workCenterId: id,
  });

  const { data: scheduleData } = useGetMachineScheduleQuery({
    startDate: new Date(dateRange.start).toISOString(),
    endDate: new Date(dateRange.end).toISOString(),
    workCenterIds: id,
  });

  // Find the work center
  const workCenter = workCenters?.find((wc: any) => wc.id === id);

  // Mock data for demonstration (would come from API)
  const mockWorkCenter = workCenter || {
    id: id,
    name: 'CNC Machine Center',
    code: 'CNC-001',
    type: 'MACHINING',
    capacity: 24,
    currentUtilization: 85,
    status: 'ACTIVE',
    location: 'Shop Floor A',
    costPerHour: 150,
    setupTime: 30,
    description: 'High-precision CNC machining center for complex parts',
    operations: [
      { id: '1', name: 'Rough Machining', code: 'RM-001', standardTime: 45, setupTime: 15, costPerHour: 150 },
      { id: '2', name: 'Finish Machining', code: 'FM-001', standardTime: 30, setupTime: 10, costPerHour: 150 },
      { id: '3', name: 'Drilling', code: 'DR-001', standardTime: 20, setupTime: 5, costPerHour: 150 },
    ],
    currentJobs: [
      { id: '1', productionOrderId: 'PO-2024-001', productCode: 'STEEL-BEAM-001', status: 'IN_PROGRESS', progress: 65, estimatedCompletion: '2024-01-15T14:30:00Z' },
      { id: '2', productionOrderId: 'PO-2024-002', productCode: 'STEEL-COLUMN-002', status: 'SCHEDULED', progress: 0, estimatedCompletion: '2024-01-16T10:00:00Z' },
    ],
  };

  // Status configuration
  const statusConfig = {
    ACTIVE: { color: '#e8f5e8', textColor: '#2e7d32', icon: <BuildIcon />, label: 'Active' },
    MAINTENANCE: { color: '#fff3e0', textColor: '#f57c00', icon: <SettingsIcon />, label: 'Maintenance' },
    INACTIVE: { color: '#ffebee', textColor: '#d32f2f', icon: <SettingsIcon />, label: 'Inactive' },
  };

  // Type configuration
  const typeConfig = {
    MACHINING: { color: theme.palette.primary.main, label: 'Machining' },
    WELDING: { color: '#f57c00', label: 'Welding' },
    ASSEMBLY: { color: '#2e7d32', label: 'Assembly' },
    PAINTING: { color: '#9c27b0', label: 'Painting' },
    QUALITY: { color: '#00bcd4', label: 'Quality Control' },
  };

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return '#d32f2f'; // Over capacity - red
    if (utilization >= 75) return '#f57c00'; // High utilization - orange
    if (utilization >= 50) return '#2e7d32'; // Good utilization - green
    return '#757575'; // Low utilization - grey
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading work center details...</Typography>
      </Box>
    );
  }

  if (error || !mockWorkCenter) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        <Alert severity="error">
          Failed to load work center details. Please try again.
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
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          {mockWorkCenter.code}
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
            onClick={() => navigate('/manufacturing/work-center-management')}
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
              Work Center: {mockWorkCenter.code}
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              {mockWorkCenter.name} - {mockWorkCenter.location}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ScheduleIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate(`/manufacturing/work-centers/${id}/schedule`)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Schedule
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate(`/manufacturing/gantt?workCenter=${id}`)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Gantt View
          </Button>
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        {/* Work Center Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Work Center Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        icon={statusConfig[mockWorkCenter.status as keyof typeof statusConfig]?.icon}
                        label={statusConfig[mockWorkCenter.status as keyof typeof statusConfig]?.label || mockWorkCenter.status}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: statusConfig[mockWorkCenter.status as keyof typeof statusConfig]?.color,
                          color: statusConfig[mockWorkCenter.status as keyof typeof statusConfig]?.textColor,
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Type
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={typeConfig[mockWorkCenter.type as keyof typeof typeConfig]?.label || mockWorkCenter.type}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: `${typeConfig[mockWorkCenter.type as keyof typeof typeConfig]?.color || theme.palette.primary.main}15`,
                          color: typeConfig[mockWorkCenter.type as keyof typeof typeConfig]?.color || theme.palette.primary.main,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Current Utilization
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={mockWorkCenter.currentUtilization}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getUtilizationColor(mockWorkCenter.currentUtilization),
                            borderRadius: 4,
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: getUtilizationColor(mockWorkCenter.currentUtilization)
                      }}>
                        {mockWorkCenter.currentUtilization}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Daily Capacity
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {mockWorkCenter.capacity} hours/day
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Cost per Hour
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      ${mockWorkCenter.costPerHour}/hour
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Setup Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {mockWorkCenter.setupTime} minutes
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {mockWorkCenter.location}
                    </Typography>
                  </Box>
                </Grid>
                
                {mockWorkCenter.description && (
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {mockWorkCenter.description}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem'
                }}>
                  Available Operations
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setOperationDialog(true)}
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
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Operation</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Code</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Standard Time</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Setup Time</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Cost/Hour</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockWorkCenter.operations?.map((operation: any) => (
                      <TableRow key={operation.id}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {operation.name}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {operation.code}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {operation.standardTime} min
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {operation.setupTime} min
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          ${operation.costPerHour}/hr
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Current Jobs */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Current Jobs
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Production Order</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Est. Completion</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockWorkCenter.currentJobs?.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: theme.palette.primary.main, 
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => navigate(`/manufacturing/production-orders/${job.productionOrderId}`)}
                          >
                            {job.productionOrderId}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {job.productCode}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <Chip
                            label={job.status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={job.progress}
                              sx={{
                                width: 60,
                                height: 4,
                                borderRadius: 2,
                              }}
                            />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              {job.progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem' }}>
                          {new Date(job.estimatedCompletion).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                  startIcon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/work-centers/${id}/schedule`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  View Schedule
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssessmentIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/capacity-analysis?workCenter=${id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Capacity Analysis
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/hr/employee-master?workCenter=${id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Assigned Operators
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InventoryIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/inventory/items?workCenter=${id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Required Tools
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Utilization Metrics */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Utilization Metrics (Last 7 Days)
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Average Utilization
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={mockWorkCenter.currentUtilization}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getUtilizationColor(mockWorkCenter.currentUtilization),
                          borderRadius: 4,
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      color: getUtilizationColor(mockWorkCenter.currentUtilization)
                    }}>
                      {mockWorkCenter.currentUtilization}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Peak Utilization
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    95% (Yesterday 2:00 PM)
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Idle Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    3.6 hours (15%)
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Setup Time
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    2.4 hours (10%)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Work Center Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Work Center</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Work Center Name"
                defaultValue={mockWorkCenter.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                defaultValue={mockWorkCenter.code}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select defaultValue={mockWorkCenter.type} label="Type">
                  <MenuItem value="MACHINING">Machining</MenuItem>
                  <MenuItem value="WELDING">Welding</MenuItem>
                  <MenuItem value="ASSEMBLY">Assembly</MenuItem>
                  <MenuItem value="PAINTING">Painting</MenuItem>
                  <MenuItem value="QUALITY">Quality Control</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select defaultValue={mockWorkCenter.status} label="Status">
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity (hrs/day)"
                type="number"
                defaultValue={mockWorkCenter.capacity}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost per Hour"
                type="number"
                defaultValue={mockWorkCenter.costPerHour}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Setup Time (minutes)"
                type="number"
                defaultValue={mockWorkCenter.setupTime}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                defaultValue={mockWorkCenter.location}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue={mockWorkCenter.description}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Add Operation Dialog */}
      <Dialog open={operationDialog} onClose={() => setOperationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Operation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Operation Name"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Operation Code"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Standard Time (minutes)"
                type="number"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Setup Time (minutes)"
                type="number"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cost per Hour"
                type="number"
                defaultValue={mockWorkCenter.costPerHour}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOperationDialog(false)}>Cancel</Button>
          <Button variant="contained">Add Operation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkCenterDetail;