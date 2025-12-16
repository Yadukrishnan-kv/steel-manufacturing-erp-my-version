import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  MoreVert as MoreIcon,
  Factory as FactoryIcon,
  CalendarToday as CalendarIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetProductionOrdersQuery,
  useUpdateProductionOrderStatusMutation,
  useRescheduleProductionOrderMutation,
} from '../../services/api';

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productCode: string;
  quantity: number;
  status: string;
  priority: number;
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  branchName: string;
  customerName?: string;
  progress: number;
}

const ProductionOrderManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement | null; order: ProductionOrder | null }>({
    anchorEl: null,
    order: null,
  });

  // API hooks
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useGetProductionOrdersQuery({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    status: statusFilter || undefined,
    branchId: branchFilter || undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
  });

  const [updateStatus] = useUpdateProductionOrderStatusMutation();
  const [rescheduleOrder] = useRescheduleProductionOrderMutation();

  // Extract data from API response
  const orders = ordersData?.data || [];
  const totalCount = ordersData?.pagination?.total || 0;

  // Status configuration
  const statusConfig = {
    DRAFT: { color: 'default', icon: <FactoryIcon />, label: 'Draft' },
    SCHEDULED: { color: '#fff3e0', textColor: '#f57c00', icon: <ScheduleIcon />, label: 'Scheduled' },
    IN_PROGRESS: { color: '#e3f2fd', textColor: theme.palette.primary.main, icon: <StartIcon />, label: 'In Progress' },
    COMPLETED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CompleteIcon />, label: 'Completed' },
    ON_HOLD: { color: '#ffebee', textColor: '#d32f2f', icon: <StopIcon />, label: 'On Hold' },
    CANCELLED: { color: 'secondary', icon: <StopIcon />, label: 'Cancelled' },
  };

  // Priority colors
  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#d32f2f'; // High priority - red
    if (priority >= 5) return '#f57c00'; // Medium priority - orange
    return '#2e7d32'; // Low priority - green
  };

  // Handle actions
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({
        id: orderId,
        status: newStatus,
        actualStartDate: newStatus === 'IN_PROGRESS' ? new Date().toISOString() : undefined,
        actualEndDate: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      }).unwrap();
      refetch();
      setStatusDialog(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleReschedule = async (orderId: string, data: any) => {
    try {
      await rescheduleOrder({ id: orderId, ...data }).unwrap();
      refetch();
      setRescheduleDialog(false);
    } catch (error) {
      console.error('Failed to reschedule order:', error);
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, order: ProductionOrder) => {
    setActionMenu({ anchorEl: event.currentTarget, order });
  };

  const handleActionClose = () => {
    setActionMenu({ anchorEl: null, order: null });
  };

  // Summary statistics
  const summaryStats = {
    total: totalCount,
    scheduled: orders.filter((o: ProductionOrder) => o.status === 'SCHEDULED').length,
    inProgress: orders.filter((o: ProductionOrder) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o: ProductionOrder) => o.status === 'COMPLETED').length,
    delayed: orders.filter((o: ProductionOrder) => 
      o.status !== 'COMPLETED' && new Date(o.scheduledEndDate) < new Date()
    ).length,
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
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
                Production Order Management
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Manage production orders, track progress, and monitor schedules
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/gantt')}
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/calendar')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Calendar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/create-order')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              New Order
            </Button>
          </Box>
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
            icon={<FactoryIcon />}
            label={`${summaryStats.total} Total`}
            size="small"
            sx={{
              bgcolor: `${theme.palette.primary.light}15`,
              color: theme.palette.primary.main,
              fontWeight: 600,
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { 
                color: theme.palette.primary.main, 
                fontSize: 16 
              }
            }}
          />
          <Chip
            icon={<ScheduleIcon />}
            label={`${summaryStats.scheduled} Scheduled`}
            size="small"
            sx={{
              bgcolor: '#fff3e0',
              color: '#f57c00',
              fontWeight: 600,
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { 
                color: '#f57c00', 
                fontSize: 16 
              }
            }}
          />
          <Chip
            icon={<StartIcon />}
            label={`${summaryStats.inProgress} In Progress`}
            size="small"
            sx={{
              bgcolor: `${theme.palette.primary.light}15`,
              color: theme.palette.primary.main,
              fontWeight: 600,
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { 
                color: theme.palette.primary.main, 
                fontSize: 16 
              }
            }}
          />
          <Chip
            icon={<CompleteIcon />}
            label={`${summaryStats.completed} Completed`}
            size="small"
            sx={{
              bgcolor: '#e8f5e8',
              color: '#2e7d32',
              fontWeight: 600,
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { 
                color: '#2e7d32', 
                fontSize: 16 
              }
            }}
          />
          {summaryStats.delayed > 0 && (
            <Chip
              icon={<StopIcon />}
              label={`${summaryStats.delayed} Delayed`}
              size="small"
              sx={{
                bgcolor: '#ffebee',
                color: '#d32f2f',
                fontWeight: 600,
                height: 28,
                fontSize: '0.75rem',
                '& .MuiChip-icon': { 
                  color: '#d32f2f', 
                  fontSize: 16 
                }
              }}
            />
          )}
        </Box>

        {/* Search & Filter Section */}
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          mb: 1.5,
          p: 1.5,
          backgroundColor: '#f8f9fa',
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap'
        }}>
          <TextField
            size="small"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: { 
                height: 32,
                fontSize: '0.75rem'
              }
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="SCHEDULED">Scheduled</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ 
              minWidth: 140,
              '& .MuiInputBase-input': { fontSize: '0.75rem' }
            }}
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ 
              minWidth: 140,
              '& .MuiInputBase-input': { fontSize: '0.75rem' }
            }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setBranchFilter('');
              setDateRange({ start: '', end: '' });
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Clear
          </Button>
        </Box>

        {/* Data Table */}
        <TableContainer sx={{
          maxHeight: 'calc(100vh - 320px)',
          overflow: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5
        }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: '6px 8px',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  whiteSpace: 'nowrap'
                }}>
                  Order No.
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
                  Product
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
                  Quantity
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
                  Status
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
                  Priority
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
                  Scheduled Start
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
                  Scheduled End
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
                  Progress
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
                  Branch
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
              {orders.map((order: ProductionOrder, index: number) => (
                <TableRow 
                  key={order.id} 
                  hover
                  sx={{
                    '&:hover': { 
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    },
                    '&:nth-of-type(even)': { 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.primary.main, 
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {order.productCode}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {order.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[order.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[order.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[order.status as keyof typeof statusConfig]?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={`P${order.priority}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: getPriorityColor(order.priority),
                        color: 'white',
                        minWidth: 32
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(order.scheduledStartDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(order.scheduledEndDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 6, 
                        bgcolor: 'grey.200', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${order.progress}%`,
                          height: '100%',
                          bgcolor: order.progress === 100 ? '#2e7d32' : theme.palette.primary.main,
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', minWidth: 30 }}>
                        {order.progress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {order.branchName}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => navigate(`/manufacturing/orders/${order.id}`)}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={(e) => handleActionClick(e, order)}
                        >
                          <MoreIcon sx={{ fontSize: 18 }} />
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
            '.MuiTablePagination-toolbar': {
              minHeight: 40,
              padding: '4px 12px'
            },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '0.75rem',
              m: 0
            },
            '.MuiTablePagination-select': {
              fontSize: '0.75rem'
            },
            '.MuiIconButton-root': {
              padding: '4px',
              '& .MuiSvgIcon-root': {
                fontSize: 16
              }
            }
          }}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenu.anchorEl}
          open={Boolean(actionMenu.anchorEl)}
          onClose={handleActionClose}
        >
          <MenuItem onClick={() => {
            setSelectedOrder(actionMenu.order);
            setStatusDialog(true);
            handleActionClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Update Status</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            setSelectedOrder(actionMenu.order);
            setRescheduleDialog(true);
            handleActionClose();
          }}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reschedule</ListItemText>
          </MenuItem>
        </Menu>

        {/* Status Update Dialog */}
        <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Production Order Status</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Order: {selectedOrder?.orderNumber}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                defaultValue={selectedOrder?.status || ''}
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
              onClick={() => {
                if (selectedOrder) {
                  handleStatusUpdate(selectedOrder.id, 'IN_PROGRESS'); // Example
                }
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={rescheduleDialog} onClose={() => setRescheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reschedule Production Order</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Order: {selectedOrder?.orderNumber}
            </Typography>
            <TextField
              fullWidth
              type="date"
              label="New Start Date"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Buffer Days"
              defaultValue={2}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Priority (1-10)"
              defaultValue={selectedOrder?.priority || 5}
              inputProps={{ min: 1, max: 10 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRescheduleDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                if (selectedOrder) {
                  handleReschedule(selectedOrder.id, { bufferDays: 2, priority: 5 });
                }
              }}
            >
              Reschedule
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading and Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading production orders...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load production orders. Please try again.
          </Alert>
        )}
    </Box>
  );
};

export default ProductionOrderManagement;