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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  NavigateNext,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useRecordScrapMutation,
  useGetProductionOrdersQuery,
  useGetInventoryItemsQuery,
  useGetWorkCentersQuery,
  useGetScrapRecordsQuery,
} from '../../services/api';

// Validation schema
const scrapRecordSchema = yup.object({
  productionOrderId: yup.string().required('Production order is required'),
  materialId: yup.string().required('Material is required'),
  operationId: yup.string().optional(),
  workCenterId: yup.string().required('Work center is required'),
  scrapQuantity: yup.number().positive('Scrap quantity must be positive').required('Scrap quantity is required'),
  scrapReason: yup.string().required('Scrap reason is required'),
  scrapCategory: yup.string().required('Scrap category is required'),
  scrapDate: yup.date().required('Scrap date is required'),
  operator: yup.string().required('Operator is required'),
  cost: yup.number().positive('Cost must be positive').optional(),
  notes: yup.string().optional(),
});

interface ScrapRecordFormData {
  productionOrderId: string;
  materialId: string;
  operationId?: string;
  workCenterId: string;
  scrapQuantity: number;
  scrapReason: string;
  scrapCategory: string;
  scrapDate: string;
  operator: string;
  cost?: number;
  notes?: string;
}

interface ScrapRecord {
  id: string;
  productionOrderId: string;
  productionOrderNumber: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  operationId?: string;
  operationName?: string;
  workCenterId: string;
  workCenterName: string;
  scrapQuantity: number;
  unit: string;
  scrapReason: string;
  scrapCategory: string;
  scrapDate: string;
  operator: string;
  cost?: number;
  costImpact: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const ScrapTrackingEnhanced: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [workCenterFilter, setWorkCenterFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordDialog, setRecordDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<ScrapRecord | null>(null);

  // API hooks
  const {
    data: scrapRecordsData,
    isLoading,
    error,
    refetch,
  } = useGetScrapRecordsQuery({});

  const { data: productionOrdersData } = useGetProductionOrdersQuery({});
  const { data: inventoryItemsData } = useGetInventoryItemsQuery();
  const { data: workCentersData } = useGetWorkCentersQuery();
  const [recordScrap, { isLoading: isRecording }] = useRecordScrapMutation();

  // Extract data
  const scrapRecords = Array.isArray(scrapRecordsData) ? scrapRecordsData : [];
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
  } = useForm<ScrapRecordFormData>({
    resolver: yupResolver(scrapRecordSchema) as any,
    defaultValues: {
      scrapDate: new Date().toISOString().split('T')[0],
    },
  });

  const watchedProductionOrder = watch('productionOrderId');
  const watchedMaterial = watch('materialId');

  // Scrap categories
  const scrapCategories = [
    'MATERIAL_DEFECT',
    'MACHINE_ERROR',
    'OPERATOR_ERROR',
    'DESIGN_ISSUE',
    'QUALITY_FAILURE',
    'SETUP_ERROR',
    'TOOL_WEAR',
    'OTHER'
  ];

  // Mock data for demonstration (replace with real API data when available)
  const mockScrapRecords: ScrapRecord[] = [
    {
      id: '1',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialId: 'mat-001',
      materialCode: 'STL-001',
      materialName: 'Steel Plate 10mm',
      operationId: 'op-001',
      operationName: 'Cutting',
      workCenterId: 'wc-001',
      workCenterName: 'Cutting Station',
      scrapQuantity: 5,
      unit: 'kg',
      scrapReason: 'Material defect found during cutting',
      scrapCategory: 'MATERIAL_DEFECT',
      scrapDate: '2024-12-16',
      operator: 'John Smith',
      cost: 250.00,
      costImpact: 250.00,
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
      operationId: 'op-002',
      operationName: 'Welding',
      workCenterId: 'wc-002',
      workCenterName: 'Welding Station 1',
      scrapQuantity: 10,
      unit: 'pcs',
      scrapReason: 'Operator error during welding setup',
      scrapCategory: 'OPERATOR_ERROR',
      scrapDate: '2024-12-16',
      operator: 'Mike Johnson',
      cost: 85.00,
      costImpact: 85.00,
      createdAt: '2024-12-16T11:15:00Z',
      updatedAt: '2024-12-16T11:15:00Z',
    },
  ];

  // Use mock data if API data is not available
  const scraps = scrapRecords.length > 0 ? scrapRecords : mockScrapRecords;

