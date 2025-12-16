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
} from '@mui/icons-material';
import {
  useGetLeadsQuery,
  useCreateLeadMutation,
  useBulkAssignLeadsMutation,
  useGetFollowUpTasksQuery,
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
}

const CreateLeadDialog: React.FC<CreateLeadDialogProps> = ({ open, onClose }) => {
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

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();

  const handleInputChange = (field: string) => (event: any) => {
    setLeadData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...leadData,
        estimatedValue: leadData.estimatedValue ? parseFloat(leadData.estimatedValue) : undefined,
      };
      await createLead(payload).unwrap();
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
      console.error('Error creating lead:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Lead</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={leadData.source}
                onChange={handleInputChange('source')}
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
                value={leadData.priority}
                onChange={handleInputChange('priority')}
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
              label="Contact Name"
              value={leadData.contactName}
              onChange={handleInputChange('contactName')}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={leadData.phone}
              onChange={handleInputChange('phone')}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={leadData.email}
              onChange={handleInputChange('email')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Value (₹)"
              type="number"
              value={leadData.estimatedValue}
              onChange={handleInputChange('estimatedValue')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={leadData.address}
              onChange={handleInputChange('address')}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Requirements"
              value={leadData.requirements}
              onChange={handleInputChange('requirements')}
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
          disabled={isCreating || !leadData.contactName || !leadData.phone || !leadData.source}
        >
          {isCreating ? <CircularProgress size={20} /> : 'Create Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const LeadManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    source: '',
    priority: '',
    assignedTo: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // API calls
  const { 
    data: leadsData, 
    isLoading: isLeadsLoading, 
    refetch: refetchLeads 
  } = useGetLeadsQuery(filters);

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
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
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

            {/* Pagination */}
            {leadsData?.pagination && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={leadsData.pagination.pages}
                  page={filters.page}
                  onChange={handlePageChange}
                  color="primary"
                />
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
    </Box>
  );
};

export default LeadManagement;