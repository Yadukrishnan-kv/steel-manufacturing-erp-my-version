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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Factory as FactoryIcon,
  NavigateNext,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import {
  useGetProductionOrderQuery,
  useUpdateProductionOrderStatusMutation,
  useRescheduleProductionOrderMutation,
} from '../../services/api';

const ProductionOrderDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [statusDialog, setStatusDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    startDate: '',
    bufferDays: 2,
    priority: 5,
  });

  // API hooks
  const {
    data: orderData,
    isLoading,
    error,
    refetch,
  } = useGetProductionOrderQuery(id!, { skip: !id });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProductionOrderStatusMutation();
  const [rescheduleOrder, { isLoading: isRescheduling }] = useRescheduleProductionOrderMutation();

  const order = orderData?.data;

  // Status configuration
  const statusConfig = {
    DRAFT: { color: '#f5f5f5', textColor: '#666', icon: <FactoryIcon />, label: 'Draft' },
    SCHEDULED: { color: '#fff3e0', textColor: '#f57c00', icon: <ScheduleIcon />, label: 'Scheduled' },
    IN_PROGRESS: { color: '#e3f2fd', textColor: theme.palette.primary.main, icon: <StartIcon />, label: 'In Progress' },
    COMPLETED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CompleteIcon />, label: 'Completed' },
    ON_HOLD: { color: '#ffebee', textColor: '#d32f2f', icon: <StopIcon />, label: 'On Hold' },
    CANCELLED: { color: '#f5f5f5', textColor: '#666', icon: <StopIcon />, label: 'Cancelled' },
  };

  // Priority colors
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#d32f2f'; // High priority - red
    if (priority >= 5) return '#f57c00'; // Medium priority - orange
    return '#2e7d32'; // Low priority - green
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;
    
    try {
      await updateStatus({
        id: order.id,
        status: newStatus,
        actualStartDate: newStatus === 'IN_PROGRESS' ? new Date().toISOString() : undefined,
        actualEndDate: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      }).unwrap();
      
      refetch();
      setStatusDialog(false);
      setNewStatus('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // Handle reschedule
  const handleReschedule = async () => {
    if (!order) return;
    
    try {
      await rescheduleOrder({
        id: order.id,
        ...rescheduleData,
      }).unwrap();
      
      refetch();
      setRescheduleDialog(false);
    } catch (error) {
      console.error('Failed to reschedule order:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading production order details...</Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        <Alert severity="error">
          Failed to load production order details. Please try again.
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
            navigate('/manufacturing/production-orders');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Production Orders
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          {order.orderNumber}
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
            onClick={() => navigate('/manufacturing/production-orders')}
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
              Production Order: {order.orderNumber}
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              {order.productCode} - {order.quantity.toLocaleString()} units
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => setStatusDialog(true)}
            disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Update Status
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ScheduleIcon sx={{ fontSize: 16 }} />}
            onClick={() => setRescheduleDialog(true)}
            disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Reschedule
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate(`/manufacturing/gantt?order=${order.id}`)}
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
        {/* Order Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Order Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        icon={statusConfig[order.status as keyof typeof statusConfig]?.icon}
                        label={statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: statusConfig[order.status as keyof typeof statusConfig]?.color,
                          color: statusConfig[order.status as keyof typeof statusConfig]?.textColor,
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Priority
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={`Priority ${order.priority}`}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: getPriorityColor(order.priority),
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Progress
                    </Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={order.progress}
                        sx={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: order.progress === 100 ? '#2e7d32' : theme.palette.primary.main,
                            borderRadius: 4,
                          }
                        }}
                      />
                      <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {order.progress}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Scheduled Start Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {new Date(order.scheduledStartDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Scheduled End Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {new Date(order.scheduledEndDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                
                {order.actualStartDate && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Actual Start Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {new Date(order.actualStartDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {order.actualEndDate && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Actual End Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {new Date(order.actualEndDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Branch
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {order.branchName}
                    </Typography>
                  </Box>
                </Grid>
                
                {order.customerName && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Customer
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {order.customerName}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Operations */}
          {order.operations && order.operations.length > 0 && (
            <Card sx={{ borderRadius: 1.5 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  mb: 1.5, 
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem'
                }}>
                  Operations
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Operation</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Work Center</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Duration</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.operations.map((operation: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {operation.name}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {operation.workCenter}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <Chip
                              label={operation.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {operation.duration} hrs
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={operation.progress || 0}
                                sx={{
                                  width: 60,
                                  height: 4,
                                  borderRadius: 2,
                                }}
                              />
                              <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                {operation.progress || 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
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
                  startIcon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/bom/${order.bomId}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  View BOM
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InventoryIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/inventory/material-allocation?order=${order.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Material Allocation
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/work-centers?order=${order.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Work Center Assignment
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Material Requirements */}
          {order.materials && order.materials.length > 0 && (
            <Card sx={{ borderRadius: 1.5 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 600, 
                  mb: 1.5, 
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem'
                }}>
                  Material Requirements
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {order.materials.map((material: any, index: number) => (
                    <Box key={index} sx={{ 
                      p: 1, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      bgcolor: 'grey.50'
                    }}>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {material.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Required: {material.requiredQuantity} {material.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                        Available: {material.availableQuantity} {material.unit}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Production Order Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Order: {order.orderNumber}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
            >
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleStatusUpdate}
            disabled={!newStatus || isUpdatingStatus}
          >
            {isUpdatingStatus ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialog} onClose={() => setRescheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reschedule Production Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Order: {order.orderNumber}
          </Typography>
          <TextField
            fullWidth
            type="date"
            label="New Start Date"
            value={rescheduleData.startDate}
            onChange={(e) => setRescheduleData(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Buffer Days"
            value={rescheduleData.bufferDays}
            onChange={(e) => setRescheduleData(prev => ({ ...prev, bufferDays: parseInt(e.target.value) }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Priority (1-10)"
            value={rescheduleData.priority}
            onChange={(e) => setRescheduleData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleReschedule}
            disabled={isRescheduling}
          >
            {isRescheduling ? 'Rescheduling...' : 'Reschedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductionOrderDetail;