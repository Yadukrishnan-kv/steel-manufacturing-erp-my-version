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
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  TrendingUp as InIcon,
  TrendingDown as OutIcon,
  SwapHoriz as TransferIcon,
  Build as AdjustmentIcon,
  NavigateNext,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useGetStockTransactionsQuery,
  useCreateStockTransactionMutation,
  useGetInventoryItemsQuery,
} from '../../services/api';

// Validation schema
const stockTransactionSchema = yup.object({
  itemId: yup.string().required('Item is required'),
  transactionType: yup.string().required('Transaction type is required'),
  quantity: yup.number().positive('Quantity must be positive').required('Quantity is required'),
  location: yup.string().required('Location is required'),
  reference: yup.string().optional(),
  notes: yup.string().optional(),
});

interface StockTransactionFormData {
  itemId: string;
  transactionType: string;
  quantity: number;
  location: string;
  reference?: string;
  notes?: string;
}

const StockTransactions: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // API hooks
  const {
    data: stockTransactionsData,
    isLoading,
    error,
    refetch,
  } = useGetStockTransactionsQuery();

  const { data: inventoryItemsData } = useGetInventoryItemsQuery();
  const [createStockTransaction, { isLoading: isCreating }] = useCreateStockTransactionMutation();

  // Extract data
  const stockTransactions = Array.isArray(stockTransactionsData) ? stockTransactionsData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];
  
  // Enrich transactions with item details
  const enrichedTransactions = stockTransactions.map((transaction: any) => {
    const item = inventoryItems.find((item: any) => item.id === transaction.itemId);
    return {
      ...transaction,
      item: item || {},
      itemCode: item?.itemCode || transaction.itemCode || 'N/A',
      itemName: item?.name || transaction.itemName || 'Unknown Item',
      unit: item?.unit || 'PCS',
    };
  });

  // Filter transactions
  const filteredTransactions = enrichedTransactions.filter((transaction: any) => {
    const matchesSearch = !search || 
      transaction.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.location?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = !typeFilter || transaction.transactionType === typeFilter;
    const matchesLocation = !locationFilter || transaction.location?.includes(locationFilter);
    
    let matchesDate = true;
    if (dateFilter) {
      const transactionDate = new Date(transaction.createdAt);
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = transactionDate.toDateString() === filterDate.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(filterDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(filterDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesLocation && matchesDate;
  });

  // Get unique locations
  const locations = [...new Set(enrichedTransactions.map((transaction: any) => transaction.location?.split('-')[0]).filter(Boolean))];

  // Form handling
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StockTransactionFormData>({
    resolver: yupResolver(stockTransactionSchema) as any,
    defaultValues: {
      transactionType: 'IN',
    },
  });

  const onSubmit = async (data: StockTransactionFormData) => {
    try {
      await createStockTransaction(data).unwrap();
      setCreateDialog(false);
      reset();
      refetch();
    } catch (err) {
      console.error('Failed to create stock transaction:', err);
    }
  };

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setViewDialog(true);
  };

  // Transaction type configuration
  const transactionTypeConfig = {
    IN: { color: '#e8f5e8', textColor: '#2e7d32', icon: <InIcon />, label: 'Stock In' },
    OUT: { color: '#ffebee', textColor: '#d32f2f', icon: <OutIcon />, label: 'Stock Out' },
    TRANSFER: { color: '#e3f2fd', textColor: '#1976d2', icon: <TransferIcon />, label: 'Transfer' },
    ADJUSTMENT: { color: '#fff3e0', textColor: '#f57c00', icon: <AdjustmentIcon />, label: 'Adjustment' },
  };

  // Summary statistics
  const summaryStats = {
    totalTransactions: filteredTransactions.length,
    stockIn: filteredTransactions.filter(t => t.transactionType === 'IN').length,
    stockOut: filteredTransactions.filter(t => t.transactionType === 'OUT').length,
    transfers: filteredTransactions.filter(t => t.transactionType === 'TRANSFER').length,
    adjustments: filteredTransactions.filter(t => t.transactionType === 'ADJUSTMENT').length,
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
          Stock Transactions
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
            <TransferIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              mb: 0,
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1.2
            }}>
              Stock Transactions
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Track all inventory movements and adjustments
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
            onClick={() => setCreateDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            New Transaction
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TransferIcon sx={{ fontSize: 24, color: theme.palette.primary.main }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {summaryStats.totalTransactions}
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
                <InIcon sx={{ fontSize: 24, color: '#2e7d32' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Stock In
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#2e7d32' }}>
                    {summaryStats.stockIn}
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
                <OutIcon sx={{ fontSize: 24, color: '#d32f2f' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Stock Out
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#d32f2f' }}>
                    {summaryStats.stockOut}
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
                <TransferIcon sx={{ fontSize: 24, color: '#1976d2' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Transfers
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1976d2' }}>
                    {summaryStats.transfers}
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
                <AdjustmentIcon sx={{ fontSize: 24, color: '#f57c00' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Adjustments
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#f57c00' }}>
                    {summaryStats.adjustments}
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
          placeholder="Search transactions..."
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
          <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            label="Type"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="IN">Stock In</MenuItem>
            <MenuItem value="OUT">Stock Out</MenuItem>
            <MenuItem value="TRANSFER">Transfer</MenuItem>
            <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
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

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Date</InputLabel>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            label="Date"
            sx={{ height: 32, fontSize: '0.75rem' }}
          >
            <MenuItem value="">All Dates</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setSearch('');
            setTypeFilter('');
            setLocationFilter('');
            setDateFilter('');
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
                Date & Time
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
                Item
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
                Type
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
                Reference
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
                User
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
            {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction: any) => {
              const typeConfig = transactionTypeConfig[transaction.transactionType as keyof typeof transactionTypeConfig];
              const transactionDate = new Date(transaction.createdAt);
              
              return (
                <TableRow 
                  key={transaction.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {transactionDate.toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {transactionDate.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
                        {transaction.itemCode}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {transaction.itemName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Chip
                      icon={typeConfig?.icon}
                      label={typeConfig?.label || transaction.transactionType}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: typeConfig?.color,
                        color: typeConfig?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {transaction.quantity} {transaction.unit}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {transaction.location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {transaction.reference || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {transaction.createdBy?.name || 'System'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        sx={{ p: 0.5 }}
                        onClick={() => handleViewTransaction(transaction)}
                      >
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
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
        count={filteredTransactions.length}
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

      {/* Create Transaction Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Stock Transaction</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="itemId"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.itemId}>
                      <InputLabel>Item *</InputLabel>
                      <Select {...field} label="Item *">
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
                  name="transactionType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.transactionType}>
                      <InputLabel>Transaction Type *</InputLabel>
                      <Select {...field} label="Transaction Type *">
                        <MenuItem value="IN">Stock In</MenuItem>
                        <MenuItem value="OUT">Stock Out</MenuItem>
                        <MenuItem value="TRANSFER">Transfer</MenuItem>
                        <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Quantity *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.quantity}
                      helperText={errors.quantity?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Location *"
                      fullWidth
                      size="small"
                      placeholder="e.g., A-01-01"
                      error={!!errors.location}
                      helperText={errors.location?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="reference"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reference"
                      fullWidth
                      size="small"
                      placeholder="e.g., PO-001, SO-001"
                      error={!!errors.reference}
                      helperText={errors.reference?.message}
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
                      rows={2}
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
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit(onSubmit)}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Transaction'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Transaction Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">
                  {selectedTransaction.itemCode} - {selectedTransaction.itemName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transaction ID: {selectedTransaction.id}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Transaction Type</Typography>
                <Typography variant="body2">
                  {transactionTypeConfig[selectedTransaction.transactionType as keyof typeof transactionTypeConfig]?.label || selectedTransaction.transactionType}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                <Typography variant="body2">{selectedTransaction.quantity} {selectedTransaction.unit}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2">{selectedTransaction.location}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Reference</Typography>
                <Typography variant="body2">{selectedTransaction.reference || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Created By</Typography>
                <Typography variant="body2">{selectedTransaction.createdBy?.name || 'System'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Created At</Typography>
                <Typography variant="body2">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              {selectedTransaction.notes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{selectedTransaction.notes}</Typography>
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
          <Typography>Loading stock transactions...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load stock transactions. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default StockTransactions;