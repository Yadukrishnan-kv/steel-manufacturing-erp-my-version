import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  InputAdornment,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  NavigateNext,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetStockLevelsQuery,
  useGetInventoryItemsQuery,
} from '../../services/api';

const StockLevels: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  
  // API hooks
  const {
    data: stockLevelsData,
    isLoading,
    error,
    refetch,
  } = useGetStockLevelsQuery();

  const { data: inventoryItemsData } = useGetInventoryItemsQuery();

  // Extract data
  const stockLevels = Array.isArray(stockLevelsData) ? stockLevelsData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];
  
  // Combine stock levels with inventory item details
  const enrichedStockData = stockLevels.map((stock: any) => {
    const item = inventoryItems.find((item: any) => item.id === stock.itemId);
    return {
      ...stock,
      item: item || {},
      itemCode: item?.itemCode || stock.itemCode || 'N/A',
      itemName: item?.name || stock.itemName || 'Unknown Item',
      category: item?.category || 'UNKNOWN',
      unit: item?.unit || 'PCS',
      reorderLevel: item?.reorderLevel || stock.reorderLevel || 0,
      maxStockLevel: item?.maxStockLevel || stock.maxStockLevel || 0,
      standardCost: item?.standardCost || 0,
    };
  });

  // Filter stock data
  const filteredStockData = enrichedStockData.filter((stock: any) => {
    const matchesSearch = !search || 
      stock.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      stock.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      stock.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = !statusFilter || getStockStatus(stock).status === statusFilter;
    const matchesLocation = !locationFilter || stock.location?.includes(locationFilter);
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Get unique locations
  const locations = [...new Set(enrichedStockData.map((stock: any) => stock.location?.split('-')[0]).filter(Boolean))];

  // Stock status configuration
  const getStockStatus = (stock: any) => {
    const currentStock = stock.currentStock || 0;
    const reorderLevel = stock.reorderLevel || 0;
    const maxStockLevel = stock.maxStockLevel || 0;

    if (currentStock === 0) {
      return { status: 'OUT_OF_STOCK', color: '#ffebee', textColor: '#d32f2f', icon: <WarningIcon />, label: 'Out of Stock' };
    } else if (currentStock <= reorderLevel) {
      return { status: 'LOW_STOCK', color: '#fff3e0', textColor: '#f57c00', icon: <WarningIcon />, label: 'Low Stock' };
    } else if (currentStock >= maxStockLevel) {
      return { status: 'OVERSTOCK', color: '#e1f5fe', textColor: '#0277bd', icon: <TrendingUpIcon />, label: 'Overstock' };
    } else {
      return { status: 'NORMAL', color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckIcon />, label: 'Normal' };
    }
  };

  // Calculate stock percentage
  const getStockPercentage = (stock: any) => {
    const current = stock.currentStock || 0;
    const max = stock.maxStockLevel || 100;
    return Math.min((current / max) * 100, 100);
  };

  // Summary statistics
  const summaryStats = {
    totalItems: enrichedStockData.length,
    outOfStock: enrichedStockData.filter(stock => (stock.currentStock || 0) === 0).length,
    lowStock: enrichedStockData.filter(stock => {
      const current = stock.currentStock || 0;
      const reorder = stock.reorderLevel || 0;
      return current > 0 && current <= reorder;
    }).length,
    overstock: enrichedStockData.filter(stock => {
      const current = stock.currentStock || 0;
      const max = stock.maxStockLevel || 0;
      return current >= max && max > 0;
    }).length,
    totalValue: enrichedStockData.reduce((sum, stock) => {
      return sum + ((stock.currentStock || 0) * (stock.standardCost || 0));
    }, 0),
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
            navigate('/inventory');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Inventory
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          Stock Levels
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
              Stock Levels
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Monitor inventory levels across all locations
            </Typography>
          </Box>
        </Box>
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
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Items
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {summaryStats.totalItems}
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
                <WarningIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Out of Stock
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#d32f2f' }}>
                    {summaryStats.outOfStock}
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
                <TrendingDownIcon sx={{ fontSize: 24, color: '#f57c00' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Low Stock
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#f57c00' }}>
                    {summaryStats.lowStock}
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
                <TrendingUpIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Value
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: theme.palette.primary.main }}>
                    ₹{summaryStats.totalValue.toFixed(0)}
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
          placeholder="Search items or locations..."
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
            <MenuItem value="OUT_OF_STOCK">Out of Stock</MenuItem>
            <MenuItem value="LOW_STOCK">Low Stock</MenuItem>
            <MenuItem value="NORMAL">Normal</MenuItem>
            <MenuItem value="OVERSTOCK">Overstock</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Location</InputLabel>
          <Select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            label="Location"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location} value={location}>
                {location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setSearch('');
            setStatusFilter('');
            setLocationFilter('');
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
                Item Code
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
                Item Name
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
                Location
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
                Current Stock
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
                Stock Level
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
                Value
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
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStockData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((stock: any) => {
              const stockStatus = getStockStatus(stock);
              const stockPercentage = getStockPercentage(stock);
              const stockValue = (stock.currentStock || 0) * (stock.standardCost || 0);
              
              return (
                <TableRow 
                  key={`${stock.itemId}-${stock.location}`}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
                      {stock.itemCode}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {stock.itemName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {stock.location || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {stock.currentStock || 0} {stock.unit}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        Reorder: {stock.reorderLevel || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          {stockPercentage.toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          Max: {stock.maxStockLevel || 0}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stockPercentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: stockStatus.status === 'LOW_STOCK' || stockStatus.status === 'OUT_OF_STOCK' 
                              ? '#f57c00' 
                              : stockStatus.status === 'OVERSTOCK' 
                                ? '#0277bd' 
                                : '#2e7d32'
                          }
                        }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      ₹{stockValue.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Chip
                      icon={stockStatus.icon}
                      label={stockStatus.label}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: stockStatus.color,
                        color: stockStatus.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredStockData.length}
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

      {/* Loading and Error States */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Typography>Loading stock levels...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load stock levels. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default StockLevels;