  // Handle form submission
  const onSubmit = async (data: ScrapRecordFormData) => {
    try {
      await recordScrap(data).unwrap();
      setRecordDialog(false);
      reset();
      refetch();
    } catch (err) {
      console.error('Failed to record scrap:', err);
    }
  };

  const handleViewScrap = (scrap: ScrapRecord) => {
    setSelectedScrap(scrap);
    setViewDialog(true);
  };

  // Category configuration
  const categoryConfig = {
    MATERIAL_DEFECT: { color: '#ffebee', textColor: '#d32f2f', label: 'Material Defect' },
    MACHINE_ERROR: { color: '#fff3e0', textColor: '#f57c00', label: 'Machine Error' },
    OPERATOR_ERROR: { color: '#e3f2fd', textColor: '#1976d2', label: 'Operator Error' },
    DESIGN_ISSUE: { color: '#f3e5f5', textColor: '#7b1fa2', label: 'Design Issue' },
    QUALITY_FAILURE: { color: '#ffebee', textColor: '#d32f2f', label: 'Quality Failure' },
    SETUP_ERROR: { color: '#fff8e1', textColor: '#f57c00', label: 'Setup Error' },
    TOOL_WEAR: { color: '#e8f5e8', textColor: '#388e3c', label: 'Tool Wear' },
    OTHER: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', label: 'Other' },
  };

