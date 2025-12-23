import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Tooltip,
  CircularProgress,
  Menu,
  ListItemText,
  Pagination,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  Phone,
  Email,
  LocationOn,
  Refresh,
  AssignmentInd,
  Delete,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useBulkAssignLeadsMutation,
  useGetFollowUpTasksQuery,
  useDeleteLeadMutation,
} from '../../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

interface CreateLeadDialogProps {
  open: boolean;
  onClose: () => void;
  editLead?: any;
  isEdit?: boolean;
}

interface ViewLeadDialogProps {
  open: boolean;
  onClose: () => void;
  lead: any;
}

const ViewLeadDialog: React.FC<ViewLeadDialogProps> = ({ open, onClose, lead }) => {
  if (!lead) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Lead Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Lead Number</Typography>
            <Typography variant="body1">{lead.leadNumber || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip label={lead.status} color={getStatusColor(lead.status) as any} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Contact Name</Typography>
            <Typography variant="body1">{lead.contactName}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
            <Typography variant="body1">{lead.phone}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
            <Typography variant="body1">{lead.email || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Source</Typography>
            <Chip label={lead.source} size="small" variant="outlined" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <Chip label={lead.priority} color={getPriorityColor(lead.priority) as any} size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Estimated Value</Typography>
            <Typography variant="body1">
              {lead.estimatedValue ? `₹${(lead.estimatedValue / 1000).toFixed(0)}K` : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Address</Typography>
            <Typography variant="body1">{lead.address || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Requirements</Typography>
            <Typography variant="body1">{lead.requirements || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
            <Typography variant="body1">
              {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

function getStatusColor(status: string) {
  switch (status) {
    case 'NEW': return 'info';
    case 'QUALIFIED': return 'primary';
    case 'CONVERTED': return 'success';
    case 'LOST': return 'error';
    case 'ESTIMATE_APPROVED': return 'success';
    default: return 'default';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH': return 'error';
    case 'MEDIUM': return 'warning';
    case 'LOW': return 'info';
    default: return 'default';
  }
}

const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({ open, onClose, editLead, isEdit = false }) => { 
 
  const [leadData, setLeadData] = useState({
    source: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    requirements: '',
    estimatedValue: '',
    priority: 'MEDIUM',
  });

  // Initialize form with edit data when in edit mode
  React.useEffect(() => {
    if (isEdit && editLead) {
      setLeadData({
        source: editLead.source || '',
        contactName: editLead.contactName || '',
        phone: editLead.phone || '',
        email: editLead.email || '',
        address: editLead.address || '',
        requirements: editLead.requirements || '',
        estimatedValue: editLead.estimatedValue ? editLead.estimatedValue.toString() : '',
        priority: editLead.priority || 'MEDIUM',
      });
    } else {
      setLeadData({
        source: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        requirements: '',
        estimatedValue: '',
        priority: 'MEDIUM',
      });
    }
  }, [isEdit, editLead, open]);

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();

  const isLoading = isCreating || isUpdating;

  const handleSubmit = async () => {
    try {
      console.log('Preparing to submit lead data:', leadData);
      const payload = {
        ...leadData,
        estimatedValue: leadData.estimatedValue ? parseFloat(leadData.estimatedValue) : undefined,
      };
      console.log('Submitting lead data:', payload);
      
      if (isEdit && editLead) {
        await updateLead({ id: editLead.id, leadData: payload }).unwrap();
      } else {
        await createLead(payload).unwrap();
      }
      
      onClose();
      setLeadData({
        source: '',
        contactName: '',
        phone: '',
        email: '',
        address: '',
        requirements: '',
        estimatedValue: '',
        priority: 'MEDIUM',
      });
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                name="source"
                value={leadData.source}
                onChange={(e) => setLeadData({...leadData, source: e.target.value})}
                label="Source"
              >
                <MenuItem value="META">Facebook/Instagram</MenuItem>
                <MenuItem value="GOOGLE">Google Ads</MenuItem>
                <MenuItem value="REFERRAL">Referral</MenuItem>
                <MenuItem value="DIRECT">Direct Inquiry</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={leadData.priority}
                onChange={(e) => setLeadData({...leadData, priority: e.target.value})}
                label="Priority"
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="contactName"
              label="Contact Name"
              value={leadData.contactName}
              onChange={(e) => setLeadData({...leadData, contactName: e.target.value})}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="phone"
              label="Phone Number"
              value={leadData.phone}
              onChange={(e) => setLeadData({...leadData, phone: e.target.value})}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="email"
              label="Email"
              type="email"
              value={leadData.email}
              onChange={(e) => setLeadData({...leadData, email: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="estimatedValue"
              label="Estimated Value (₹)"
              type="number"
              value={leadData.estimatedValue}
              onChange={(e) => setLeadData({...leadData, estimatedValue: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="address"
              label="Address"
              value={leadData.address}
              onChange={(e) => setLeadData({...leadData, address: e.target.value})}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="requirements"
              label="Requirements"
              value={leadData.requirements}
              onChange={(e) => setLeadData({...leadData, requirements: e.target.value})}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={isLoading || !leadData.contactName || !leadData.phone || !leadData.source}
        >
          {isLoading ? <CircularProgress size={20} /> : (isEdit ? 'Update Lead' : 'Create Lead')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const LeadManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [editedLead, setEditedLead] = useState<any>({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    source: '',
    priority: '',
    assignedTo: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteLead]=useDeleteLeadMutation();

  // API calls
  const { 
    data: leadsData, 

    isLoading: isLeadsLoading, 
    refetch: refetchLeads 
  } = useGetLeadsQuery(filters);
  console.log('Leads Data:', leadsData);

  const { 
    data: followUpTasks, 
    isLoading: isTasksLoading 
  } = useGetFollowUpTasksQuery({});

  const [bulkAssignLeads] = useBulkAssignLeadsMutation();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: string) => (event: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      limit: parseInt(event.target.value, 10),
      page: 1 // Reset to first page when changing rows per page
    }));
  };

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleBulkAssign = async (assignedTo: string) => {
    try {
      await bulkAssignLeads({ leadIds: selectedLeads, assignedTo }).unwrap();
      setSelectedLeads([]);
      setAnchorEl(null);
    } catch (error) {
      console.error('Error in bulk assignment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'info';
      case 'QUALIFIED': return 'primary';
      case 'CONVERTED': return 'success';
      case 'LOST': return 'error';
      case 'ESTIMATE_APPROVED': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const getLeadScore = (lead: any) => {
    // Mock lead score calculation - replace with actual scoring
    let score = 0;
    if (lead.email) score += 20;
    if (lead.estimatedValue > 100000) score += 30;
    if (lead.source === 'REFERRAL') score += 25;
    if (lead.requirements && lead.requirements.length > 50) score += 25;
    return Math.min(score, 100);
  };

  if (isLeadsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  const handleViewLead = (lead: any) => {
    console.log('Viewing lead:', lead);
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };
  const handleEditLead = (lead: any) => {
    console.log('Editing lead:', lead);
    setEditedLead(lead);
    setEditDialogOpen(true);
  };
  const onDeleteLead=async(id:string)=>{
    const response= await  deleteLead({id}).unwrap()
    console.log('Delete response:',response);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Lead Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetchLeads()}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Lead
          </Button>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="All Leads" />
        <Tab label="Follow-up Tasks" />
        <Tab label="Analytics" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search leads..."
                  value={filters.search}
                  onChange={handleFilterChange('search')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={handleFilterChange('status')}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="NEW">New</MenuItem>
                    <MenuItem value="QUALIFIED">Qualified</MenuItem>
                    <MenuItem value="CONVERTED">Converted</MenuItem>
                    <MenuItem value="LOST">Lost</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Source</InputLabel>
                  <Select
                    value={filters.source}
                    onChange={handleFilterChange('source')}
                    label="Source"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="META">Facebook/Instagram</MenuItem>
                    <MenuItem value="GOOGLE">Google Ads</MenuItem>
                    <MenuItem value="REFERRAL">Referral</MenuItem>
                    <MenuItem value="DIRECT">Direct</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={handleFilterChange('priority')}
                    label="Priority"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="LOW">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedLeads.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AssignmentInd />}
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                      >
                        Assign ({selectedLeads.length})
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                      >
                        <MenuItem onClick={() => handleBulkAssign('SALES_REP_001')}>
                          <ListItemText>John Smith</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => handleBulkAssign('SALES_REP_002')}>
                          <ListItemText>Sarah Johnson</ListItemText>
                        </MenuItem>
                      </Menu>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads(leadsData?.leads?.map((lead: any) => lead.id) || []);
                          } else {
                            setSelectedLeads([]);
                          }
                        }}
                        checked={selectedLeads.length === leadsData?.leads?.length && leadsData?.leads?.length > 0}
                      />
                    </TableCell>
                    <TableCell>Lead #</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Estimated Value</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadsData?.leads?.map((lead: any) => (
                    <TableRow key={lead.id}>
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleLeadSelect(lead.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {lead.leadNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {lead.contactName}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            {lead.phone && (
                              <Tooltip title={lead.phone}>
                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Tooltip>
                            )}
                            {lead.email && (
                              <Tooltip title={lead.email}>
                                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Tooltip>
                            )}
                            {lead.address && (
                              <Tooltip title={lead.address}>
                                <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={lead.source} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status}
                          color={getStatusColor(lead.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.priority}
                          color={getPriorityColor(lead.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getLeadScore(lead)}
                            sx={{ width: 60, height: 6 }}
                          />
                          <Typography variant="caption">
                            {getLeadScore(lead)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {lead.estimatedValue ? `₹${(lead.estimatedValue / 1000).toFixed(0)}K` : '-'}
                      </TableCell>
                      <TableCell>
                        {lead.assignedTo ? (
                          <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                            {lead.assignedTo.charAt(0)}
                          </Avatar>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Visibility  onClick={()=>handleViewLead(lead)}/>
                        </IconButton>
                        <IconButton size="small">
                          <Edit onClick={() => handleEditLead(lead)}   />
                        </IconButton>
                        <IconButton size="small">
                          <Delete  onClick={()=> onDeleteLead(lead.id)}/>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No leads found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Custom Pagination */}
            {leadsData?.pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, px: 1, gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">rows per page:</Typography>
                  <Select
                    size="small"
                    value={filters.limit}
                    onChange={(e) => handleRowsPerPageChange({ target: { value: e.target.value } } as any)}
                    sx={{ minWidth: 50, height: 32 }}
                  >
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => handlePageChange(null as any, filters.page - 1)}
                    disabled={filters.page <= 1}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handlePageChange(null as any, filters.page + 1)}
                    disabled={filters.page >= (leadsData.pagination.pages || 1)}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Follow-up Tasks
            </Typography>
            {isTasksLoading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lead</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Days Overdue</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {followUpTasks?.map((task: any) => (
                      <TableRow key={task.leadId}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {task.leadNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.contactName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {task.followUpDate ? new Date(task.followUpDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {task.daysOverdue > 0 && (
                            <Chip
                              label={`${task.daysOverdue} days`}
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.leadScore}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            Follow Up
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No follow-up tasks
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lead Status Distribution
                </Typography>
                {/* Add chart component here */}
                <Typography variant="body2" color="text.secondary">
                  Chart will be implemented here
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Source Performance
                </Typography>
                {/* Add chart component here */}
                <Typography variant="body2" color="text.secondary">
                  Chart will be implemented here
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <CreateLeadDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
      
      <CreateLeadDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        editLead={editedLead}
        isEdit={true}
      />
      
      <ViewLeadDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        lead={selectedLead}
      />
    </Box>
  );
};

export default LeadManagement;