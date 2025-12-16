import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search,
  QrCodeScanner,
  Inventory,
  Warning,
  Add,
  Edit,
  Visibility,
  LocationOn,
} from '@mui/icons-material';
import { useGetInventoryItemsQuery, useGetStockLevelsQuery } from '../../services/api';

interface BarcodeDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeDialog: React.FC<BarcodeDialogProps> = ({ open, onClose, onScan }) => {
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      setManualBarcode('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Barcode Scanner</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <QrCodeScanner sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Camera Scanner Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            For now, you can manually enter the barcode below
          </Typography>
          <TextField
            fullWidth
            label="Enter Barcode"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
            placeholder="Scan or type barcode here"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleManualScan} variant="contained" disabled={!manualBarcode.trim()}>
          Process Barcode
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  
  const {
    data: inventoryItems,
    isLoading: itemsLoading,
    error: itemsError,
  } = useGetInventoryItemsQuery();
  
  const {
    isLoading: stockLoading,
    error: stockError,
  } = useGetStockLevelsQuery();

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    // TODO: Implement barcode lookup and item selection
    alert(`Barcode scanned: ${barcode}`);
  };

  // Mock data for demonstration
  const mockInventoryItems = inventoryItems || [
    {
      id: '1',
      itemCode: 'STL-001',
      description: 'TATA Steel Sheet 2mm',
      category: 'RAW_MATERIAL',
      currentStock: 150,
      unit: 'KG',
      reorderLevel: 100,
      safetyStock: 50,
      location: 'A-01-01',
      barcode: '1234567890123',
    },
    {
      id: '2',
      itemCode: 'CTG-002',
      description: 'Powder Coating - White',
      category: 'CONSUMABLE',
      currentStock: 25,
      unit: 'KG',
      reorderLevel: 50,
      safetyStock: 20,
      location: 'B-02-03',
      barcode: '2345678901234',
    },
    {
      id: '3',
      itemCode: 'HRD-003',
      description: 'Door Handle - Premium',
      category: 'RAW_MATERIAL',
      currentStock: 80,
      unit: 'PCS',
      reorderLevel: 100,
      safetyStock: 30,
      location: 'C-01-05',
      barcode: '3456789012345',
    },
  ];

  const filteredItems = mockInventoryItems.filter(item =>
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = mockInventoryItems.filter(item => item.currentStock <= item.reorderLevel);

  const getStockStatus = (item: any) => {
    if (item.currentStock <= item.safetyStock) return { label: 'Critical', color: 'error' as const };
    if (item.currentStock <= item.reorderLevel) return { label: 'Low', color: 'warning' as const };
    return { label: 'Good', color: 'success' as const };
  };

  if (itemsLoading || stockLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (itemsError || stockError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load inventory data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScanner />}
            onClick={() => setBarcodeDialogOpen(true)}
          >
            Scan Barcode
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Navigate to add item */}}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Inventory sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Total Items</Typography>
              </Box>
              <Typography variant="h4">{mockInventoryItems.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Low Stock</Typography>
              </Box>
              <Typography variant="h4">{lowStockItems.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Locations</Typography>
              </Box>
              <Typography variant="h4">
                {new Set(mockInventoryItems.map(item => item.location.split('-')[0])).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <QrCodeScanner sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Barcoded</Typography>
              </Box>
              <Typography variant="h4">
                {mockInventoryItems.filter(item => item.barcode).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by item code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory Items
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell align="right">Reorder Level</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {item.itemCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.category.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell align="right">
                        {item.reorderLevel} {item.unit}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          {item.location}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit Item">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" title="Scan Barcode">
                          <QrCodeScanner />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Barcode Scanner Dialog */}
      <BarcodeDialog
        open={barcodeDialogOpen}
        onClose={() => setBarcodeDialogOpen(false)}
        onScan={handleBarcodeScanned}
      />
    </Box>
  );
};

export default InventoryManagement;