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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

  Rating,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Cancel,

  Assignment,
  PhotoCamera,
  Build,
} from '@mui/icons-material';
import { useGetQCInspectionsQuery } from '../../services/api';

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

interface QCInspectionDialogProps {
  open: boolean;
  onClose: () => void;
  productionOrder?: any;
}

const QCInspectionDialog: React.FC<QCInspectionDialogProps> = ({ open, onClose, productionOrder }) => {
  const [inspectionData, setInspectionData] = useState({
    stage: '',
    inspector: '',
    checklist: [] as any[],
    overallRating: 0,
    comments: '',
    photos: [] as string[],
  });

  const qcStages = [
    'CUTTING',
    'FABRICATION', 
    'COATING',
    'ASSEMBLY',
    'DISPATCH',
    'INSTALLATION'
  ];

  const mockChecklists = {
    CUTTING: [
      { id: '1', item: 'Dimensions as per drawing', required: true },
      { id: '2', item: 'Edge quality and finish', required: true },
      { id: '3', item: 'Material grade verification', required: true },
      { id: '4', item: 'Cutting angle accuracy', required: false },
    ],
    FABRICATION: [
      { id: '1', item: 'Welding quality and strength', required: true },
      { id: '2', item: 'Joint alignment and fit', required: true },
      { id: '3', item: 'Surface preparation', required: true },
      { id: '4', item: 'Dimensional accuracy', required: true },
    ],
    COATING: [
      { id: '1', item: 'Surface cleaning and preparation', required: true },
      { id: '2', item: 'Coating thickness uniformity', required: true },
      { id: '3', item: 'Color matching specification', required: true },
      { id: '4', item: 'Finish quality and smoothness', required: false },
    ],
    ASSEMBLY: [
      { id: '1', item: 'Component fit and alignment', required: true },
      { id: '2', item: 'Hardware installation quality', required: true },
      { id: '3', item: 'Functional testing', required: true },
      { id: '4', item: 'Final dimensional check', required: true },
    ],
    DISPATCH: [
      { id: '1', item: 'Packaging quality and protection', required: true },
      { id: '2', item: 'Labeling and documentation', required: true },
      { id: '3', item: 'Final visual inspection', required: true },
      { id: '4', item: 'Quantity verification', required: true },
    ],
    INSTALLATION: [
      { id: '1', item: 'Site preparation adequacy', required: true },
      { id: '2', item: 'Installation alignment and level', required: true },
      { id: '3', item: 'Functional operation test', required: true },
      { id: '4', item: 'Customer satisfaction', required: false },
    ],
  };

  const handleStageChange = (stage: string) => {
    setInspectionData(prev => ({
      ...prev,
      stage,
      checklist: (mockChecklists[stage as keyof typeof mockChecklists] || []).map(item => ({
        ...item,
        status: 'PENDING',
        rating: 0,
        comments: '',
      })),
    }));
  };

  const updateChecklistItem = (itemId: string, field: string, value: any) => {
    setInspectionData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const submitInspection = () => {
    console.log('Submitting inspection:', inspectionData);
    alert('QC Inspection submitted successfully!');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>QC Inspection - {productionOrder?.productCode || 'New Inspection'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>QC Stage</InputLabel>
              <Select
                value={inspectionData.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                label="QC Stage"
              >
                {qcStages.map((stage) => (
                  <MenuItem key={stage} value={stage}>
                    {stage.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Inspector Name"
              value={inspectionData.inspector}
              onChange={(e) => setInspectionData(prev => ({ ...prev, inspector: e.target.value }))}
            />
          </Grid>

          {inspectionData.stage && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  {inspectionData.stage.replace('_', ' ')} Checklist
                </Typography>
              </Grid>
              {inspectionData.checklist.map((item) => (
                <Grid item xs={12} key={item.id}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {item.item}
                          {item.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                        </Typography>
                      </Box>
                      <FormControl size="small" sx={{ minWidth: 120, ml: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={item.status}
                          onChange={(e) => updateChecklistItem(item.id, 'status', e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="PASS">Pass</MenuItem>
                          <MenuItem value="FAIL">Fail</MenuItem>
                          <MenuItem value="NA">N/A</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="body2">Rating:</Typography>
                      <Rating
                        value={item.rating}
                        onChange={(_event, newValue) => updateChecklistItem(item.id, 'rating', newValue)}
                        size="small"
                      />
                    </Box>
                    <TextField
                      fullWidth
                      label="Comments"
                      size="small"
                      value={item.comments}
                      onChange={(e) => updateChecklistItem(item.id, 'comments', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Card>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Overall Assessment
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1">Overall Rating:</Typography>
                  <Rating
                    value={inspectionData.overallRating}
                    onChange={(_event, newValue) => setInspectionData(prev => ({ ...prev, overallRating: newValue || 0 }))}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="General Comments"
                  multiline
                  rows={3}
                  value={inspectionData.comments}
                  onChange={(e) => setInspectionData(prev => ({ ...prev, comments: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  startIcon={<PhotoCamera />}
                  onClick={() => alert('Photo capture functionality will be implemented')}
                >
                  Add Photos ({inspectionData.photos.length})
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={submitInspection} 
          variant="contained" 
          disabled={!inspectionData.stage || !inspectionData.inspector}
        >
          Submit Inspection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const QCManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const {
    data: qcInspections,
    isLoading,
    error,
  } = useGetQCInspectionsQuery();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Mock data for demonstration
  const mockInspections = qcInspections || [
    {
      id: '1',
      inspectionNumber: 'QC-2024-001',
      productionOrderId: 'PO-2024-001',
      productCode: 'STL-DOOR-001',
      stage: 'CUTTING',
      inspector: 'John Doe',
      status: 'PASSED',
      overallScore: 4.5,
      inspectionDate: '2024-01-15',
      defectsFound: 0,
    },
    {
      id: '2',
      inspectionNumber: 'QC-2024-002',
      productionOrderId: 'PO-2024-002',
      productCode: 'STL-WINDOW-001',
      stage: 'FABRICATION',
      inspector: 'Jane Smith',
      status: 'FAILED',
      overallScore: 2.5,
      inspectionDate: '2024-01-16',
      defectsFound: 3,
    },
  ];

  const mockPendingOrders = [
    {
      id: '1',
      productionOrderId: 'PO-2024-003',
      productCode: 'STL-DOOR-002',
      currentStage: 'COATING',
      scheduledQCDate: '2024-01-18',
      priority: 'HIGH',
    },
    {
      id: '2',
      productionOrderId: 'PO-2024-004',
      productCode: 'STL-FRAME-001',
      currentStage: 'ASSEMBLY',
      scheduledQCDate: '2024-01-19',
      priority: 'MEDIUM',
    },
  ];

  const mockReworkOrders = [
    {
      id: '1',
      reworkNumber: 'RW-2024-001',
      originalInspectionId: 'QC-2024-002',
      productCode: 'STL-WINDOW-001',
      defectDescription: 'Welding quality issues',
      assignedTo: 'Welding Team A',
      status: 'IN_PROGRESS',
      createdDate: '2024-01-16',
      targetCompletion: '2024-01-20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'success';
      case 'FAILED': return 'error';
      case 'IN_PROGRESS': return 'info';
      case 'PENDING': return 'warning';
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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load QC data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quality Control Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setInspectionDialogOpen(true)}
        >
          New Inspection
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Total Inspections</Typography>
              </Box>
              <Typography variant="h4">{mockInspections.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Passed</Typography>
              </Box>
              <Typography variant="h4">
                {mockInspections.filter(i => i.status === 'PASSED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Cancel sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="h6">Failed</Typography>
              </Box>
              <Typography variant="h4">
                {mockInspections.filter(i => i.status === 'FAILED').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Build sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Rework Orders</Typography>
              </Box>
              <Typography variant="h4">{mockReworkOrders.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search by inspection number, product code, or inspector..."
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

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Completed Inspections" />
            <Tab label="Pending QC" />
            <Tab label="Rework Orders" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Inspection #</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Stage</TableCell>
                    <TableCell>Inspector</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Score</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Defects</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {inspection.inspectionNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{inspection.productCode}</TableCell>
                      <TableCell>
                        <Chip label={inspection.stage} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{inspection.inspector}</TableCell>
                      <TableCell>
                        <Chip
                          label={inspection.status}
                          color={getStatusColor(inspection.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Rating value={inspection.overallScore} readOnly size="small" />
                      </TableCell>
                      <TableCell>{new Date(inspection.inspectionDate).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={inspection.defectsFound}
                          color={inspection.defectsFound > 0 ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Edit Inspection">
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Production Order</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Current Stage</TableCell>
                    <TableCell>Scheduled QC Date</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockPendingOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {order.productionOrderId}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.productCode}</TableCell>
                      <TableCell>
                        <Chip label={order.currentStage} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{new Date(order.scheduledQCDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.priority}
                          color={getPriorityColor(order.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Assignment />}
                          onClick={() => {
                            setSelectedOrder(order);
                            setInspectionDialogOpen(true);
                          }}
                        >
                          Start QC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rework #</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Defect Description</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Target Completion</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mockReworkOrders.map((rework) => (
                    <TableRow key={rework.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {rework.reworkNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{rework.productCode}</TableCell>
                      <TableCell>{rework.defectDescription}</TableCell>
                      <TableCell>{rework.assignedTo}</TableCell>
                      <TableCell>
                        <Chip
                          label={rework.status.replace('_', ' ')}
                          color={getStatusColor(rework.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(rework.createdDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(rework.targetCompletion).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="View Details">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Update Status">
                          <Edit />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>

      {/* QC Inspection Dialog */}
      <QCInspectionDialog
        open={inspectionDialogOpen}
        onClose={() => {
          setInspectionDialogOpen(false);
          setSelectedOrder(null);
        }}
        productionOrder={selectedOrder}
      />
    </Box>
  );
};

export default QCManagement;