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
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetBOMsQuery,
  useGetBOMQuery,
  useApproveBOMMutation,
  useGetBOMCostQuery,
  useCreateEngineeringChangeMutation,
} from '../../services/api';

interface BOM {
  id: string;
  revision: string;
  status: string;
  effectiveDate: string;
  product: {
    name: string;
    code: string;
  };
  items?: BOMItem[];
  totalCost?: number;
  engineeringChangeNumber?: string;
}

interface BOMItem {
  id: string;
  inventoryItemId: string;
  quantity: number;
  unit: string;
  scrapPercentage?: number;
  operation?: string;
  level: number;
  parentItemId?: string;
  sequence: number;
  inventoryItem: {
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
  const [statusFilter, setStatusFilter] = useState('APPROVED');
  const [selectedBOM, setSelectedBOM] = useState<BOM | null>(null);
  const [bomDetailDialog, setBomDetailDialog] = useState(false);
  const [costAnalysisDialog, setCostAnalysisDialog] = useState(false);
  const [engineeringChangeDialog, setEngineeringChangeDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement | null; bom: BOM | null }>({
    anchorEl: null,
    bom: null,
  });

  // API hooks
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

  const { data: bomDetail } = useGetBOMQuery(selectedBOM?.id || '', {
    skip: !selectedBOM?.id,
  });

  const { data: costAnalysis } = useGetBOMCostQuery(
    { id: selectedBOM?.id || '', quantity: 1 },
    { skip: !selectedBOM?.id }
  );

  const [approveBOM] = useApproveBOMMutation();
  const [createEngineeringChange] = useCreateEngineeringChangeMutation();

  // Extract data from API response
  const boms = Array.isArray(bomsData) ? bomsData : bomsData?.data || [];
  const totalCount = bomsData?.pagination?.total || boms.length;

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

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, bom: BOM) => {
    setActionMenu({ anchorEl: event.currentTarget, bom });
  };

  const handleActionClose = () => {
    setActionMenu({ anchorEl: null, bom: null });
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
              onClick={() => navigate('/manufacturing/create-bom')}
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
              navigate(`/manufacturing/bom/${actionMenu.bom.id}/edit`);
            }
            handleActionClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit BOM</ListItemText>
          </MenuItem>
        </Menu>

        {/* BOM Detail Dialog */}
        <Dialog open={bomDetailDialog} onClose={() => setBomDetailDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            BOM Details - {selectedBOM?.product?.name} (Rev. {selectedBOM?.revision})
          </DialogTitle>
          <DialogContent>
            {bomDetail && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                        <Typography variant="body2">Product: {bomDetail.product?.name}</Typography>
                        <Typography variant="body2">Revision: {bomDetail.revision}</Typography>
                        <Typography variant="body2">Status: {bomDetail.status}</Typography>
                        <Typography variant="body2">
                          Effective Date: {new Date(bomDetail.effectiveDate).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Cost Summary</Typography>
                        <Typography variant="body2">Total Items: {bomDetail.items?.length || 0}</Typography>
                        <Typography variant="body2">
                          Total Cost: ${bomDetail.totalCost?.toFixed(2) || '0.00'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {bomDetail.items && bomDetail.items.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">BOM Structure</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ flexGrow: 1, maxWidth: '100%', overflowY: 'auto', maxHeight: 300 }}>
                        {bomDetail.items && renderBOMTree(bomDetail.items)}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBomDetailDialog(false)}>Close</Button>
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

        {/* Engineering Change Dialog */}
        <Dialog open={engineeringChangeDialog} onClose={() => setEngineeringChangeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Engineering Change Request</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              BOM: {selectedBOM?.product?.name} - Rev. {selectedBOM?.revision}
            </Typography>
            <TextField
              fullWidth
              label="Change Number"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Change Reason"
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="date"
              label="Effective Date"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select defaultValue="MEDIUM" label="Priority">
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEngineeringChangeDialog(false)}>Cancel</Button>
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
            >
              Create Request
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