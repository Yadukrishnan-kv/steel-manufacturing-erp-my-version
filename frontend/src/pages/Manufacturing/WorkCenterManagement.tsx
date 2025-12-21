import React, { useState } from 'react';
import {
  Box,
  Container,
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
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  Settings as PrecisionIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useGetWorkCentersQuery,
  useCreateWorkCenterMutation,
  useGetWorkCenterUtilizationQuery,
} from '../../services/api';

interface WorkCenter {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  currentUtilization: number;
  status: string;
  location: string;
  costPerHour: number;
  setupTime: number;
  operations?: Operation[];
}

interface Operation {
  id: string;
  name: string;
  code: string;
  standardTime: number;
  setupTime: number;
  costPerHour: number;
}

const WorkCenterManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<WorkCenter | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [utilizationDialog, setUtilizationDialog] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ anchorEl: HTMLElement | null; workCenter: WorkCenter | null }>({
    anchorEl: null,
    workCenter: null,
  });

  // API hooks
  const {
    data: workCentersData,
    isLoading,
    error,
    refetch,
  } = useGetWorkCentersQuery();

  const { data: utilizationData } = useGetWorkCenterUtilizationQuery(
    {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      workCenterId: selectedWorkCenter?.id,
    },
    { skip: !selectedWorkCenter?.id }
  );

  const [createWorkCenter] = useCreateWorkCenterMutation();

  // Extract work centers from API response
  const workCenters = workCentersData || [];

  // Mock data for demonstration (fallback if API returns empty)
  const mockWorkCenters: WorkCenter[] = workCenters.length > 0 ? workCenters : [
    {
      id: '1',
      name: 'CNC Machine Center',
      code: 'CNC-001',
      type: 'MACHINING',
      capacity: 24,
      currentUtilization: 85,
      status: 'ACTIVE',
      location: 'Shop Floor A',
      costPerHour: 150,
      setupTime: 30,
    },
    {
      id: '2',
      name: 'Welding Station 1',
      code: 'WLD-001',
      type: 'WELDING',
      capacity: 16,
      currentUtilization: 70,
      status: 'ACTIVE',
      location: 'Shop Floor B',
      costPerHour: 80,
      setupTime: 15,
    },
    {
      id: '3',
      name: 'Assembly Line 1',
      code: 'ASM-001',
      type: 'ASSEMBLY',
      capacity: 24,
      currentUtilization: 95,
      status: 'ACTIVE',
      location: 'Assembly Hall',
      costPerHour: 60,
      setupTime: 10,
    },
  ];

  // Status configuration
  const statusConfig = {
    ACTIVE: { color: '#e8f5e8', textColor: '#2e7d32', icon: <BuildIcon />, label: 'Active' },
    MAINTENANCE: { color: '#fff3e0', textColor: '#f57c00', icon: <SettingsIcon />, label: 'Maintenance' },
    INACTIVE: { color: '#ffebee', textColor: '#d32f2f', icon: <SettingsIcon />, label: 'Inactive' },
  };

  // Type configuration
  const typeConfig = {
    MACHINING: { color: theme.palette.primary.main, label: 'Machining' },
    WELDING: { color: '#f57c00', label: 'Welding' },
    ASSEMBLY: { color: '#2e7d32', label: 'Assembly' },
    PAINTING: { color: '#9c27b0', label: 'Painting' },
    QUALITY: { color: '#00bcd4', label: 'Quality Control' },
  };

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return '#d32f2f'; // Over capacity - red
    if (utilization >= 75) return '#f57c00'; // High utilization - orange
    if (utilization >= 50) return '#2e7d32'; // Good utilization - green
    return '#757575'; // Low utilization - grey
  };

  // Handle actions
  const handleCreateWorkCenter = async (data: any) => {
    try {
      await createWorkCenter(data).unwrap();
      refetch();
      setCreateDialog(false);
    } catch (error) {
      console.error('Failed to create work center:', error);
    }
  };

  const handleActionClick = (event: React.MouseEvent<HTMLElement>, workCenter: WorkCenter) => {
    setActionMenu({ anchorEl: event.currentTarget, workCenter });
  };

  const handleActionClose = () => {
    setActionMenu({ anchorEl: null, workCenter: null });
  };

  // Filter work centers
  const filteredWorkCenters = (workCenters.length > 0 ? workCenters : mockWorkCenters).filter((wc) => {
    const matchesSearch = !search || 
      wc.name.toLowerCase().includes(search.toLowerCase()) ||
      wc.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || wc.type === typeFilter;
    const matchesStatus = !statusFilter || wc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredWorkCenters.length,
    active: filteredWorkCenters.filter(wc => wc.status === 'ACTIVE').length,
    highUtilization: filteredWorkCenters.filter(wc => wc.currentUtilization >= 85).length,
    avgUtilization: Math.round(
      filteredWorkCenters.reduce((sum, wc) => sum + wc.currentUtilization, 0) / filteredWorkCenters.length
    ),
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
            <Box sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PrecisionIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Work Center Management
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Manage work centers, operations, and capacity planning
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssessmentIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/capacity-analysis')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              Capacity Analysis
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/create-work-center')}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              New Work Center
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
            icon={<PrecisionIcon />}
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
            icon={<BuildIcon />}
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
            icon={<AssessmentIcon />}
            label={`${summaryStats.avgUtilization}% Avg Utilization`}
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
          {summaryStats.highUtilization > 0 && (
            <Chip
              icon={<AssessmentIcon />}
              label={`${summaryStats.highUtilization} High Utilization`}
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
          )}
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
            placeholder="Search work centers..."
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
            <InputLabel sx={{ fontSize: '0.75rem' }}>Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="MACHINING">Machining</MenuItem>
              <MenuItem value="WELDING">Welding</MenuItem>
              <MenuItem value="ASSEMBLY">Assembly</MenuItem>
              <MenuItem value="PAINTING">Painting</MenuItem>
              <MenuItem value="QUALITY">Quality Control</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setSearch('');
              setTypeFilter('');
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
          borderRadius: 1.5
        }}>
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
                  Capacity (hrs/day)
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
                  Current Utilization
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
                  Cost/Hour
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
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredWorkCenters.map((workCenter: WorkCenter, index: number) => (
                <TableRow 
                  key={workCenter.id} 
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
                        {workCenter.code}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {workCenter.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={typeConfig[workCenter.type as keyof typeof typeConfig]?.label || workCenter.type}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: `${typeConfig[workCenter.type as keyof typeof typeConfig]?.color || theme.palette.primary.main}15`,
                        color: typeConfig[workCenter.type as keyof typeof typeConfig]?.color || theme.palette.primary.main,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[workCenter.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[workCenter.status as keyof typeof statusConfig]?.label || workCenter.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[workCenter.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[workCenter.status as keyof typeof statusConfig]?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {workCenter.capacity}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 6, 
                        bgcolor: 'grey.200', 
                        borderRadius: 3,
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${Math.min(workCenter.currentUtilization, 100)}%`,
                          height: '100%',
                          bgcolor: getUtilizationColor(workCenter.currentUtilization),
                          transition: 'width 0.3s ease'
                        }} />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem', 
                          minWidth: 35,
                          color: getUtilizationColor(workCenter.currentUtilization),
                          fontWeight: 600
                        }}
                      >
                        {workCenter.currentUtilization}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    ${workCenter.costPerHour}/hr
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {workCenter.location}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => navigate(`/manufacturing/work-centers/${workCenter.id}`)}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Utilization">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => {
                            setSelectedWorkCenter(workCenter);
                            setUtilizationDialog(true);
                          }}
                        >
                          <AssessmentIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="More Actions">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={(e) => handleActionClick(e, workCenter)}
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
          count={filteredWorkCenters.length}
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
          <MenuItem onClick={() => {
            if (actionMenu.workCenter) {
              navigate(`/manufacturing/work-centers/${actionMenu.workCenter.id}/edit`);
            }
            handleActionClose();
          }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Work Center</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            if (actionMenu.workCenter) {
              navigate(`/manufacturing/work-centers/${actionMenu.workCenter.id}/schedule`);
            }
            handleActionClose();
          }}>
            <ListItemIcon>
              <ScheduleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Schedule</ListItemText>
          </MenuItem>
        </Menu>

        {/* Create Work Center Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Work Center</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Work Center Name"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Code"
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select defaultValue="MACHINING" label="Type">
                    <MenuItem value="MACHINING">Machining</MenuItem>
                    <MenuItem value="WELDING">Welding</MenuItem>
                    <MenuItem value="ASSEMBLY">Assembly</MenuItem>
                    <MenuItem value="PAINTING">Painting</MenuItem>
                    <MenuItem value="QUALITY">Quality Control</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacity (hrs/day)"
                  type="number"
                  defaultValue={24}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cost per Hour"
                  type="number"
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Setup Time (minutes)"
                  type="number"
                  defaultValue={15}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                handleCreateWorkCenter({
                  name: 'New Work Center',
                  code: 'WC-NEW',
                  type: 'MACHINING',
                  capacity: 24,
                  costPerHour: 100,
                  setupTime: 15,
                  location: 'Shop Floor',
                });
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Utilization Dialog */}
        <Dialog open={utilizationDialog} onClose={() => setUtilizationDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Utilization Analysis - {selectedWorkCenter?.name}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Current Utilization</Typography>
                    <Typography variant="h4" color={getUtilizationColor(selectedWorkCenter?.currentUtilization || 0)}>
                      {selectedWorkCenter?.currentUtilization}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Daily Capacity</Typography>
                    <Typography variant="h4">
                      {selectedWorkCenter?.capacity} hrs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>Setup Time</Typography>
                    <Typography variant="h4">
                      {selectedWorkCenter?.setupTime} min
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Utilization Trend (Last 30 Days)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={selectedWorkCenter?.currentUtilization || 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Historical utilization data will be displayed here
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUtilizationDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Loading and Error States */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading work centers...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to load work centers. Please try again.
          </Alert>
        )}
    </Box>
  );
};

export default WorkCenterManagement;