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
  Breadcrumbs,
  Link,
  Autocomplete,
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
  NavigateNext,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useRecordMaterialConsumptionMutation,
  useGetProductionOrdersQuery,
  useGetInventoryItemsQuery,
  useGetWorkCentersQuery,
  useGetMaterialConsumptionQuery,
} from '../../services/api';

// Validation schema
const materialConsumptionSchema = yup.object({
  productionOrderId: yup.string().required('Production order is required'),
  materialId: yup.string().required('Material is required'),
  workCenterId: yup.string().required('Work center is required'),
  plannedQuantity: yup.number().positive('Planned quantity must be positive').required('Planned quantity is required'),
  actualQuantity: yup.number().positive('Actual quantity must be positive').required('Actual quantity is required'),
  consumptionDate: yup.date().required('Consumption date is required'),
  operator: yup.string().required('Operator is required'),
  notes: yup.string().optional(),
});

interface MaterialConsumptionFormData {
  productionOrderId: string;
  materialId: string;
  workCenterId: string;
  plannedQuantity: number;
  actualQuantity: number;
  consumptionDate: string;
  operator: string;
  notes?: string;
}

interface MaterialConsumption {
  id: string;
  productionOrderId: string;
  productionOrderNumber: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  consumptionDate: string;
  workCenterId: string;
  workCenterName: string;
  operator: string;
  variance: number;
  variancePercentage: number;
  status: string;
  costImpact: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const MaterialConsumption: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordDialog, setRecordDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedConsumption, setSelectedConsumption] = useState<MaterialConsumption | null>(null);

  // API hooks
  const {
    data: materialConsumptionData,
    isLoading,
    error,
    refetch,
  } = useGetMaterialConsumptionQuery();

  const { data: productionOrdersData } = useGetProductionOrdersQuery({});
  const { data: inventoryItemsData } = useGetInventoryItemsQuery();
  const { data: workCentersData } = useGetWorkCentersQuery();
  const [recordConsumption, { isLoading: isRecording }] = useRecordMaterialConsumptionMutation();

  // Extract data
  const materialConsumptions = Array.isArray(materialConsumptionData) ? materialConsumptionData : [];
  const productionOrders = Array.isArray(productionOrdersData) ? productionOrdersData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];
  const workCenters = Array.isArray(workCentersData) ? workCentersData : [];

  // Form handling
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<MaterialConsumptionFormData>({
    resolver: yupResolver(materialConsumptionSchema) as any,
    defaultValues: {
      consumptionDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedProductionOrder = watch('productionOrderId');
  const watchedMaterial = watch('materialId');

  // Mock data for demonstration (replace with real API data when available)
  const mockConsumptions: MaterialConsumption[] = [
    {
      id: '1',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialId: 'mat-001',
      materialCode: 'STL-001',
      materialName: 'Steel Plate 10mm',
      plannedQuantity: 100,
      actualQuantity: 105,
      unit: 'kg',
      consumptionDate: '2024-12-16',
      workCenterId: 'wc-001',
      workCenterName: 'Cutting Station',
      operator: 'John Smith',
      variance: 5,
      variancePercentage: 5.0,
      status: 'RECORDED',
      costImpact: 125.50,
      createdAt: '2024-12-16T10:30:00Z',
      updatedAt: '2024-12-16T10:30:00Z',
    },
    {
      id: '2',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialId: 'mat-002',
      materialCode: 'WLD-001',
      materialName: 'Welding Rod 3.2mm',
      plannedQuantity: 50,
      actualQuantity: 48,
      unit: 'pcs',
      consumptionDate: '2024-12-16',
      workCenterId: 'wc-002',
      workCenterName: 'Welding Station 1',
      operator: 'Mike Johnson',
      variance: -2,
      variancePercentage: -4.0,
      status: 'RECORDED',
      costImpact: -8.50,
      createdAt: '2024-12-16T11:15:00Z',
      updatedAt: '2024-12-16T11:15:00Z',
    },
    {
      id: '3',
      productionOrderId: 'po-002',
      productionOrderNumber: 'PO-2024-002',
      materialId: 'mat-003',
      materialCode: 'ALU-001',
      materialName: 'Aluminum Sheet 5mm',
      plannedQuantity: 75,
      actualQuantity: 80,
      unit: 'kg',
      consumptionDate: '2024-12-17',
      workCenterId: 'wc-003',
      workCenterName: 'CNC Machine Center',
      operator: 'Sarah Wilson',
      variance: 5,
      variancePercentage: 6.7,
      status: 'PENDING_APPROVAL',
      costImpact: 95.00,
      createdAt: '2024-12-17T09:45:00Z',
      updatedAt: '2024-12-17T09:45:00Z',
    },
  ];

  // Use mock data if API data is not available
  const consumptions = materialConsumptions.length > 0 ? materialConsumptions : mockConsumptions;

  // Handle form submission
  const onSubmit = async (data: MaterialConsumptionFormData) => {
    try {
      await recordConsumption(data).unwrap();
      setRecordDialog(false);
      reset();
      refetch();
    } catch (err) {
      console.error('Failed to record consumption:', err);
    }
  };

  const handleViewConsumption = (consumption: MaterialConsumption) => {
    setSelectedConsumption(consumption);
    setViewDialog(true);
  };

  // Status configuration
  const statusConfig = {
    RECORDED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckCircleIcon />, label: 'Recorded' },
    PENDING_APPROVAL: { color: '#fff3e0', textColor: '#f57c00', icon: <WarningIcon />, label: 'Pending Approval' },
    APPROVED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckCircleIcon />, label: 'Approved' },
    REJECTED: { color: '#ffebee', textColor: '#d32f2f', icon: <WarningIcon />, label: 'Rejected' },
  };

  // Get variance color and icon
  const getVarianceColor = (variance: number) => {
    if (variance > 0) return '#d32f2f'; // Over consumption - red
    if (variance < 0) return '#2e7d32'; // Under consumption - green
    return '#757575'; // Exact consumption - grey
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUpIcon sx={{ fontSize: 14 }} />;
    if (variance < 0) return <TrendingDownIcon sx={{ fontSize: 14 }} />;
    return <AssessmentIcon sx={{ fontSize: 14 }} />;
  };

  // Filter consumptions
  const filteredConsumptions = consumptions.filter((consumption) => {
    const matchesSearch = !search || 
      consumption.materialName.toLowerCase().includes(search.toLowerCase()) ||
      consumption.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      consumption.productionOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      consumption.operator.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || consumption.status === statusFilter;
    const matchesWorkCenter = !workCenterFilter || consumption.workCenterId === workCenterFilter;
    const matchesDateRange = (!dateRange.start || consumption.consumptionDate >= dateRange.start) &&
                            (!dateRange.end || consumption.consumptionDate <= dateRange.end);
    
    return matchesSearch && matchesStatus && matchesWorkCenter && matchesDateRange;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredConsumptions.length,
    recorded: filteredConsumptions.filter(c => c.status === 'RECORDED').length,
    pending: filteredConsumptions.filter(c => c.status === 'PENDING_APPROVAL').length,
    overConsumption: filteredConsumptions.filter(c => c.variance > 0).length,
    underConsumption: filteredConsumptions.filter(c => c.variance < 0).length,
    totalVariance: filteredConsumptions.reduce((sum, c) => sum + Math.abs(c.variance), 0),
    totalCostImpact: filteredConsumptions.reduce((sum, c) => sum + (c.costImpact || 0), 0),
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
            navigate('/manufacturing');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Manufacturing
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          Material Consumption
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
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            onClick={() => refetch()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Refresh
          </Button>
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
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Records
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {summaryStats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 24, color: '#2e7d32' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Recorded
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#2e7d32' }}>
                    {summaryStats.recorded}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 24, color: '#f57c00' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Pending Approval
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#f57c00' }}>
                    {summaryStats.pending}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Over Consumption
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#d32f2f' }}>
                    {summaryStats.overConsumption}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Cost Impact
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: theme.palette.primary.main }}>
                    ₹{summaryStats.totalCostImpact.toFixed(0)}
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
          placeholder="Search materials, orders, or operators..."
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
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="RECORDED">Recorded</MenuItem>
            <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="REJECTED">Rejected</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Work Center</InputLabel>
          <Select
            value={workCenterFilter}
            onChange={(e) => setWorkCenterFilter(e.target.value)}
            label="Work Center"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Work Centers</MenuItem>
            {workCenters.map((wc: any) => (
              <MenuItem key={wc.id} value={wc.id}>
                {wc.name}
              </MenuItem>
            ))}
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
            setWorkCenterFilter('');
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
        maxHeight: 'calc(100vh - 450px)',
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
            {filteredConsumptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((consumption: MaterialConsumption) => (
              <TableRow 
                key={consumption.id} 
                hover
                sx={{
                  '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                  '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
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
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {consumption.materialCode}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {consumption.materialName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {consumption.plannedQuantity} {consumption.unit}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {consumption.actualQuantity} {consumption.unit}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Chip
                    icon={getVarianceIcon(consumption.variance)}
                    label={`${consumption.variance > 0 ? '+' : ''}${consumption.variance} ${consumption.unit}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: consumption.variance === 0 ? 'rgba(0, 0, 0, 0.08)' : 
                               consumption.variance > 0 ? '#ffebee' : '#e8f5e8',
                      color: getVarianceColor(consumption.variance),
                      '& .MuiChip-icon': { fontSize: 14 }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {consumption.workCenterName}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {consumption.operator}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {new Date(consumption.consumptionDate).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
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
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        sx={{ p: 0.5 }}
                        onClick={() => handleViewConsumption(consumption)}
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
          '.MuiTablePagination-toolbar': { minHeight: 40, padding: '4px 12px' },
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.75rem', m: 0 },
          '.MuiTablePagination-select': { fontSize: '0.75rem' },
          '.MuiIconButton-root': { padding: '4px', '& .MuiSvgIcon-root': { fontSize: 16 } }
        }}
      />

      {/* Record Consumption Dialog */}
      <Dialog open={recordDialog} onClose={() => setRecordDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Material Consumption</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="productionOrderId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.productionOrderId}>
                      <InputLabel>Production Order *</InputLabel>
                      <Select {...field} label="Production Order *">
                        {productionOrders.map((po: any) => (
                          <MenuItem key={po.id} value={po.id}>
                            {po.orderNumber} - {po.productName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="materialId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.materialId}>
                      <InputLabel>Material *</InputLabel>
                      <Select {...field} label="Material *">
                        {inventoryItems.map((item: any) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.itemCode} - {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Controller
                  name="workCenterId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.workCenterId}>
                      <InputLabel>Work Center *</InputLabel>
                      <Select {...field} label="Work Center *">
                        {workCenters.map((wc: any) => (
                          <MenuItem key={wc.id} value={wc.id}>
                            {wc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="plannedQuantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Planned Quantity *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.plannedQuantity}
                      helperText={errors.plannedQuantity?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="actualQuantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Actual Quantity *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.actualQuantity}
                      helperText={errors.actualQuantity?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Controller
                  name="consumptionDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Consumption Date *"
                      fullWidth
                      size="small"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.consumptionDate}
                      helperText={errors.consumptionDate?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="operator"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Operator *"
                      fullWidth
                      size="small"
                      error={!!errors.operator}
                      helperText={errors.operator?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes"
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit(onSubmit)}
            disabled={isRecording}
          >
            {isRecording ? 'Recording...' : 'Record Consumption'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Consumption Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Material Consumption Details</DialogTitle>
        <DialogContent>
          {selectedConsumption && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {selectedConsumption.materialCode} - {selectedConsumption.materialName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Production Order: {selectedConsumption.productionOrderNumber}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Planned Quantity</Typography>
                <Typography variant="body2">{selectedConsumption.plannedQuantity} {selectedConsumption.unit}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Actual Quantity</Typography>
                <Typography variant="body2">{selectedConsumption.actualQuantity} {selectedConsumption.unit}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Variance</Typography>
                <Typography variant="body2" sx={{ color: getVarianceColor(selectedConsumption.variance) }}>
                  {selectedConsumption.variance > 0 ? '+' : ''}{selectedConsumption.variance} {selectedConsumption.unit} 
                  ({selectedConsumption.variancePercentage?.toFixed(1)}%)
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Cost Impact</Typography>
                <Typography variant="body2" sx={{ color: getVarianceColor(selectedConsumption.costImpact) }}>
                  ₹{selectedConsumption.costImpact?.toFixed(2)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Work Center</Typography>
                <Typography variant="body2">{selectedConsumption.workCenterName}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Operator</Typography>
                <Typography variant="body2">{selectedConsumption.operator}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Consumption Date</Typography>
                <Typography variant="body2">
                  {new Date(selectedConsumption.consumptionDate).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Typography variant="body2">
                  {statusConfig[selectedConsumption.status as keyof typeof statusConfig]?.label || selectedConsumption.status}
                </Typography>
              </Grid>
              
              {selectedConsumption.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedConsumption.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Loading and Error States */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading material consumption data...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load material consumption data. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default MaterialConsumption;