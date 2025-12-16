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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Engineering as EngineeringIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  useCreateEngineeringChangeMutation,
  useGetBOMsQuery,
} from '../../services/api';

interface EngineeringChange {
  id: string;
  changeNumber: string;
  title: string;
  description: string;
  bomId: string;
  bomRevision: string;
  productName: string;
  requestedBy: string;
  requestDate: string;
  priority: string;
  status: string;
  approver?: string;
  approvalDate?: string;
  effectiveDate?: string;
  reason: string;
  impactAssessment?: string;
  costImpact?: number;
  scheduleImpact?: number;
  affectedDocuments?: string[];
  workflow?: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  assignee: string;
  status: string;
  completedDate?: string;
  comments?: string;
}

const EngineeringChanges: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [workflowDialog, setWorkflowDialog] = useState(false);
  const [selectedChange, setSelectedChange] = useState<EngineeringChange | null>(null);

  // API hooks
  const { data: boms } = useGetBOMsQuery({});
  const [createEngineeringChange] = useCreateEngineeringChangeMutation();

  // Mock data for demonstration
  const mockEngineeringChanges: EngineeringChange[] = [
    {
      id: '1',
      changeNumber: 'ECR-2024-001',
      title: 'Material Substitution - Steel Grade Change',
      description: 'Replace current steel grade with higher strength alternative',
      bomId: 'bom-001',
      bomRevision: 'Rev-C',
      productName: 'Steel Frame Assembly',
      requestedBy: 'John Smith',
      requestDate: '2024-12-10',
      priority: 'HIGH',
      status: 'APPROVED',
      approver: 'Mike Johnson',
      approvalDate: '2024-12-15',
      effectiveDate: '2024-12-20',
      reason: 'Improve product strength and durability',
      impactAssessment: 'Minimal impact on manufacturing process',
      costImpact: 250.00,
      scheduleImpact: 2,
      affectedDocuments: ['BOM-001', 'WI-001', 'QC-001'],
      workflow: [
        { id: '1', name: 'Engineering Review', assignee: 'Sarah Wilson', status: 'COMPLETED', completedDate: '2024-12-12' },
        { id: '2', name: 'Cost Analysis', assignee: 'David Brown', status: 'COMPLETED', completedDate: '2024-12-13' },
        { id: '3', name: 'Management Approval', assignee: 'Mike Johnson', status: 'COMPLETED', completedDate: '2024-12-15' },
        { id: '4', name: 'Implementation', assignee: 'Production Team', status: 'IN_PROGRESS' },
      ],
    },
    {
      id: '2',
      changeNumber: 'ECR-2024-002',
      title: 'Process Improvement - Welding Sequence',
      description: 'Optimize welding sequence to reduce distortion',
      bomId: 'bom-002',
      bomRevision: 'Rev-B',
      productName: 'Welded Assembly',
      requestedBy: 'Sarah Wilson',
      requestDate: '2024-12-14',
      priority: 'MEDIUM',
      status: 'UNDER_REVIEW',
      reason: 'Reduce manufacturing defects and rework',
      impactAssessment: 'Requires operator retraining',
      costImpact: 150.00,
      scheduleImpact: 1,
      affectedDocuments: ['WI-002', 'QC-002'],
      workflow: [
        { id: '1', name: 'Engineering Review', assignee: 'John Smith', status: 'IN_PROGRESS' },
        { id: '2', name: 'Cost Analysis', assignee: 'David Brown', status: 'PENDING' },
        { id: '3', name: 'Management Approval', assignee: 'Mike Johnson', status: 'PENDING' },
        { id: '4', name: 'Implementation', assignee: 'Production Team', status: 'PENDING' },
      ],
    },
    {
      id: '3',
      changeNumber: 'ECR-2024-003',
      title: 'Design Modification - Bracket Reinforcement',
      description: 'Add reinforcement to mounting bracket for increased load capacity',
      bomId: 'bom-003',
      bomRevision: 'Rev-A',
      productName: 'Mounting Bracket',
      requestedBy: 'David Brown',
      requestDate: '2024-12-16',
      priority: 'CRITICAL',
      status: 'DRAFT',
      reason: 'Customer requirement for higher load capacity',
      impactAssessment: 'Significant design changes required',
      costImpact: 500.00,
      scheduleImpact: 5,
      affectedDocuments: ['DWG-003', 'BOM-003', 'WI-003'],
      workflow: [
        { id: '1', name: 'Engineering Review', assignee: 'Sarah Wilson', status: 'PENDING' },
        { id: '2', name: 'Cost Analysis', assignee: 'David Brown', status: 'PENDING' },
        { id: '3', name: 'Management Approval', assignee: 'Mike Johnson', status: 'PENDING' },
        { id: '4', name: 'Implementation', assignee: 'Production Team', status: 'PENDING' },
      ],
    },
  ];

  // Status configuration
  const statusConfig = {
    DRAFT: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', icon: <AssignmentIcon />, label: 'Draft' },
    UNDER_REVIEW: { color: '#fff3e0', textColor: '#f57c00', icon: <ScheduleIcon />, label: 'Under Review' },
    APPROVED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <ApproveIcon />, label: 'Approved' },
    REJECTED: { color: '#ffebee', textColor: '#d32f2f', icon: <RejectIcon />, label: 'Rejected' },
    IMPLEMENTED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <ApproveIcon />, label: 'Implemented' },
  };

  // Priority configuration
  const priorityConfig = {
    LOW: { color: '#e8f5e8', textColor: '#2e7d32', label: 'Low' },
    MEDIUM: { color: '#fff3e0', textColor: '#f57c00', label: 'Medium' },
    HIGH: { color: '#ffebee', textColor: '#d32f2f', label: 'High' },
    CRITICAL: { color: '#d32f2f', textColor: 'white', label: 'Critical' },
  };

  // Workflow step status configuration
  const stepStatusConfig = {
    PENDING: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', label: 'Pending' },
    IN_PROGRESS: { color: '#fff3e0', textColor: '#f57c00', label: 'In Progress' },
    COMPLETED: { color: '#e8f5e8', textColor: '#2e7d32', label: 'Completed' },
  };

  // Handle create engineering change
  const handleCreateChange = async (data: any) => {
    try {
      await createEngineeringChange(data).unwrap();
      setCreateDialog(false);
    } catch (error) {
      console.error('Failed to create engineering change:', error);
    }
  };

  // Filter engineering changes
  const filteredChanges = mockEngineeringChanges.filter((change) => {
    const matchesSearch = !search || 
      change.changeNumber.toLowerCase().includes(search.toLowerCase()) ||
      change.title.toLowerCase().includes(search.toLowerCase()) ||
      change.productName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || change.status === statusFilter;
    const matchesPriority = !priorityFilter || change.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Summary statistics
  const summaryStats = {
    total: filteredChanges.length,
    draft: filteredChanges.filter(c => c.status === 'DRAFT').length,
    underReview: filteredChanges.filter(c => c.status === 'UNDER_REVIEW').length,
    approved: filteredChanges.filter(c => c.status === 'APPROVED').length,
    critical: filteredChanges.filter(c => c.priority === 'CRITICAL').length,
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
              <EngineeringIcon sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{
                fontWeight: 700,
                mb: 0,
                color: theme.palette.text.primary,
                fontSize: '1.25rem',
                lineHeight: 1.2
              }}>
                Engineering Change Management
              </Typography>
              <Typography variant="caption" sx={{
                color: 'text.secondary',
                fontSize: '0.75rem'
              }}>
                Manage engineering changes, approvals, and implementation
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate('/manufacturing/change-analytics')}
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
              onClick={() => setCreateDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5
              }}
            >
              New Change Request
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EngineeringIcon sx={{ color: theme.palette.primary.main }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Changes
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.total}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ color: 'text.secondary' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Draft
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.draft}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon sx={{ color: '#f57c00' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Under Review
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.underReview}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ApproveIcon sx={{ color: '#2e7d32' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Approved
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.approved}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EngineeringIcon sx={{ color: '#d32f2f' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Critical
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {summaryStats.critical}
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
            placeholder="Search change requests..."
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
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="IMPLEMENTED">Implemented</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Priority</InputLabel>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              label="Priority"
              sx={{ height: 32, fontSize: '0.75rem' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
              <MenuItem value="CRITICAL">Critical</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterIcon sx={{ fontSize: 16 }} />}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPriorityFilter('');
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
          <Table stickyHeader size="small" sx={{ minWidth: 1400 }}>
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
                  Change Number
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
                  Title
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
                  Product
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
                  Priority
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
                  Requested By
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
                  Request Date
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
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChanges.map((change: EngineeringChange, index: number) => (
                <TableRow 
                  key={change.id} 
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
                      {change.changeNumber}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle', maxWidth: 250 }}>
                    <Tooltip title={change.description}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {change.title}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {change.productName}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        {change.bomRevision}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      label={priorityConfig[change.priority as keyof typeof priorityConfig]?.label || change.priority}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: priorityConfig[change.priority as keyof typeof priorityConfig]?.color,
                        color: priorityConfig[change.priority as keyof typeof priorityConfig]?.textColor,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Chip
                      icon={statusConfig[change.status as keyof typeof statusConfig]?.icon}
                      label={statusConfig[change.status as keyof typeof statusConfig]?.label || change.status}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: statusConfig[change.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[change.status as keyof typeof statusConfig]?.textColor,
                        '& .MuiChip-icon': { fontSize: 14 }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {change.requestedBy}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {new Date(change.requestDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    {change.costImpact ? (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          color: change.costImpact > 300 ? '#d32f2f' : '#f57c00'
                        }}
                      >
                        ${change.costImpact.toFixed(2)}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', p: '6px 8px', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => setSelectedChange(change)}
                        >
                          <ViewIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Workflow">
                        <IconButton 
                          size="small" 
                          sx={{ p: 0.5 }}
                          onClick={() => {
                            setSelectedChange(change);
                            setWorkflowDialog(true);
                          }}
                        >
                          <TimelineIcon sx={{ fontSize: 18 }} />
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
          count={filteredChanges.length}
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

        {/* Create Engineering Change Dialog */}
        <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Engineering Change Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Change Number"
                  defaultValue={`ECR-${new Date().getFullYear()}-${String(mockEngineeringChanges.length + 1).padStart(3, '0')}`}
                  disabled
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select defaultValue="MEDIUM" label="Priority">
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Affected BOM</InputLabel>
                  <Select defaultValue="" label="Affected BOM">
                    {(boms || []).map((bom: any) => (
                      <MenuItem key={bom.id} value={bom.id}>
                        {bom.product?.name || 'Unknown Product'} - {bom.revision}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Requested Effective Date"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason for Change"
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Impact Assessment"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Cost Impact"
                  type="number"
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Schedule Impact (days)"
                  type="number"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                handleCreateChange({
                  title: 'New Engineering Change',
                  description: 'Engineering change description',
                  bomId: 'bom-001',
                  priority: 'MEDIUM',
                  reason: 'Change reason',
                  impactAssessment: 'Impact assessment',
                  costImpact: 100,
                  scheduleImpact: 1,
                });
              }}
            >
              Create Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* Workflow Dialog */}
        <Dialog open={workflowDialog} onClose={() => setWorkflowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Workflow Status - {selectedChange?.changeNumber}
          </DialogTitle>
          <DialogContent>
            {selectedChange?.workflow && (
              <Stepper orientation="vertical" sx={{ mt: 1 }}>
                {selectedChange.workflow.map((step, index) => (
                  <Step key={step.id} active={step.status === 'IN_PROGRESS'} completed={step.status === 'COMPLETED'}>
                    <StepLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.875rem' }}>
                          {step.name}
                        </Typography>
                        <Chip
                          label={stepStatusConfig[step.status as keyof typeof stepStatusConfig]?.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: stepStatusConfig[step.status as keyof typeof stepStatusConfig]?.color,
                            color: stepStatusConfig[step.status as keyof typeof stepStatusConfig]?.textColor,
                          }}
                        />
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Assignee: {step.assignee}
                      </Typography>
                      {step.completedDate && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          Completed: {new Date(step.completedDate).toLocaleDateString()}
                        </Typography>
                      )}
                      {step.comments && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                          {step.comments}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkflowDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default EngineeringChanges;