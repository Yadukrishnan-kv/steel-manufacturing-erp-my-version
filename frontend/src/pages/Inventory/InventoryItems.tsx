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
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  QrCode as BarcodeIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  NavigateNext,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
} from '../../services/api';

// Validation schema
const inventoryItemSchema = yup.object({
  itemCode: yup.string().required('Item code is required'),
  name: yup.string().required('Item name is required'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  unit: yup.string().required('Unit is required'),
  standardCost: yup.number().positive('Standard cost must be positive').required('Standard cost is required'),
  reorderLevel: yup.number().min(0, 'Reorder level must be non-negative').required('Reorder level is required'),
  maxStockLevel: yup.number().min(0, 'Max stock level must be non-negative').required('Max stock level is required'),
  location: yup.string().required('Location is required'),
  barcode: yup.string().optional(),
});

interface InventoryItemFormData {
  itemCode: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  standardCost: number;
  reorderLevel: number;
  maxStockLevel: number;
  location: string;
  barcode?: string;
}

const InventoryItems: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // API hooks
  const {
    data: inventoryItemsData,
    isLoading,
    error,
    refetch,
  } = useGetInventoryItemsQuery();

  const [createInventoryItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();

  // Extract data
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];
  const totalCount = inventoryItems.length;

  // Filter items
  const filteredItems = inventoryItems.filter((item: any) => {
    const matchesSearch = !search || 
      item.itemCode?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(inventoryItems.map((item: any) => item.category))].filter(Boolean);

  // Form handling
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InventoryItemFormData>({
    resolver: yupResolver(inventoryItemSchema) as any,
    defaultValues: {
      unit: 'PCS',
      category: 'RAW_MATERIAL',
    },
  });

  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      await createInventoryItem(data).unwrap();
      setCreateDialog(false);
      reset();
      refetch();
    } catch (err) {
      console.error('Failed to create inventory item:', err);
    }
  };

  const handleViewItem = (item: any) => {
    setSelectedItem(item);
    setViewDialog(true);
  };

  // Stock status configuration
  const getStockStatus = (item: any) => {
    const currentStock = item.currentStock || 0;
    const reorderLevel = item.reorderLevel || 0;
    const maxStockLevel = item.maxStockLevel || 0;

    if (currentStock <= reorderLevel) {
      return { status: 'LOW', color: '#ffebee', textColor: '#d32f2f', icon: <WarningIcon />, label: 'Low Stock' };
    } else if (currentStock >= maxStockLevel) {
      return { status: 'HIGH', color: '#fff3e0', textColor: '#f57c00', icon: <WarningIcon />, label: 'Overstock' };
    } else {
      return { status: 'NORMAL', color: '#e8f5e8', textColor: '#2e7d32', icon: <CheckIcon />, label: 'Normal' };
    }
  };

  // Category configuration
  const categoryConfig = {
    RAW_MATERIAL: { color: '#e3f2fd', textColor: '#1976d2', label: 'Raw Material' },
    FINISHED_GOODS: { color: '#e8f5e9', textColor: '#388e3c', label: 'Finished Goods' },
    WORK_IN_PROGRESS: { color: '#fff3e0', textColor: '#f57c00', label: 'Work in Progress' },
    CONSUMABLES: { color: '#f3e5f5', textColor: '#7b1fa2', label: 'Consumables' },
    SPARE_PARTS: { color: '#fce4ec', textColor: '#c2185b', label: 'Spare Parts' },
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
          Inventory Items
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
              Inventory Items
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              Manage inventory items, stock levels, and item information
            </Typography>
          </Box>
        </Box>
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
          New Item
        </Button>
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
          icon={<InventoryIcon />}
          label={`${totalCount} Total Items`}
          size="small"
          sx={{
            bgcolor: `${theme.palette.primary.light}15`,
            color: theme.palette.primary.main,
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { color: theme.palette.primary.main, fontSize: 16 }
          }}
        />
        <Chip
          icon={<WarningIcon />}
          label={`${inventoryItems.filter((item: any) => (item.currentStock || 0) <= (item.reorderLevel || 0)).length} Low Stock`}
          size="small"
          sx={{
            bgcolor: '#ffebee',
            color: '#d32f2f',
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { color: '#d32f2f', fontSize: 16 }
          }}
        />
        <Chip
          icon={<CheckIcon />}
          label={`${categories.length} Categories`}
          size="small"
          sx={{
            bgcolor: '#e8f5e8',
            color: '#2e7d32',
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { color: '#2e7d32', fontSize: 16 }
          }}
        />
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
          placeholder="Search items..."
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
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {categoryConfig[category as keyof typeof categoryConfig]?.label || category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setSearch('');
            setCategoryFilter('');
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
                Unit Cost
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
            {filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item: any) => {
              const stockStatus = getStockStatus(item);
              return (
                <TableRow 
                  key={item.id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                    '&:nth-of-type(even)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                  }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
                        {item.itemCode}
                      </Typography>
                      {item.barcode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <BarcodeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                            {item.barcode}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {item.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Chip
                      label={categoryConfig[item.category as keyof typeof categoryConfig]?.label || item.category}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: categoryConfig[item.category as keyof typeof categoryConfig]?.color,
                        color: categoryConfig[item.category as keyof typeof categoryConfig]?.textColor,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.currentStock || 0} {item.unit}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        Reorder: {item.reorderLevel || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      ₹{item.standardCost?.toFixed(2) || '0.00'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {item.location}
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
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => handleViewItem(item)}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" sx={{ p: 0.5 }}>
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
        count={filteredItems.length}
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

      {/* Create Item Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Inventory Item</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="itemCode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Item Code *"
                      fullWidth
                      size="small"
                      error={!!errors.itemCode}
                      helperText={errors.itemCode?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Item Name *"
                      fullWidth
                      size="small"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description *"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.category}>
                      <InputLabel>Category *</InputLabel>
                      <Select {...field} label="Category *">
                        <MenuItem value="RAW_MATERIAL">Raw Material</MenuItem>
                        <MenuItem value="FINISHED_GOODS">Finished Goods</MenuItem>
                        <MenuItem value="WORK_IN_PROGRESS">Work in Progress</MenuItem>
                        <MenuItem value="CONSUMABLES">Consumables</MenuItem>
                        <MenuItem value="SPARE_PARTS">Spare Parts</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.unit}>
                      <InputLabel>Unit *</InputLabel>
                      <Select {...field} label="Unit *">
                        <MenuItem value="PCS">Pieces</MenuItem>
                        <MenuItem value="KG">Kilograms</MenuItem>
                        <MenuItem value="METER">Meters</MenuItem>
                        <MenuItem value="LITER">Liters</MenuItem>
                        <MenuItem value="BOX">Box</MenuItem>
                        <MenuItem value="SET">Set</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="standardCost"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Standard Cost *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors.standardCost}
                      helperText={errors.standardCost?.message}
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
              <Grid item xs={12} md={6}>
                <Controller
                  name="reorderLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Reorder Level *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      error={!!errors.reorderLevel}
                      helperText={errors.reorderLevel?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name="maxStockLevel"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Stock Level *"
                      fullWidth
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      error={!!errors.maxStockLevel}
                      helperText={errors.maxStockLevel?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Barcode"
                      fullWidth
                      size="small"
                      error={!!errors.barcode}
                      helperText={errors.barcode?.message}
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
            {isCreating ? 'Creating...' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Item Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedItem.name}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedItem.description}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Item Code</Typography>
                <Typography variant="body2">{selectedItem.itemCode}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body2">
                  {categoryConfig[selectedItem.category as keyof typeof categoryConfig]?.label || selectedItem.category}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Current Stock</Typography>
                <Typography variant="body2">{selectedItem.currentStock || 0} {selectedItem.unit}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Standard Cost</Typography>
                <Typography variant="body2">₹{selectedItem.standardCost?.toFixed(2) || '0.00'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2">{selectedItem.location}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="text.secondary">Barcode</Typography>
                <Typography variant="body2">{selectedItem.barcode || 'N/A'}</Typography>
              </Grid>
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
          <Typography>Loading inventory items...</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load inventory items. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default InventoryItems;