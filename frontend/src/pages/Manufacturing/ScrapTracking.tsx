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
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useRecordScrapMutation,
  useGetProductionOrdersQuery,
} from '../../services/api';

interface ScrapRecord {
  id: string;
  productionOrderId: string;
  productionOrderNumber: string;
  materialCode: string;
  materialName: string;
  scrapQuantity: number;
  unit: string;
  scrapReason: string;
  scrapCategory: string;
  workCenter: string;
  operator: string;
  scrapDate: string;
  costImpact: number;
  status: string;
  corrective_action?: string;
  notes?: string;
}

const ScrapTracking: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [recordDialog, setRecordDialog] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<ScrapRecord | null>(null);

  // API hooks
  const { data: productionOrders } = useGetProductionOrdersQuery({});
  const [recordScrap] = useRecordScrapMutation();

  // Mock data for demonstration
  const mockScrapRecords: ScrapRecord[] = [
    {
      id: '1',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialCode: 'STL-001',
      materialName: 'Steel Plate 10mm',
      scrapQuantity: 5,
      unit: 'kg',
      scrapReason: 'Cutting error - wrong dimensions',
      scrapCategory: 'MACHINING_ERROR',
      workCenter: 'Cutting Station',
      operator: 'John Smith',
      scrapDate: '2024-12-16',
      costImpact: 125.50,
      status: 'RECORDED',
      corrective_action: 'Retrain operator on measurement procedures',
    },
    {
      id: '2',
      productionOrderId: 'po-001',
      productionOrderNumber: 'PO-2024-001',
      materialCode: 'WLD-001',
      materialName: 'Welding Rod 3.2mm',
      scrapQuantity: 10,
      unit: 'pcs',
      scrapReason: 'Defective welding rods - poor quality',
      scrapCategory: 'MATERIAL_DEFECT',
      workCenter: 'Welding Station 1',
      operator: 'Mike Johnson',
      scrapDate: '2024-12-16',
      costImpact: 45.00,
      status: 'UNDER_INVESTIGATION',
    },
    {
      id: '3',
      productionOrderId: 'po-002',
      productionOrderNumber: 'PO-2024-002',
      materialCode: 'ALU-001',
      materialName: 'Aluminum Sheet 5mm',
      scrapQuantity: 2,
      unit: 'kg',
      scrapReason: 'Machine malfunction during cutting',
      scrapCategory: 'EQUIPMENT_FAILURE',
      workCenter: 'CNC Machine Center',
      operator: 'Sarah Wilson',
      scrapDate: '2024-12-17',
      costImpact: 85.00,
      status: 'CORRECTIVE_ACTION_TAKEN',
      corrective_action: 'Machine calibration and maintenance completed',
    },
  ];

  // Scrap category configuration
  const categoryConfig = {
    MACHINING_ERROR: { color: '#fff3e0', textColor: '#f57c00', label: 'Machining Error' },
    MATERIAL_DEFECT: { color: '#ffebee', textColor: '#d32f2f', label: 'Material Defect' },
    EQUIPMENT_FAILURE: { color: '#e3f2fd', textColor: theme.palette.primary.main, label: 'Equipment Failure' },
    OPERATOR_ERROR: { color: '#fff3e0', textColor: '#f57c00', label: 'Operator Error' },
    DESIGN_ISSUE: { color: '#f3e5f5', textColor: '#9c27b0', label: 'Design Issue' },
    QUALITY_ISSUE: { color: '#ffebee', textColor: '#d32f2f', label: 'Quality Issue' },
  };

  // Status configuration
  const statusConfig = {
    RECORDED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <AssignmentIcon />, label: 'Recorded' },
    UNDER_INVESTIGATION: { color: '#fff3e0', textColor: '#f57c00', icon: <WarningIcon />, label: 'Under Investigation' },
    CORRECTIVE_ACTION_TAKEN: { color: '#e8f5e8', textColor: '#2e7d32', icon: <AssignmentIcon />, label: 'Action Taken' },
    CLOSED: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', icon: <AssignmentIcon />, label: 'Closed' },
  };

  // Handle record scrap
  const handleRecordScrap = async (data: any) => {
    try {
      await recordScrap(data).unwrap();
      setRecordDialog(false);
    } catch (error) {
      console.error('Failed to record scrap:', error);
    }
  };

  // Filter scrap records
  const filteredScrapRecords = mockScrapRecords.filter((scrap) => {
    const matchesSearch = !search || 
      scrap.materialName.toLowerCase().includes(search.toLowerCase()) ||
      scrap.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      scrap.productionOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
      scrap.scrapReason.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || scrap.scrapCategory === categoryFilter;
    const matchesDateRange = (!dateRange.start || scrap.scrapDate >= dateRange.start) &&
                            (!dateRange.end || scrap.scrapDate <= dateRange.end);
    
    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredScrapRecords.length,
    totalCost: filteredScrapRecords.reduce((sum, s) => sum + s.costImpact, 0),
    underInvestigation: filteredScrapRecords.filter(s => s.status === 'UNDER_INVESTIGATION').length,
    actionTaken: filteredScrapRecords.filter(s => s.status === 'CORRECTIVE_ACTION_TAKEN').length,
    topCategory: Object.entries(
      filteredScrapRecords.reduce((acc, s) => {
        acc[s.scrapCategory] = (acc[s.scrapCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A',
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
              <DeleteIcon sx={{ fontSize: 28, color: 'white' }} />
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
                Track scrap, analyze causes, and implement corrective actions
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/scrap-analysis')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Analytics
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
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DeleteIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Scrap Records
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
                  <TrendingUpIcon sx={{ color: '#d32f2f' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Cost Impact
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      ${summaryStats.totalCost.toFixed(2)}
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
                      Under Investigation
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.underInvestigation}
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
                  <AssignmentIcon sx={{ color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Top Category
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {categoryConfig[summaryStats.topCategory as keyof typeof categoryConfig]?.label || summaryStats.topCategory}
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
            placeholder="Search scrap records..."
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
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Category"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="MACHINING_ERROR">Machining Error</MenuItem>
              <MenuItem value="MATERIAL_DEFECT">Material Defect</MenuItem>
              <MenuItem value="EQUIPMENT_FAILURE">Equipment Failure</MenuItem>
              <MenuItem value="OPERATOR_ERROR">Operator Error</MenuItem>
              <MenuItem value="DESIGN_ISSUE">Design Issue</MenuItem>
              <MenuItem value="QUALITY_ISSUE">Quality Issue</MenuItem>
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
          <Table stickyHeader size="small" sx={{ minWidth: 1500 }}>
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
                  Reason
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
              {filteredScrapRecords.map((scrap: ScrapRecord, index: number) => (
                <TableRow 
                  key={scrap.id} 
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
                      {scrap.productionOrderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {scrap.materialCode}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {scrap.materialName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={`${scrap.scrapQuantity} ${scrap.unit}`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: '#ffebee',
                        color: '#d32f2f',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
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
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle', maxWidth: 200 }}>
                    <Tooltip title={scrap.scrapReason}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.75rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {scrap.scrapReason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {scrap.workCenter}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        color: '#d32f2f'
                      }}
                    >
                      ${scrap.costImpact.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(scrap.scrapDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[scrap.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[scrap.status as keyof typeof statusConfig]?.label || scrap.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[scrap.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[scrap.status as keyof typeof statusConfig]?.textColor,
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
                          onClick={() => setSelectedScrap(scrap)}
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
          count={filteredScrapRecords.length}
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

        {/* Record Scrap Dialog */}
        <Dialog open={recordDialog} onClose={() => setRecordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Record Scrap</DialogTitle>
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Scrap Quantity"
                  type="number"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit"
                  defaultValue="kg"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Scrap Category</InputLabel>
                  <Select defaultValue="" label="Scrap Category">
                    <MenuItem value="MACHINING_ERROR">Machining Error</MenuItem>
                    <MenuItem value="MATERIAL_DEFECT">Material Defect</MenuItem>
                    <MenuItem value="EQUIPMENT_FAILURE">Equipment Failure</MenuItem>
                    <MenuItem value="OPERATOR_ERROR">Operator Error</MenuItem>
                    <MenuItem value="DESIGN_ISSUE">Design Issue</MenuItem>
                    <MenuItem value="QUALITY_ISSUE">Quality Issue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Scrap Reason"
                  multiline
                  rows={2}
                  required
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Scrap Date"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cost Impact"
                  type="number"
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Corrective Action"
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
                handleRecordScrap({
                  productionOrderId: 'po-001',
                  materialCode: 'STL-001',
                  materialName: 'Steel Plate 10mm',
                  scrapQuantity: 5,
                  unit: 'kg',
                  scrapReason: 'Cutting error - wrong dimensions',
                  scrapCategory: 'MACHINING_ERROR',
                  workCenter: 'Cutting Station',
                  operator: 'John Smith',
                  scrapDate: new Date().toISOString(),
                  costImpact: 125.50,
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

export default ScrapTracking;