import React, { useState } from 'react';
import {
  Box,
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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useRecordMaterialConsumptionMutation,
  useGetProductionOrdersQuery,
} from '../../services/api';

interface MaterialConsumption {
  id: string;
  productionOrderId: string;
  productionOrderNumber: string;
  materialCode: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  consumptionDate: string;
  workCenter: string;
  operator: string;
  variance: number;
  status: string;
  notes?: string;
}

const MaterialConsumption: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordDialog, setRecordDialog] = useState(false);
  const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);

  // API hooks
  const { data: productionOrders } = useGetProductionOrdersQuery({});
  const [recordConsumption] = useRecordMaterialConsumptionMutation();

  // Mock data for demonstration
  const mockConsumptions: MaterialConsumption[] = [
    {
      id: '1',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialCode: 'STL-001',
      materialName: 'Steel Plate 10mm',
      plannedQuantity: 100,
      actualQuantity: 105,
      unit: 'kg',
      consumptionDate: '2024-12-16',
      workCenter: 'Cutting Station',
      operator: 'John Smith',
      variance: 5,
      status: 'RECORDED',
    },
    {
      id: '2',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialCode: 'WLD-001',
      materialName: 'Welding Rod 3.2mm',
      plannedQuantity: 50,
      actualQuantity: 48,
      unit: 'pcs',
      consumptionDate: '2024-12-16',
      workCenter: 'Welding Station 1',
      operator: 'Mike Johnson',
      variance: -2,
      status: 'RECORDED',
    },
    {
      id: '3',
      productionOrderId: 'po-002',
      productionOrderNumber: 'PO-2024-002',
      materialCode: 'ALU-001',
      materialName: 'Aluminum Sheet 5mm',
      plannedQuantity: 75,
      actualQuantity: 80,
      unit: 'kg',
      consumptionDate: '2024-12-17',
      workCenter: 'CNC Machine Center',
      operator: 'Sarah Wilson',
      variance: 5,
      status: 'PENDING_APPROVAL',
    },
  ];

  // Status configuration
  const statusConfig = {
    RECORDED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckCircleIcon />, label: 'Recorded' },
    PENDING_APPROVAL: { color: '#fff3e0', textColor: '#f57c00', icon: <WarningIcon />, label: 'Pending Approval' },
    APPROVED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckCircleIcon />, label: 'Approved' },
    REJECTED: { color: '#ffebee', textColor: '#d32f2f', icon: <WarningIcon />, label: 'Rejected' },
  };

  // Get variance color
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return '#d32f2f'; // Over consumption - red
    if (variance < 0) return '#2e7d32'; // Under consumption - green
    return '#757575'; // Exact consumption - grey
  };

  // Handle record consumption
  const handleRecordConsumption = async (data: any) => {
    try {
      await recordConsumption(data).unwrap();
      setRecordDialog(false);
    } catch (error) {
      console.error('Failed to record consumption:', error);
    }
  };

  // Filter consumptions
  const filteredConsumptions = mockConsumptions.filter((consumption) => {
    const matchesSearch = !search || 
      consumption.materialName.toLowerCase().includes(search.toLowerCase()) ||
      consumption.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      consumption.productionOrderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || consumption.status === statusFilter;
    const matchesDateRange = (!dateRange.start || consumption.consumptionDate >= dateRange.start) &&
                            (!dateRange.end || consumption.consumptionDate <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredConsumptions.length,
    recorded: filteredConsumptions.filter(c => c.status === 'RECORDED').length,
    pending: filteredConsumptions.filter(c => c.status === 'PENDING_APPROVAL').length,
    overConsumption: filteredConsumptions.filter(c => c.variance > 0).length,
    totalVariance: filteredConsumptions.reduce((sum, c) => sum + Math.abs(c.variance), 0),
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
            <IconButton
              onClick={() => navigate('/manufacturing')}
              sx={{ p: 0.5 }}
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <InventoryIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Material Consumption Tracking
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Track and manage material consumption for production orders
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setRecordDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Record Consumption
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Records
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.total}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Recorded
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.recorded}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ color: '#f57c00' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Pending Approval
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.pending}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ color: '#d32f2f' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Over Consumption
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.overConsumption}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
            placeholder="Search materials or orders..."
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
              <MenuItem value="RECORDED">Recorded</MenuItem>
              <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
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
          maxHeight: 'calc(100vh - 400px)',
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
                  Production Order
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
                  Material
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
                  Planned Qty
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
                  Actual Qty
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
                  Variance
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
                  Work Center
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
                  Operator
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
                  Date
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
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredConsumptions.map((consumption: MaterialConsumption, index: number) => (
                <TableRow 
                  key={consumption.id} 
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
                      {consumption.productionOrderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {consumption.materialCode}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {consumption.materialName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {consumption.plannedQuantity} {consumption.unit}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {consumption.actualQuantity} {consumption.unit}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={`${consumption.variance > 0 ? '+' : ''}${consumption.variance} ${consumption.unit}`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: consumption.variance === 0 ? 'rgba(0, 0, 0, 0.08)' : 
                                 consumption.variance > 0 ? '#ffebee' : '#e8f5e8',
                        color: getVarianceColor(consumption.variance),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {consumption.workCenter}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {consumption.operator}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(consumption.consumptionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[consumption.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[consumption.status as keyof typeof statusConfig]?.label || consumption.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[consumption.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[consumption.status as keyof typeof statusConfig]?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => setSelectedConsumption(consumption)}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                        >
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
          count={filteredConsumptions.length}
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

        {/* Record Consumption Dialog */}
        <Dialog open={recordDialog} onClose={() => setRecordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Material Consumption</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Production Order</InputLabel>
                  <Select defaultValue="" label="Production Order">
                    <MenuItem value="po-001">PO-2024-001 - Steel Frame Assembly</MenuItem>
                    <MenuItem value="po-002">PO-2024-002 - CNC Machining Parts</MenuItem>
                    <MenuItem value="po-003">PO-2024-003 - Welding Operations</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Material Code"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Material Name"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Planned Quantity"
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Actual Quantity"
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  defaultValue="kg"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Work Center"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Operator"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Consumption Date"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRecordDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                handleRecordConsumption({
                  productionOrderId: 'po-001',
                  materialCode: 'STL-001',
                  materialName: 'Steel Plate 10mm',
                  plannedQuantity: 100,
                  actualQuantity: 105,
                  unit: 'kg',
                  workCenter: 'Cutting Station',
                  operator: 'John Smith',
                  consumptionDate: new Date().toISOString(),
                  notes: 'Material consumption recorded',
                });
              }}
            >
              Record
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default MaterialConsumption;