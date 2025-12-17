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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  People,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '../../services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

// Validation schema
const branchSchema = z.object({
  code: z.string().min(1, 'Branch code is required').max(20, 'Code too long'),
  name: z.string().min(1, 'Branch name is required').max(100, 'Name too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City too long'),
  state: z.string().min(1, 'State is required').max(100, 'State too long'),
  pincode: z.string().min(6, 'Invalid pincode').max(10, 'Invalid pincode'),
  phone: z.string().min(10, 'Invalid phone number').max(15, 'Phone too long'),
  email: z.string().email('Invalid email address'),
  gstNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    warehouses: number;
    employees: number;
    customers: number;
    salesOrders: number;
    productionOrders: number;
  };
}

const BranchManagement: React.FC = () => {
  const theme = useTheme();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [page, setPage] = useState(0); // TablePagination uses 0-based indexing
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // API hooks
  const {
    data: branchesData,
    isLoading,
    error,
    refetch,
  } = useGetBranchesQuery({
    page: page + 1, // Convert to 1-based for API
    limit: rowsPerPage,
    search: search || undefined,
    state: stateFilter || undefined,
    isActive: isActiveFilter,
  });

  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const branches = branchesData?.data || [];
  const pagination = branchesData?.pagination || { total: 0, totalPages: 0 };

  const handleSearch = () => {
    setPage(0);
    refetch();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      reset({
        code: branch.code,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        pincode: branch.pincode,
        phone: branch.phone,
        email: branch.email,
        gstNumber: branch.gstNumber || '',
        isActive: branch.isActive,
      });
    } else {
      setEditingBranch(null);
      reset({
        code: '',
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        gstNumber: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
    reset();
  };

  const handleViewBranch = (branch: Branch) => {
    setViewingBranch(branch);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (branchToDelete) {
      try {
        await deleteBranch(branchToDelete.id).unwrap();
        setDeleteConfirmOpen(false);
        setBranchToDelete(null);
        refetch();
      } catch (error) {
        console.error('Failed to delete branch - Full error object:', error);
        console.error('Error data:', (error as any)?.data);
        console.error('Error status:', (error as any)?.status);
        console.error('Error data.error:', (error as any)?.data?.error);
        console.error('Error data.error.code:', (error as any)?.data?.error?.code);
        console.error('Error data.error.message:', (error as any)?.data?.error?.message);
        
        // Temporary: Show raw error data for debugging
        alert(`Raw error data: ${JSON.stringify((error as any)?.data, null, 2)}`);
        
        // Extract detailed error message
        let errorMessage = 'Unknown error occurred';
        let errorCode = '';
        
        if ((error as any)?.data?.error?.message) {
          errorMessage = (error as any).data.error.message;
          errorCode = (error as any).data.error.code || '';
        } else if ((error as any)?.data?.message) {
          errorMessage = (error as any).data.message;
        } else if ((error as any)?.message) {
          errorMessage = (error as any).message;
        } else if ((error as any)?.status) {
          errorMessage = `HTTP Error ${(error as any).status}`;
        }
        
        // Show user-friendly error message based on error code
        if (errorCode === 'BRANCH_HAS_DEPENDENCIES') {
          alert(`Cannot delete branch: ${errorMessage}\n\nThe branch has been deactivated instead of deleted because it has related data.`);
        } else {
          alert(`Failed to delete branch: ${errorMessage}\n\nPlease check the console for more details.`);
        }
        
        // Refresh the data to show updated status
        refetch();
        
        // Close the dialog
        setDeleteConfirmOpen(false);
        setBranchToDelete(null);
      }
    }
  };

  const onSubmit = async (data: BranchFormData) => {
    try {
      console.log('Submitting branch data:', data);
      if (editingBranch) {
        const result = await updateBranch({
          id: editingBranch.id,
          branchData: data,
        }).unwrap();
        console.log('Update result:', result);
      } else {
        const result = await createBranch(data).unwrap();
        console.log('Create result:', result);
      }
      handleCloseDialog();
      refetch();
    } catch (error) {
      console.error('Failed to save branch - Full error object:', error);
      console.error('Error data:', (error as any)?.data);
      console.error('Error status:', (error as any)?.status);
      
      // Extract detailed error message
      let errorMessage = 'Unknown error occurred';
      
      if ((error as any)?.data?.error?.message) {
        errorMessage = (error as any).data.error.message;
      } else if ((error as any)?.data?.message) {
        errorMessage = (error as any).data.message;
      } else if ((error as any)?.message) {
        errorMessage = (error as any).message;
      } else if ((error as any)?.status) {
        errorMessage = `HTTP Error ${(error as any).status}`;
      }
      
      // Show detailed error to user
      alert(`Failed to save branch: ${errorMessage}\n\nPlease check the console for more details.`);
    }
  };



  if (error) {
    return (
      <Box sx={{ 
        bgcolor: 'grey.50', 
        minHeight: 'calc(100vh - 64px)', 
        py: 1.5,
        px: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          Failed to load branches. Please try again.
        </Alert>
      </Box>
    );
  }

  // Summary statistics
  const summaryStats = {
    total: branches.length,
    active: branches.filter((b: Branch) => b.isActive).length,
    inactive: branches.filter((b: Branch) => !b.isActive).length,
    kerala: branches.filter((b: Branch) => b.state === 'Kerala').length,
    tamilNadu: branches.filter((b: Branch) => b.state === 'Tamil Nadu').length,
  };

  return (
    <Box sx={{ 
      bgcolor: 'grey.50', 
      minHeight: 'calc(100vh - 64px)', 
      py: 1.5,
      px: 1.5,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 1, fontSize: '0.75rem' }}>
          Debug: Current user role: {currentUser?.role || 'Not logged in'} | Required roles: SUPER_ADMIN, BRANCH_MANAGER
        </Alert>
      )}

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
            <BusinessIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{
              fontWeight: 700,
              mb: 0,
              color: theme.palette.text.primary,
              fontSize: '1.25rem',
              lineHeight: 1.2
            }}>
              Branch Management
            </Typography>
            <Typography variant="caption" sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.75rem'
            }}>
              Manage branch locations, contact information, and operational status
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Add Branch
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
          icon={<BusinessIcon />}
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
          icon={<BusinessIcon />}
          label={`${summaryStats.active} Active`}
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
          icon={<BusinessIcon />}
          label={`${summaryStats.inactive} Inactive`}
          size="small"
          sx={{
            bgcolor: '#ffebee',
            color: '#d32f2f',
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { 
              color: '#d32f2f', 
              fontSize: 16 
            }
          }}
        />
        <Chip
          icon={<LocationIcon />}
          label={`${summaryStats.kerala} Kerala`}
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
          icon={<LocationIcon />}
          label={`${summaryStats.tamilNadu} Tamil Nadu`}
          size="small"
          sx={{
            bgcolor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 600,
            height: 28,
            fontSize: '0.75rem',
            '& .MuiChip-icon': { 
              color: '#1976d2', 
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
        borderColor: 'divider'
      }}>
        <TextField
          size="small"
          placeholder="Search by name, code, city, or state"
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
          sx={{ minWidth: 300 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>State</InputLabel>
          <Select
            value={stateFilter}
            label="State"
            onChange={(e) => setStateFilter(e.target.value)}
            sx={{ 
              height: 32,
              fontSize: '0.75rem'
            }}
          >
            <MenuItem value="">All States</MenuItem>
            <MenuItem value="Kerala">Kerala</MenuItem>
            <MenuItem value="Tamil Nadu">Tamil Nadu</MenuItem>
            <MenuItem value="Karnataka">Karnataka</MenuItem>
            <MenuItem value="Andhra Pradesh">Andhra Pradesh</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
          <Select
            value={isActiveFilter === undefined ? '' : isActiveFilter.toString()}
            label="Status"
            onChange={(e) => {
              const value = e.target.value;
              setIsActiveFilter(value === '' ? undefined : value === 'true');
            }}
            sx={{ 
              height: 32,
              fontSize: '0.75rem'
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Active</MenuItem>
            <MenuItem value="false">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSearch}
          startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.75rem',
            py: 0.5,
            px: 1.5
          }}
        >
          Filter
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
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
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
                  Code
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
                  Branch Name
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
                  Contact
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
                  Entities
                </TableCell>
                <TableCell align="center" sx={{
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
              {branches.map((branch: Branch) => (
                <TableRow 
                  key={branch.id} 
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
                    <Typography sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>
                      {branch.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <BusinessIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                      <Typography sx={{ fontSize: '0.75rem' }}>
                        {branch.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: '0.75rem' }}>
                        {branch.city}, {branch.state}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
                        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: '0.7rem' }}>
                          {branch.phone}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: '0.7rem' }}>
                          {branch.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={branch.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: branch.isActive ? '#e8f5e8' : '#ffebee',
                        color: branch.isActive ? '#2e7d32' : '#d32f2f',
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        W: {branch._count?.warehouses || 0} | E: {branch._count?.employees || 0} | C: {branch._count?.customers || 0}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box display="flex" gap={0.5} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewBranch(branch)}
                          sx={{ p: 0.5 }}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(branch)}
                          sx={{ p: 0.5 }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={
                        !currentUser || !['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(currentUser.role) 
                          ? 'Insufficient permissions' 
                          : 'Delete'
                      }>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(branch)}
                            disabled={!currentUser || !['SUPER_ADMIN', 'BRANCH_MANAGER'].includes(currentUser.role)}
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={pagination.total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
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
              <BusinessIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 600,
                fontSize: '1rem',
                color: theme.palette.text.primary,
                mb: 0
              }}>
                {editingBranch ? 'Edit Branch' : 'Create New Branch'}
              </Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.7rem'
              }}>
                {editingBranch ? 'Update branch information' : 'Add a new branch location'}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ py: 1.5 }}>
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
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
                  Branch Code {editingBranch && '(Cannot be changed)'}
                </Typography>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter branch code"
                      error={!!errors.code}
                      disabled={!!editingBranch}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.code && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.code.message}
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
                  Branch Name
                </Typography>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter branch name"
                      error={!!errors.name}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.name && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.name.message}
                  </Typography>
                )}
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
                  Address
                </Typography>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter complete address"
                      multiline
                      rows={2}
                      error={!!errors.address}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.address && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.address.message}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  City
                </Typography>
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter city"
                      error={!!errors.city}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.city && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.city.message}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  State
                </Typography>
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small" error={!!errors.state}>
                      <Select 
                        {...field} 
                        displayEmpty
                        sx={{
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': { fontSize: '0.875rem', py: 0.75 }
                        }}
                      >
                        <MenuItem value="" disabled sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          Select state
                        </MenuItem>
                        <MenuItem value="Kerala" sx={{ fontSize: '0.875rem' }}>Kerala</MenuItem>
                        <MenuItem value="Tamil Nadu" sx={{ fontSize: '0.875rem' }}>Tamil Nadu</MenuItem>
                        <MenuItem value="Karnataka" sx={{ fontSize: '0.875rem' }}>Karnataka</MenuItem>
                        <MenuItem value="Andhra Pradesh" sx={{ fontSize: '0.875rem' }}>Andhra Pradesh</MenuItem>
                        <MenuItem value="Telangana" sx={{ fontSize: '0.875rem' }}>Telangana</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                {errors.state && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.state.message}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block'
                }}>
                  Pincode
                </Typography>
                <Controller
                  name="pincode"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter pincode"
                      error={!!errors.pincode}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.pincode && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.pincode.message}
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
                  Phone Number
                </Typography>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter phone number"
                      error={!!errors.phone}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.phone && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.phone.message}
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
                  Email Address
                </Typography>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter email address"
                      type="email"
                      error={!!errors.email}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.email && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.email.message}
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
                  GST Number (Optional)
                </Typography>
                <Controller
                  name="gstNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      placeholder="Enter GST number"
                      error={!!errors.gstNumber}
                      sx={{
                        '& .MuiInputBase-root': { fontSize: '0.875rem' },
                        '& .MuiInputBase-input': { py: 0.75 }
                      }}
                    />
                  )}
                />
                {errors.gstNumber && (
                  <Typography variant="caption" color="error" sx={{ fontSize: '0.75rem', mt: 0.5, display: 'block' }}>
                    {errors.gstNumber.message}
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
                  Status
                </Typography>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select
                        {...field}
                        value={field.value ? 'true' : 'false'}
                        onChange={(e) => field.onChange(e.target.value === 'true')}
                        sx={{
                          fontSize: '0.875rem',
                          '& .MuiSelect-select': { fontSize: '0.875rem', py: 0.75 }
                        }}
                      >
                        <MenuItem value="true" sx={{ fontSize: '0.875rem' }}>Active</MenuItem>
                        <MenuItem value="false" sx={{ fontSize: '0.875rem' }}>Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
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
              onClick={handleCloseDialog}
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
              type="submit"
              variant="contained"
              size="small"
              disabled={isCreating || isUpdating}
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
              {isCreating || isUpdating ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : editingBranch ? (
                'Update Branch'
              ) : (
                'Create Branch'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
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
              Branch Details
            </Typography>
            <Typography variant="caption" sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.7rem'
            }}>
              {viewingBranch?.name} - {viewingBranch?.code}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          {viewingBranch && (
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Branch Code
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  mt: 0.25
                }}>
                  {viewingBranch.code}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Branch Name
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  mt: 0.25
                }}>
                  {viewingBranch.name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Address
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  mt: 0.25
                }}>
                  {viewingBranch.address}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  City
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  mt: 0.25
                }}>
                  {viewingBranch.city}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  State
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  mt: 0.25
                }}>
                  {viewingBranch.state}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Pincode
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontSize: '0.875rem',
                  mt: 0.25
                }}>
                  {viewingBranch.pincode}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Phone
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                  <PhoneIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {viewingBranch.phone}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Email
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                  <EmailIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {viewingBranch.email}
                  </Typography>
                </Box>
              </Grid>
              {viewingBranch.gstNumber && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    GST Number
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontSize: '0.875rem',
                    mt: 0.25
                  }}>
                    {viewingBranch.gstNumber}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Status
                </Typography>
                <Box mt={0.5}>
                  <Chip
                    label={viewingBranch.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      bgcolor: viewingBranch.isActive ? '#e8f5e8' : '#ffebee',
                      color: viewingBranch.isActive ? '#2e7d32' : '#d32f2f',
                      height: 24,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Grid>
              {viewingBranch._count && (
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
                    Related Entities
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    mt: 0.5
                  }}>
                    <Chip
                      icon={<BusinessIcon />}
                      label={`${viewingBranch._count.warehouses || 0} Warehouses`}
                      size="small"
                      sx={{
                        bgcolor: `${theme.palette.primary.light}15`,
                        color: theme.palette.primary.main,
                        fontSize: '0.7rem',
                        height: 24,
                        '& .MuiChip-icon': { 
                          color: theme.palette.primary.main, 
                          fontSize: 14 
                        }
                      }}
                    />
                    <Chip
                      icon={<People />}
                      label={`${viewingBranch._count.employees || 0} Employees`}
                      size="small"
                      sx={{
                        bgcolor: '#e8f5e8',
                        color: '#2e7d32',
                        fontSize: '0.7rem',
                        height: 24,
                        '& .MuiChip-icon': { 
                          color: '#2e7d32', 
                          fontSize: 14 
                        }
                      }}
                    />
                    <Chip
                      icon={<People />}
                      label={`${viewingBranch._count.customers || 0} Customers`}
                      size="small"
                      sx={{
                        bgcolor: '#fff3e0',
                        color: '#f57c00',
                        fontSize: '0.7rem',
                        height: 24,
                        '& .MuiChip-icon': { 
                          color: '#f57c00', 
                          fontSize: 14 
                        }
                      }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: 2, 
          py: 1.5, 
          borderTop: '1px solid', 
          borderColor: 'divider'
        }}>
          <Button 
            onClick={() => setViewDialogOpen(false)}
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
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{
          pb: 1,
          borderBottom: '2px solid',
          borderColor: '#d32f2f',
          background: 'linear-gradient(135deg, #ffebee 0%, #ffffff 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Box sx={{
            p: 0.75,
            borderRadius: 1,
            backgroundColor: '#d32f2f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DeleteIcon sx={{ fontSize: 20, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{
              fontWeight: 600,
              fontSize: '1rem',
              color: '#d32f2f',
              mb: 0
            }}>
              Delete/Deactivate Branch
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.7rem'
            }}>
              Branches with dependencies will be deactivated instead
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            backgroundColor: '#fff3e0',
            borderRadius: 1,
            border: '1px solid #f57c00',
            mb: 1
          }}>
            <Box sx={{
              p: 0.5,
              borderRadius: '50%',
              backgroundColor: '#f57c00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BusinessIcon sx={{ fontSize: 16, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="body2" sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                color: '#f57c00'
              }}>
                {branchToDelete?.name}
              </Typography>
              <Typography variant="caption" sx={{
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}>
                Code: {branchToDelete?.code} | {branchToDelete?.city}, {branchToDelete?.state}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{
            fontSize: '0.875rem',
            color: 'text.primary',
            lineHeight: 1.4,
            mb: 1
          }}>
            Are you sure you want to delete this branch?
          </Typography>
          <Alert severity="warning" sx={{ fontSize: '0.75rem', mb: 1 }}>
            <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
              <strong>Note:</strong> If this branch has employees, customers, or orders, 
              it cannot be deleted and will be deactivated instead. This action cannot be undone.
            </Typography>
          </Alert>
          {branchToDelete?._count && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ 
                fontSize: '0.75rem',
                color: 'text.secondary',
                display: 'block',
                mb: 0.5
              }}>
                Current dependencies:
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                • {branchToDelete._count.employees || 0} employees
                • {branchToDelete._count.customers || 0} customers
                • {branchToDelete._count.salesOrders || 0} sales orders
                • {branchToDelete._count.productionOrders || 0} production orders
              </Typography>
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
            onClick={() => setDeleteConfirmOpen(false)}
            size="small"
            disabled={isDeleting}
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
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            size="small"
            disabled={isDeleting}
            sx={{
              textTransform: 'none',
              fontSize: '0.875rem',
              py: 0.5,
              px: 1.5,
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            {isDeleting ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : (
              'Delete/Deactivate Branch'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchManagement;