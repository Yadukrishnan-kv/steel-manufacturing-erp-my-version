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
  Menu,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Assignment as BOMIcon,
  ExpandMore as ExpandMoreIcon,
  Calculate as CalculateIcon,
  Engineering as EngineeringIcon,
  MoreVert as MoreIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetProductsQuery,
  useGetInventoryItemsForBOMQuery,
  useGetBOMsQuery,
  useGetBOMQuery,
  useApproveBOMMutation,
  useGetBOMCostQuery,
  useCreateEngineeringChangeMutation,
  useCreateBOMMutation,
} from '../../services/api';

interface BOM {
  id: string;
  productId: string;
  revision: string;
  status: string;
  effectiveDate: string;
  engineeringChangeNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  items?: BOMItem[];
  totalCost?: number;
}

interface BOMItem {
  id: string;
  bomId: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  scrapPercentage: number;
  operation?: string;
  level: number;
  parentItemId?: string;
  sequence?: number;
  inventoryItem: {
    id: string;
    name: string;
    code: string;
    standardCost?: number;
  };
  children?: BOMItem[];
}

const BOMManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Get responsive navigation state (for potential future use)
  // const { isMobile, sidebarCollapsed } = useResponsiveNavigation({
  //   defaultCollapsed: false,
  //   persistCollapsedState: true,
  //   storageKey: 'steelforge-sidebar-collapsed',
  // });
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Show all BOMs by default
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [bomDetailDialog, setBomDetailDialog] = useState(false);
  const [costAnalysisDialog, setCostAnalysisDialog] = useState(false);
  const [engineeringChangeDialog, setEngineeringChangeDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement | null; bom: BOM | null }>({
    anchorEl: null,
    bom: null,
  });
  const [createBOMDialog, setCreateBOMDialog] = useState(false);
  const [createBOMLoading, setCreateBOMLoading] = useState(false);
  const [createBOMError, setCreateBOMError] = useState<string | null>(null);
  const [newBOMData, setNewBOMData] = useState({
    productId: '',
    revision: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    engineeringChangeNumber: '',
    items: [] as any[],
  });
  
  // Edit BOM state
  const [editBOMDialog, setEditBOMDialog] = useState(false);
  const [editBOMError, setEditBOMError] = useState<string | null>(null);

  // API hooks
  const { data: productsData } = useGetProductsQuery();
  const { data: inventoryItemsData } = useGetInventoryItemsForBOMQuery();
  const {
    data: bomsData,
    isLoading,
    error,
    refetch,
  } = useGetBOMsQuery({
    status: statusFilter || undefined,
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const { data: bomDetail, isLoading: bomDetailLoading, error: bomDetailError } = useGetBOMQuery(selectedBOM?.id || '', {
    skip: !selectedBOM?.id,
  });

  // Debug logging for BOM detail query
  React.useEffect(() => {
    if (selectedBOM?.id) {
      console.log('BOM Detail Query - Selected BOM ID:', selectedBOM.id);
      console.log('BOM Detail Query - Loading:', bomDetailLoading);
      console.log('BOM Detail Query - Error:', bomDetailError);
      console.log('BOM Detail Query - Data:', bomDetail);
      if (bomDetail?.items) {
        console.log('BOM Detail Query - Items count:', bomDetail.items.length);
        console.log('BOM Detail Query - Items:', bomDetail.items);
      }
    }
  }, [selectedBOM?.id, bomDetailLoading, bomDetailError, bomDetail]);

  const { data: costAnalysis } = useGetBOMCostQuery(
    { id: selectedBOM?.id || '', quantity: 1 },
    { skip: !selectedBOM?.id }
  );

  const [approveBOM] = useApproveBOMMutation();
  const [createEngineeringChange] = useCreateEngineeringChangeMutation();
  const [createBOM] = useCreateBOMMutation();

  // Extract data from API response
  const products = Array.isArray(productsData) ? productsData : [];
  const inventoryItems = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];
  const boms = Array.isArray(bomsData) ? bomsData : bomsData?.data || [];
  const totalCount = bomsData?.pagination?.total || boms.length;

  // Debug logging for data
  React.useEffect(() => {
    console.log('Products loaded:', products.length, products);
    console.log('Inventory items loaded:', inventoryItems.length, inventoryItems);
  }, [products, inventoryItems]);

  // Status configuration
  const statusConfig = {
    DRAFT: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', icon: <BOMIcon />, label: 'Draft' },
    PENDING_APPROVAL: { color: '#fff3e0', textColor: '#f57c00', icon: <EditIcon />, label: 'Pending Approval' },
    APPROVED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <ApproveIcon />, label: 'Approved' },
    OBSOLETE: { color: '#ffebee', textColor: '#d32f2f', icon: <HistoryIcon />, label: 'Obsolete' },
  };

  // Handle actions
  const handleApproveBOM = async (bomId: string) => {
    try {
      await approveBOM(bomId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to approve BOM:', error);
    }
  };

  const handleCreateEngineeringChange = async (bomId: string, changeData: any) => {
    try {
      await createEngineeringChange({
        bomId,
        ...changeData,
      }).unwrap();
      refetch();
      setEngineeringChangeDialog(false);
    } catch (error) {
      console.error('Failed to create engineering change:', error);
    }
  };

  // UUID validation helper
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // BOM Items management
  const addBOMItem = (setBomData: any) => {
    const newItem = {
      id: `temp-${Date.now()}`, // Temporary ID for new items
      inventoryItemId: '',
      quantity: 1,
      unit: '',
      scrapPercentage: 0,
      operation: '',
      level: 1,
      sequence: 1,
    };
    setBomData((prev: any) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeBOMItem = (index: number, setBomData: any) => {
    setBomData((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const updateBOMItem = (index: number, field: string, value: any, setBomData: any) => {
    setBomData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleCreateBOM = async () => {
    setCreateBOMLoading(true);
    setCreateBOMError(null);
    
    // Validate required fields
    if (!newBOMData.productId) {
      setCreateBOMError('Product ID is required');
      setCreateBOMLoading(false);
      return;
    }
    
    if (!isValidUUID(newBOMData.productId)) {
      setCreateBOMError('Product ID must be a valid UUID format');
      setCreateBOMLoading(false);
      return;
    }
    
    if (!newBOMData.revision) {
      setCreateBOMError('Revision is required');
      setCreateBOMLoading(false);
      return;
    }
    
    // Check if there are any valid BOM items
    const validItems = (newBOMData.items || []).filter((item: any) => item.inventoryItemId);
    if (validItems.length === 0) {
      setCreateBOMError('At least one BOM item with selected inventory item is required. Please add items and select inventory items for each.');
      setCreateBOMLoading(false);
      return;
    }
    
    try {
      const bomData = {
        productId: newBOMData.productId.trim(),
        revision: newBOMData.revision.trim(),
        effectiveDate: new Date(newBOMData.effectiveDate).toISOString(),
        // Only include engineeringChangeNumber if it has a value
        ...(newBOMData.engineeringChangeNumber && { engineeringChangeNumber: newBOMData.engineeringChangeNumber.trim() }),
        items: (newBOMData.items || []).map((item: any) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unit: item.unit,
          scrapPercentage: item.scrapPercentage || 0,
          operation: item.operation || '',
          level: item.level || 1,
          sequence: item.sequence || 1,
        })).filter((item: any) => item.inventoryItemId), // Only include items with inventory item selected
      };
      
      console.log('Creating BOM with data:', bomData);
      console.log('BOM Items being sent:', bomData.items);
      console.log('Raw BOM items from form:', newBOMData.items);
      
      // Detailed debugging
      console.log('=== BOM Creation Debug ===');
      console.log('Total raw items:', newBOMData.items?.length || 0);
      console.log('Items after mapping:', (newBOMData.items || []).map((item: any) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        unit: item.unit,
        scrapPercentage: item.scrapPercentage || 0,
        operation: item.operation || '',
        level: item.level || 1,
        sequence: item.sequence || 1,
      })).length);
      console.log('Items after filtering (final):', bomData.items.length);
      
      if (bomData.items.length === 0) {
        console.warn('WARNING: No BOM items will be sent! Check if inventory items are selected.');
        newBOMData.items?.forEach((item: any, index: number) => {
          console.log(`Item ${index + 1}:`, {
            inventoryItemId: item.inventoryItemId,
            hasInventoryItemId: !!item.inventoryItemId,
            quantity: item.quantity,
            unit: item.unit,
          });
        });
      }
      
      const result = await createBOM(bomData).unwrap();
      console.log('BOM creation result:', result);
      
      setCreateBOMDialog(false);
      setNewBOMData({
        productId: '',
        revision: '',
        effectiveDate: new Date().toISOString().split('T')[0],
        engineeringChangeNumber: '',
        items: [],
      });
      refetch();
    } catch (error: any) {
      console.error('Failed to create BOM:', error);
      const errorMessage = error?.data?.error?.message || error?.data?.message || 'Failed to create BOM. Please try again.';
      setCreateBOMError(errorMessage);
    } finally {
      setCreateBOMLoading(false);
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, bom: BOM) => {
    setActionMenu({ anchorEl: event.currentTarget, bom });
  };

  const handleActionClose = () => {
    setActionMenu({ anchorEl: null, bom: null });
  };

  const handleEditBOM = (bom: BOM) => {
    // First set the selected BOM to trigger the detail query
    setSelectedBOM(bom);
    // Then open the edit dialog - the bomDetail will be loaded by the useGetBOMQuery hook
    setEditBOMDialog(true);
    setEditBOMError(null);
  };

  // Render BOM tree structure
  const renderBOMTree = (items: BOMItem[], level = 0) => {
    return items.map((item) => (
      <Box key={item.id} sx={{ ml: level * 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: level === 0 ? 600 : 400, fontSize: '0.75rem' }}>
            {item.inventoryItem.code} - {item.inventoryItem.name}
          </Typography>
          <Chip
            label={`Qty: ${item.quantity} ${item.unit}`}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
          />
          {item.inventoryItem.standardCost && (
            <Chip
              label={`$${(item.quantity * item.inventoryItem.standardCost).toFixed(2)}`}
              size="small"
              color="primary"
              sx={{ ml: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {item.children && item.children.length > 0 && renderBOMTree(item.children, level + 1)}
      </Box>
    ));
  };

  // Summary statistics
  const summaryStats = {
    total: totalCount,
    approved: boms.filter((b: BOM) => b.status === 'APPROVED').length,
    pending: boms.filter((b: BOM) => b.status === 'PENDING_APPROVAL').length,
    draft: boms.filter((b: BOM) => b.status === 'DRAFT').length,
  };

  return (
    <Box sx={{ 
      bgcolor: 'grey.50', 
      minHeight: 'calc(100vh - 64px)', 
      py: 1.5,
      px: 1.5, // Simple padding for content
      width: '100%',
      boxSizing: 'border-box'
    }}>
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
              <BOMIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Bill of Materials (BOM) Management
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Manage BOMs, track revisions, and handle engineering changes
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EngineeringIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/engineering-changes')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Engineering Changes
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => setCreateBOMDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              New BOM
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
            icon={<BOMIcon />}
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
            icon={<ApproveIcon />}
            label={`${summaryStats.approved} Approved`}
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
          <Chip
            icon={<EditIcon />}
            label={`${summaryStats.pending} Pending`}
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
            icon={<BOMIcon />}
            label={`${summaryStats.draft} Draft`}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.08)',
              color: 'text.secondary',
              fontWeight: 600,
              height: 28,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { 
                color: 'text.secondary', 
                fontSize: 16 
              }
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
            placeholder="Search BOMs..."
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
              <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="OBSOLETE">Obsolete</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
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
          borderRadius: 1.5,
          width: '100%', // Ensure full width usage
          '& .MuiTable-root': {
            tableLayout: 'auto' // Allow table to expand naturally
          }
        }}>
          <Table stickyHeader size="small" sx={{ 
            minWidth: 1200, 
            width: '100%',
            tableLayout: 'auto' // Allow columns to expand
          }}>
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
                  whiteSpace: 'nowrap',
                  width: '25%' // Give more space to product column
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
                  borderColor: 'divider',
                  width: '10%'
                }}>
                  Revision
                </TableCell>
                <TableCell sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: '6px 8px',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  width: '15%'
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
                  borderColor: 'divider',
                  width: '12%'
                }}>
                  Effective Date
                </TableCell>
                <TableCell sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: '6px 8px',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  width: '18%'
                }}>
                  Engineering Change
                </TableCell>
                <TableCell sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: '6px 8px',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  width: '10%'
                }}>
                  Total Cost
                </TableCell>
                <TableCell sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  p: '6px 8px',
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  width: '10%'
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {boms.map((bom: BOM) => (
                <TableRow 
                  key={bom.id} 
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
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.primary.main, 
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        {bom.product?.code || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {bom.product?.name || 'Unknown Product'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={bom.revision}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[bom.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[bom.status as keyof typeof statusConfig]?.label || bom.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[bom.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[bom.status as keyof typeof statusConfig]?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(bom.effectiveDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {bom.engineeringChangeNumber || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {bom.totalCost ? `$${bom.totalCost.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => {
                            setSelectedBOM(bom);
                            setBomDetailDialog(true);
                          }}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cost Analysis">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => {
                            setSelectedBOM(bom);
                            setCostAnalysisDialog(true);
                          }}
                        >
                          <CalculateIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={(e) => handleActionClick(e, bom)}
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
          {actionMenu.bom?.status === 'PENDING_APPROVAL' && (
            <MenuItem onClick={() => {
              if (actionMenu.bom) {
                handleApproveBOM(actionMenu.bom.id);
              }
              handleActionClose();
            }}>
              <ListItemIcon>
                <ApproveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Approve BOM</ListItemText>
            </MenuItem>
          )}
          <MenuItem onClick={() => {
            setSelectedBOM(actionMenu.bom);
            setEngineeringChangeDialog(true);
            handleActionClose();
          }}>
            <ListItemIcon>
              <EngineeringIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Engineering Change</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (actionMenu.bom) {
              handleEditBOM(actionMenu.bom);
            }
            handleActionClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit BOM</ListItemText>
          </MenuItem>
        </Menu>

        {/* BOM Detail Dialog - Enhanced with all backend fields */}
        <Dialog 
          open={bomDetailDialog} 
          onClose={() => setBomDetailDialog(false)} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          {/* Dialog Header - Compact Pattern */}
          <DialogTitle sx={{
            pb: 1,
            borderBottom: '2px solid',
            borderColor: theme.palette.primary.main,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ViewIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
                mb: 0
              }}>
                BOM Details - {selectedBOM?.product?.name}
              </Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}>
                Revision: {selectedBOM?.revision} | Status: {selectedBOM?.status}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            {bomDetail && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {/* Basic Information Card */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          mb: 1.5, 
                          color: theme.palette.text.primary,
                          fontSize: '0.875rem'
                        }}>
                          Basic Information
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Product:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {bomDetail.product?.name}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Product Code:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {bomDetail.product?.code}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Revision:
                            </Typography>
                            <Chip
                              label={bomDetail.revision}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Status:
                            </Typography>
                            <Chip
                              icon={statusConfig[bomDetail.status as keyof typeof statusConfig]?.icon}
                              label={statusConfig[bomDetail.status as keyof typeof statusConfig]?.label || bomDetail.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: statusConfig[bomDetail.status as keyof typeof statusConfig]?.color,
                                color: statusConfig[bomDetail.status as keyof typeof statusConfig]?.textColor,
                                '& .MuiChip-icon': { fontSize: 12 }
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Effective Date:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {new Date(bomDetail.effectiveDate).toLocaleDateString()}
                            </Typography>
                          </Box>
                          {bomDetail.engineeringChangeNumber && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Engineering Change:
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {bomDetail.engineeringChangeNumber}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Cost Summary Card */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          mb: 1.5, 
                          color: theme.palette.text.primary,
                          fontSize: '0.875rem'
                        }}>
                          Cost Summary
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Total Items:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {bomDetail.items?.length || 0}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                              Total Cost:
                            </Typography>
                            <Chip
                              label={`$${bomDetail.totalCost?.toFixed(2) || '0.00'}`}
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          </Box>
                          {bomDetail.approvedBy && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Approved By:
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {bomDetail.approvedBy}
                              </Typography>
                            </Box>
                          )}
                          {bomDetail.approvedAt && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                Approved At:
                              </Typography>
                              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {new Date(bomDetail.approvedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* BOM Structure Section */}
                {bomDetail.items && bomDetail.items.length > 0 && (
                  <Accordion sx={{ borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ 
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px 12px 0 0',
                        '&.Mui-expanded': {
                          borderRadius: '12px 12px 0 0'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        fontSize: '0.875rem'
                      }}>
                        BOM Structure ({bomDetail.items.length} items)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1.5 }}>
                      <Box sx={{ 
                        flexGrow: 1, 
                        maxWidth: '100%', 
                        overflowY: 'auto', 
                        maxHeight: 400,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                        backgroundColor: 'grey.50'
                      }}>
                        {bomDetail.items && renderBOMTree(bomDetail.items)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Empty State for BOM Items */}
                {(!bomDetail.items || bomDetail.items.length === 0) && (
                  <Box sx={{
                    p: 3,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    backgroundColor: 'grey.50',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      No BOM items defined yet.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                      Add items to define the product structure and material requirements.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ 
            px: 2, 
            py: 1.5, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={() => setBomDetailDialog(false)}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Close
            </Button>
            {selectedBOM && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                onClick={() => {
                  setBomDetailDialog(false);
                  handleEditBOM(selectedBOM);
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  py: 0.5,
                  px: 1.5
                }}
              >
                Edit BOM
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Cost Analysis Dialog */}
        <Dialog open={costAnalysisDialog} onClose={() => setCostAnalysisDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Cost Analysis - {selectedBOM?.product?.name}</DialogTitle>
          <DialogContent>
            {costAnalysis && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Total Cost: ${costAnalysis.totalCost?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cost breakdown for quantity: 1
                </Typography>
                
                {costAnalysis.breakdown && (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Cost</TableCell>
                        <TableCell>Total Cost</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {costAnalysis.breakdown.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unitCost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${item.totalCost?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCostAnalysisDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Engineering Change Dialog - Enhanced with all backend fields */}
        <Dialog 
          open={engineeringChangeDialog} 
          onClose={() => setEngineeringChangeDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          {/* Dialog Header - Compact Pattern */}
          <DialogTitle sx={{
            pb: 1,
            borderBottom: '2px solid',
            borderColor: theme.palette.primary.main,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EngineeringIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
                mb: 0
              }}>
                Create Engineering Change Request
              </Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}>
                BOM: {selectedBOM?.product?.name} - Rev. {selectedBOM?.revision}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              {/* Change Information Section */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block'
                }}>
                  Change Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Change Number *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., ECR-2024-001"
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  New Revision *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., Rev-002, V2.0, B"
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Effective Date *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Priority
                </Typography>
                <FormControl fullWidth size="small">
                  <Select 
                    defaultValue="MEDIUM"
                    displayEmpty
                    sx={{
                      fontSize: '0.875rem',
                      '& .MuiSelect-select': { fontSize: '0.875rem', py: 0.75 }
                    }}
                  >
                    <MenuItem value="LOW" sx={{ fontSize: '0.875rem' }}>Low</MenuItem>
                    <MenuItem value="MEDIUM" sx={{ fontSize: '0.875rem' }}>Medium</MenuItem>
                    <MenuItem value="HIGH" sx={{ fontSize: '0.875rem' }}>High</MenuItem>
                    <MenuItem value="CRITICAL" sx={{ fontSize: '0.875rem' }}>Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Change Details Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block'
                }}>
                  Change Details
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Change Reason *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  placeholder="Describe the reason for this engineering change..."
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Description
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={4}
                  placeholder="Provide detailed description of the changes, impact analysis, and implementation notes..."
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    <strong>Note:</strong> This will create a new BOM revision with the specified changes. 
                    The current revision will remain active until the new revision is approved and becomes effective.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ 
            px: 2, 
            py: 1.5, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={() => setEngineeringChangeDialog(false)}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => {
                if (selectedBOM) {
                  handleCreateEngineeringChange(selectedBOM.id, {
                    changeNumber: 'ECR-001',
                    changeReason: 'Material substitution',
                    effectiveDate: new Date().toISOString(),
                    priority: 'MEDIUM',
                    description: 'Engineering change request',
                  });
                }
              }}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Create Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create BOM Dialog - Enhanced with all backend fields */}
        <Dialog 
          open={createBOMDialog} 
          onClose={() => {
            if (!createBOMLoading) {
              setCreateBOMDialog(false);
              setCreateBOMError(null);
              setNewBOMData({
                productId: '',
                revision: '',
                effectiveDate: new Date().toISOString().split('T')[0],
                engineeringChangeNumber: '',
                items: [],
              });
            }
          }} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          {/* Dialog Header - Compact Pattern */}
          <DialogTitle sx={{
            pb: 1,
            borderBottom: '2px solid',
            borderColor: theme.palette.primary.main,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BOMIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
                mb: 0
              }}>
                Create New Bill of Materials
              </Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}>
                Define product structure with multi-level BOM support
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            {createBOMError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createBOMError}
              </Alert>
            )}
            
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              {/* Product Information Section */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block'
                }}>
                  Product Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Product *
                </Typography>
                <FormControl fullWidth size="small" error={!newBOMData.productId && createBOMError !== null}>
                  <Select 
                    value={newBOMData.productId}
                    onChange={(e) => setNewBOMData(prev => ({ ...prev, productId: e.target.value }))}
                    disabled={createBOMLoading}
                    displayEmpty
                    sx={{
                      fontSize: '0.875rem',
                      '& .MuiSelect-select': { fontSize: '0.875rem', py: 0.75 }
                    }}
                  >
                    <MenuItem value="" disabled sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                      Select a product
                    </MenuItem>
                    {products.map((product: any) => (
                      <MenuItem key={product.id} value={product.id} sx={{ fontSize: '0.875rem' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {product.code} - {product.name}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                            {product.category} | {product.type}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!newBOMData.productId && createBOMError !== null && (
                  <Typography variant="caption" color="error" sx={{ 
                    fontSize: '0.75rem', 
                    mt: 0.5, 
                    display: 'block' 
                  }}>
                    Product selection is required
                  </Typography>
                )}
                {products.length === 0 && (
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.7rem', 
                    mt: 0.5, 
                    display: 'block',
                    color: 'warning.main'
                  }}>
                    No products available. Please create products first.
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Revision *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., Rev-001, V1.0, A"
                  value={newBOMData.revision}
                  onChange={(e) => setNewBOMData(prev => ({ ...prev, revision: e.target.value }))}
                  disabled={createBOMLoading}
                  error={!newBOMData.revision && createBOMError !== null}
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
                {!newBOMData.revision && createBOMError !== null && (
                  <Typography variant="caption" color="error" sx={{ 
                    fontSize: '0.75rem', 
                    mt: 0.5, 
                    display: 'block' 
                  }}>
                    Revision is required
                  </Typography>
                )}
              </Grid>

              {/* BOM Configuration Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block'
                }}>
                  BOM Configuration
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Effective Date *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={newBOMData.effectiveDate}
                  onChange={(e) => setNewBOMData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  disabled={createBOMLoading}
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Engineering Change Number
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g., ECN-2024-001"
                  value={newBOMData.engineeringChangeNumber || ''}
                  onChange={(e) => setNewBOMData(prev => ({ ...prev, engineeringChangeNumber: e.target.value }))}
                  disabled={createBOMLoading}
                  sx={{
                    '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    '& .MuiInputBase-input': { py: 0.75 }
                  }}
                />
              </Grid>

              {/* BOM Items Section */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box>
                    <Typography variant="caption" sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}>
                      BOM Items ({newBOMData.items?.length || 0})
                    </Typography>
                    {newBOMData.items && newBOMData.items.length > 0 && (
                      <Typography variant="caption" sx={{ 
                        fontSize: '0.7rem',
                        color: (newBOMData.items || []).filter((item: any) => item.inventoryItemId).length > 0 ? 'success.main' : 'warning.main',
                        display: 'block',
                        mt: 0.25
                      }}>
                        {(newBOMData.items || []).filter((item: any) => item.inventoryItemId).length} items ready to save
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                    onClick={() => addBOMItem(setNewBOMData)}
                    disabled={createBOMLoading}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.7rem',
                      py: 0.25,
                      px: 1,
                      minHeight: 'auto'
                    }}
                  >
                    Add Item
                  </Button>
                </Box>

                {newBOMData.items && newBOMData.items.length > 0 ? (
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: 'auto'
                  }}>
                    {newBOMData.items.map((item: any, index: number) => (
                      <Box key={item.id || index} sx={{
                        p: 1.5,
                        borderBottom: index < newBOMData.items.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)'
                      }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Inventory Item *
                            </Typography>
                            <FormControl fullWidth size="small" error={!item.inventoryItemId}>
                              <Select
                                value={item.inventoryItemId}
                                onChange={(e) => {
                                  updateBOMItem(index, 'inventoryItemId', e.target.value, setNewBOMData);
                                  // Auto-fill unit from inventory item
                                  const selectedItem = inventoryItems.find((inv: any) => inv.id === e.target.value);
                                  if (selectedItem) {
                                    updateBOMItem(index, 'unit', selectedItem.unit, setNewBOMData);
                                  }
                                }}
                                displayEmpty
                                sx={{ 
                                  fontSize: '0.75rem',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: !item.inventoryItemId ? 'error.main' : 'inherit',
                                  }
                                }}
                              >
                                <MenuItem value="" disabled sx={{ fontSize: '0.75rem' }}>
                                  Select inventory item
                                </MenuItem>
                                {inventoryItems.map((invItem: any) => (
                                  <MenuItem key={invItem.id} value={invItem.id} sx={{ fontSize: '0.75rem' }}>
                                    <Box>
                                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        {invItem.itemCode} - {invItem.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                        {invItem.category} | Unit: {invItem.unit}
                                      </Typography>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {!item.inventoryItemId && (
                              <Typography variant="caption" color="error" sx={{ 
                                fontSize: '0.7rem', 
                                mt: 0.25, 
                                display: 'block' 
                              }}>
                                Please select an inventory item
                              </Typography>
                            )}
                          </Grid>
                          
                          <Grid item xs={6} sm={2}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Quantity *
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value) || 0, setNewBOMData)}
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            />
                          </Grid>

                          <Grid item xs={6} sm={2}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Unit
                            </Typography>
                            <TextField
                              size="small"
                              value={item.unit}
                              onChange={(e) => updateBOMItem(index, 'unit', e.target.value, setNewBOMData)}
                              placeholder="e.g., kg, pcs"
                              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            />
                          </Grid>

                          <Grid item xs={6} sm={2}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Scrap %
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={item.scrapPercentage}
                              onChange={(e) => updateBOMItem(index, 'scrapPercentage', parseFloat(e.target.value) || 0, setNewBOMData)}
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            />
                          </Grid>

                          <Grid item xs={6} sm={1.5}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Level
                            </Typography>
                            <TextField
                              size="small"
                              type="number"
                              value={item.level}
                              onChange={(e) => updateBOMItem(index, 'level', parseInt(e.target.value) || 1, setNewBOMData)}
                              inputProps={{ min: 1, max: 10 }}
                              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={0.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeBOMItem(index, setNewBOMData)}
                                sx={{ p: 0.5 }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600, 
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Operation
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              value={item.operation}
                              onChange={(e) => updateBOMItem(index, 'operation', e.target.value, setNewBOMData)}
                              placeholder="e.g., CUTTING, WELDING, ASSEMBLY"
                              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{
                    p: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      No BOM items added yet.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                      Click "Add Item" to define the materials and components needed for this product.
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Quick Fill Helper Section */}
              {products.length > 0 && (
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5, display: 'block' }}>
                          <strong>Quick Start:</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', display: 'block' }}>
                          Use sample data to quickly create a test BOM with default values →
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            const firstProduct = products[0];
                            if (firstProduct) {
                              setNewBOMData(prev => ({
                                ...prev,
                                productId: firstProduct.id,
                                revision: 'Rev-001',
                                engineeringChangeNumber: 'ECN-2024-001'
                              }));
                            }
                          }}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            py: 0.25,
                            px: 1,
                            minWidth: 'auto'
                          }}
                        >
                          Fill Basic Data
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (inventoryItems.length >= 2) {
                              const sampleItems = inventoryItems.slice(0, 2).map((invItem: any, index: number) => ({
                                id: `temp-${Date.now()}-${index}`,
                                inventoryItemId: invItem.id,
                                quantity: index + 1,
                                unit: invItem.unit || 'PCS',
                                scrapPercentage: 5,
                                operation: 'ASSEMBLY',
                                level: 1,
                                sequence: index + 1,
                              }));
                              
                              setNewBOMData(prev => ({
                                ...prev,
                                items: sampleItems
                              }));
                            }
                          }}
                          disabled={inventoryItems.length < 2}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            py: 0.25,
                            px: 1,
                            minWidth: 'auto'
                          }}
                        >
                          Add Sample Items
                        </Button>
                      </Box>
                    </Box>
                  </Alert>
                </Grid>
              )}

              {/* Additional Information */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    <strong>Note:</strong> The BOM will be created in DRAFT status. You can add items, define hierarchical structure, 
                    and submit for approval once the structure is complete.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ 
            px: 2, 
            py: 1.5, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={() => {
                setCreateBOMDialog(false);
                setCreateBOMError(null);
                setNewBOMData({
                  productId: '',
                  revision: '',
                  effectiveDate: new Date().toISOString().split('T')[0],
                  engineeringChangeNumber: '',
                  items: [],
                });
              }}
              disabled={createBOMLoading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleCreateBOM}
              disabled={!newBOMData.productId || !newBOMData.revision || createBOMLoading}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5,
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {createBOMLoading ? 'Creating...' : 'Create BOM'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit BOM Dialog */}
        <Dialog 
          open={editBOMDialog} 
          onClose={() => {
            setEditBOMDialog(false);
            setEditBOMError(null);
            setSelectedBOM(null);
          }} 
          maxWidth="lg" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 1.5,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          {/* Dialog Header - Compact Pattern */}
          <DialogTitle sx={{
            pb: 1,
            borderBottom: '2px solid',
            borderColor: theme.palette.primary.main,
            background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, #ffffff 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              p: 0.75,
              borderRadius: 1,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <EditIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
                mb: 0
              }}>
                View Bill of Materials
              </Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}>
                BOM: {bomDetail?.product?.name} - Rev. {bomDetail?.revision}
              </Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ py: 1.5 }}>
            {editBOMError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editBOMError}
              </Alert>
            )}
            
            {bomDetail && (
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    mb: 0.5,
                    display: 'block'
                  }}>
                    Product
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={bomDetail.productId}
                      onChange={() => {
                        // For now, just show the current product (editing product not recommended)
                      }}
                      disabled={true} // Disable product change in edit mode
                      sx={{
                        fontSize: '0.875rem',
                        '& .MuiSelect-select': { fontSize: '0.875rem', py: 0.75 }
                      }}
                    >
                      <MenuItem value={bomDetail.productId} sx={{ fontSize: '0.875rem' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                            {bomDetail.product?.code} - {bomDetail.product?.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    mb: 0.5,
                    display: 'block'
                  }}>
                    Current Revision
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={bomDetail.revision}
                    disabled={true} // Show current revision, new revision will be created via engineering change
                    sx={{
                      '& .MuiInputBase-root': { fontSize: '0.875rem' },
                      '& .MuiInputBase-input': { py: 0.75 }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.7rem', 
                    mt: 0.5, 
                    display: 'block',
                    color: 'text.secondary'
                  }}>
                    Use "Engineering Change" to create a new revision
                  </Typography>
                </Grid>

                {/* Information Alert */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      <strong>Note:</strong> This BOM is view-only. To modify items or create a new revision, 
                      use the "Create Engineering Change" button to follow proper change management procedures.
                    </Typography>
                  </Alert>
                </Grid>

                {/* BOM Items Section */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    mb: 1,
                    display: 'block'
                  }}>
                    BOM Items ({bomDetail.items?.length || 0})
                  </Typography>

                  {bomDetail.items && bomDetail.items.length > 0 ? (
                    <Box sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      maxHeight: 400,
                      overflow: 'auto'
                    }}>
                      {bomDetail.items.map((item: any, index: number) => (
                        <Box key={item.id || index} sx={{
                          p: 1.5,
                          borderBottom: index < bomDetail.items.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)'
                        }}>
                          <Grid container spacing={1} alignItems="center">
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Inventory Item *
                              </Typography>
                              <FormControl fullWidth size="small">
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={`${item.inventoryItem?.itemCode} - ${item.inventoryItem?.name}`}
                                  disabled={true}
                                  sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                                />
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={6} sm={2}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Quantity *
                              </Typography>
                              <TextField
                                size="small"
                                type="number"
                                value={item.quantity}
                                disabled={true}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            </Grid>

                            <Grid item xs={6} sm={2}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Unit
                              </Typography>
                              <TextField
                                size="small"
                                value={item.unit}
                                disabled={true}
                                placeholder="e.g., kg, pcs"
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            </Grid>

                            <Grid item xs={6} sm={2}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Scrap %
                              </Typography>
                              <TextField
                                size="small"
                                type="number"
                                value={item.scrapPercentage}
                                disabled={true}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            </Grid>

                            <Grid item xs={6} sm={1.5}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Level
                              </Typography>
                              <TextField
                                size="small"
                                type="number"
                                value={item.level}
                                disabled={true}
                                inputProps={{ min: 1, max: 10 }}
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            </Grid>

                            <Grid item xs={12} sm={0.5}>
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={true}
                                  sx={{ p: 0.5 }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Operation
                              </Typography>
                              <TextField
                                size="small"
                                fullWidth
                                value={item.operation}
                                disabled={true}
                                placeholder="e.g., CUTTING, WELDING, ASSEMBLY"
                                sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5 } }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{
                      p: 2,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'grey.50',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        No BOM items defined yet.
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                        Click "Add Item" to define the materials and components needed for this product.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions sx={{ 
            px: 2, 
            py: 1.5, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            gap: 1
          }}>
            <Button 
              onClick={() => {
                setEditBOMDialog(false);
                setEditBOMError(null);
                setSelectedBOM(null);
              }}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Close
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                setEditBOMDialog(false);
                setSelectedBOM(bomDetail);
                setEngineeringChangeDialog(true);
              }}
              startIcon={<EngineeringIcon sx={{ fontSize: 16 }} />}
              size="small"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                py: 0.5,
                px: 1.5,
              }}
            >
              Create Engineering Change
            </Button>
          </DialogActions>
        </Dialog>

        {/* Loading and Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading BOMs...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load BOMs. Please try again.
          </Alert>
        )}
    </Box>
  );
};

export default BOMManagement;