  // Filter scraps
  const filteredScraps = scraps.filter((scrap) => {
    const matchesSearch = !search || 
      scrap.materialName.toLowerCase().includes(search.toLowerCase()) ||
      scrap.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      scrap.productionOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      scrap.operator.toLowerCase().includes(search.toLowerCase()) ||
      scrap.scrapReason.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !categoryFilter || scrap.scrapCategory === categoryFilter;
    const matchesWorkCenter = !workCenterFilter || scrap.workCenterId === workCenterFilter;
    const matchesDateRange = (!dateRange.start || scrap.scrapDate >= dateRange.start) &&
                            (!dateRange.end || scrap.scrapDate <= dateRange.end);
    
    return matchesSearch && matchesCategory && matchesWorkCenter && matchesDateRange;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredScraps.length,
    totalQuantity: filteredScraps.reduce((sum, s) => sum + s.scrapQuantity, 0),
    totalCost: filteredScraps.reduce((sum, s) => sum + (s.costImpact || 0), 0),
    byCategory: scrapCategories.reduce((acc, cat) => {
      acc[cat] = filteredScraps.filter(s => s.scrapCategory === cat).length;
      return acc;
    }, {} as Record<string, number>),
    topReason: filteredScraps.reduce((acc, scrap) => {
      acc[scrap.scrapReason] = (acc[scrap.scrapReason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
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
          Scrap Tracking
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
            <WarningIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              mb: 0,
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1.2
            }}>
              Scrap Tracking & Analysis
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Track and analyze production scrap with cost impact
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
            Record Scrap
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
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
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Quantity
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#d32f2f' }}>
                    {summaryStats.totalQuantity.toFixed(1)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon sx={{ fontSize: 24, color: '#f57c00' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Cost Impact
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#f57c00' }}>
                    ₹{summaryStats.totalCost.toFixed(0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BuildIcon sx={{ fontSize: 24, color: '#2e7d32' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Avg per Record
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#2e7d32' }}>
                    ₹{summaryStats.total > 0 ? (summaryStats.totalCost / summaryStats.total).toFixed(0) : '0'}
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
          placeholder="Search materials, orders, operators, or reasons..."
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
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Category"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {scrapCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {categoryConfig[category as keyof typeof categoryConfig]?.label || category}
              </MenuItem>
            ))}
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
            setCategoryFilter('');
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
                Operation
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
                Scrap Qty
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
                Category
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
                Cost Impact
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
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredScraps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((scrap: ScrapRecord) => (
              <TableRow 
                key={scrap.id} 
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
                    {scrap.productionOrderNumber}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {scrap.materialCode}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {scrap.materialName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {scrap.operationName || '-'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#d32f2f' }}>
                    {scrap.scrapQuantity} {scrap.unit}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Chip
                    label={categoryConfig[scrap.scrapCategory as keyof typeof categoryConfig]?.label || scrap.scrapCategory}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: categoryConfig[scrap.scrapCategory as keyof typeof categoryConfig]?.color,
                      color: categoryConfig[scrap.scrapCategory as keyof typeof categoryConfig]?.textColor,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#f57c00' }}>
                    ₹{scrap.costImpact?.toFixed(2) || '0.00'}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {scrap.operator}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {new Date(scrap.scrapDate).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        sx={{ p: 0.5 }}
                        onClick={() => handleViewScrap(scrap)}
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
        count={filteredScraps.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50, 100]}
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'white',
          '& .MuiTablePagination-toolbar': {
            fontSize: '0.75rem',
            minHeight: 48
          },
          '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            fontSize: '0.75rem'
          }
        }}
      />

      {/* Record Scrap Dialog */}
      <Dialog open={recordDialog} onClose={() => setRecordDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Scrap</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Production Order */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.productionOrderId} size="small">
                  <InputLabel>Production Order *</InputLabel>
                  <Controller
                    name="productionOrderId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Production Order *"
                      >
                        {productionOrders.map((order: any) => (
                          <MenuItem key={order.id} value={order.id}>
                            {order.orderNumber}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.productionOrderId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.productionOrderId.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Material */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.materialId} size="small">
                  <InputLabel>Material *</InputLabel>
                  <Controller
                    name="materialId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Material *"
                      >
                        {inventoryItems.map((item: any) => (
                          <MenuItem key={item.id} value={item.id}>
                            <Box>
                              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                {item.itemCode}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {item.name}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.materialId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.materialId.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Work Center */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.workCenterId} size="small">
                  <InputLabel>Work Center *</InputLabel>
                  <Controller
                    name="workCenterId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Work Center *"
                      >
                        {workCenters.map((wc: any) => (
                          <MenuItem key={wc.id} value={wc.id}>
                            {wc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.workCenterId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.workCenterId.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Scrap Quantity */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="scrapQuantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scrap Quantity *"
                      type="number"
                      fullWidth
                      error={!!errors.scrapQuantity}
                      helperText={errors.scrapQuantity?.message}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Scrap Category */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.scrapCategory} size="small">
                  <InputLabel>Scrap Category *</InputLabel>
                  <Controller
                    name="scrapCategory"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Scrap Category *"
                      >
                        {scrapCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {categoryConfig[category as keyof typeof categoryConfig]?.label || category}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.scrapCategory && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {errors.scrapCategory.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              {/* Operator */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="operator"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Operator *"
                      fullWidth
                      error={!!errors.operator}
                      helperText={errors.operator?.message}
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Scrap Date */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="scrapDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scrap Date *"
                      type="date"
                      fullWidth
                      error={!!errors.scrapDate}
                      helperText={errors.scrapDate?.message}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Cost */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="cost"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cost Impact"
                      type="number"
                      fullWidth
                      error={!!errors.cost}
                      helperText={errors.cost?.message}
                      inputProps={{ min: 0, step: 0.01 }}
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Scrap Reason */}
              <Grid item xs={12}>
                <Controller
                  name="scrapReason"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Scrap Reason *"
                      fullWidth
                      multiline
                      rows={3}
                      error={!!errors.scrapReason}
                      helperText={errors.scrapReason?.message}
                      size="small"
                    />
                  )}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Additional Notes"
                      fullWidth
                      multiline
                      rows={2}
                      error={!!errors.notes}
                      helperText={errors.notes?.message}
                      size="small"
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
            {isRecording ? 'Recording...' : 'Record Scrap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Scrap Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Scrap Record Details</DialogTitle>
        <DialogContent>
          {selectedScrap && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Production Order</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedScrap.productionOrderNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Material</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedScrap.materialCode} - {selectedScrap.materialName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Operation</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedScrap.operationName || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Work Center</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedScrap.workCenterName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Scrap Quantity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  {selectedScrap.scrapQuantity} {selectedScrap.unit}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Chip
                  label={categoryConfig[selectedScrap.scrapCategory as keyof typeof categoryConfig]?.label || selectedScrap.scrapCategory}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: categoryConfig[selectedScrap.scrapCategory as keyof typeof categoryConfig]?.color,
                    color: categoryConfig[selectedScrap.scrapCategory as keyof typeof categoryConfig]?.textColor,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Cost Impact</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00' }}>
                  ₹{selectedScrap.costImpact?.toFixed(2) || '0.00'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Operator</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedScrap.operator}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {new Date(selectedScrap.scrapDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Reason</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedScrap.scrapReason}
                </Typography>
              </Grid>
              {selectedScrap.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {selectedScrap.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScrapTrackingEnhanced;