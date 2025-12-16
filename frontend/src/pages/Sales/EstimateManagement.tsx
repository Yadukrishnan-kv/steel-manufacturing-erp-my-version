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
  Alert,
  CircularProgress,
  Pagination,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Visibility,
  CheckCircle,
  Cancel,
  Print,
  Send,
  Refresh,
} from '@mui/icons-material';
import {
  useGetEstimatesQuery,
  useGetEstimateQuery,
  useCreateEstimationMutation,
  useApproveEstimateMutation,
  useGetLeadsQuery,
} from '../../services/api';

interface CreateEstimateDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateEstimateDialog: React.FC<CreateEstimateDialogProps> = ({ open, onClose }) => {
  const [estimateData, setEstimateData] = useState({
    leadId: '',
    customerId: '',
    items: [{
      description: '',
      quantity: 1,
      specifications: {
        size: { width: 0, height: 0, unit: 'mm' },
        coatingType: '',
        coatingColor: '',
        hardware: {
          lockType: '',
          hingeType: '',
          handleType: '',
        },
      },
    }],
    discountPercentage: 0,
    validityDays: 30,
  });

  const { data: leadsData } = useGetLeadsQuery({ limit: 100 });
  const [createEstimation, { isLoading: isCreating }] = useCreateEstimationMutation();

  const handleInputChange = (field: string) => (event: any) => {
    setEstimateData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setEstimateData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setEstimateData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        specifications: {
          size: { width: 0, height: 0, unit: 'mm' },
          coatingType: '',
          coatingColor: '',
          hardware: {
            lockType: '',
            hingeType: '',
            handleType: '',
          },
        },
      }],
    }));
  };

  const removeItem = (index: number) => {
    setEstimateData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      await createEstimation(estimateData).unwrap();
      onClose();
      // Reset form
      setEstimateData({
        leadId: '',
        customerId: '',
        items: [{
          description: '',
          quantity: 1,
          specifications: {
            size: { width: 0, height: 0, unit: 'mm' },
            coatingType: '',
            coatingColor: '',
            hardware: {
              lockType: '',
              hingeType: '',
              handleType: '',
            },
          },
        }],
        discountPercentage: 0,
        validityDays: 30,
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Create New Estimate</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Lead</InputLabel>
              <Select
                value={estimateData.leadId}
                onChange={handleInputChange('leadId')}
                label="Lead"
              >
                {leadsData?.leads?.map((lead: any) => (
                  <MenuItem key={lead.id} value={lead.id}>
                    {lead.leadNumber} - {lead.contactName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Discount %"
              type="number"
              value={estimateData.discountPercentage}
              onChange={handleInputChange('discountPercentage')}
              inputProps={{ min: 0, max: 50 }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Validity (Days)"
              type="number"
              value={estimateData.validityDays}
              onChange={handleInputChange('validityDays')}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Items
        </Typography>

        {estimateData.items.map((item, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">Item {index + 1}</Typography>
                    {estimateData.items.length > 1 && (
                      <Button
                        color="error"
                        size="small"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={item.specifications.size.unit}
                    onChange={(e) => handleItemChange(index, 'specifications', {
                      ...item.specifications,
                      size: { ...item.specifications.size, unit: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Width"
                    type="number"
                    value={item.specifications.size.width}
                    onChange={(e) => handleItemChange(index, 'specifications', {
                      ...item.specifications,
                      size: { ...item.specifications.size, width: parseFloat(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Height"
                    type="number"
                    value={item.specifications.size.height}
                    onChange={(e) => handleItemChange(index, 'specifications', {
                      ...item.specifications,
                      size: { ...item.specifications.size, height: parseFloat(e.target.value) }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Coating Type</InputLabel>
                    <Select
                      value={item.specifications.coatingType}
                      onChange={(e) => handleItemChange(index, 'specifications', {
                        ...item.specifications,
                        coatingType: e.target.value
                      })}
                      label="Coating Type"
                    >
                      <MenuItem value="POWDER_COATING">Powder Coating</MenuItem>
                      <MenuItem value="ANODIZING">Anodizing</MenuItem>
                      <MenuItem value="WOOD_FINISH">Wood Finish</MenuItem>
                      <MenuItem value="SPECIAL_COATING">Special Coating</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Coating Color"
                    value={item.specifications.coatingColor}
                    onChange={(e) => handleItemChange(index, 'specifications', {
                      ...item.specifications,
                      coatingColor: e.target.value
                    })}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outlined"
          onClick={addItem}
          startIcon={<Add />}
          sx={{ mb: 2 }}
        >
          Add Item
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={isCreating || !estimateData.leadId || estimateData.items.some(item => !item.description)}
        >
          {isCreating ? <CircularProgress size={20} /> : 'Create Estimate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EstimateManagement: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    approvalStatus: '',
  });

  // API calls
  const { 
    data: estimatesData, 
    isLoading: isEstimatesLoading, 
    refetch: refetchEstimates 
  } = useGetEstimatesQuery(filters);

  const { 
    data: estimateDetails, 
    isLoading: isDetailsLoading 
  } = useGetEstimateQuery(selectedEstimateId, {
    skip: !selectedEstimateId,
  });

  const [approveEstimate] = useApproveEstimateMutation();

  const handleFilterChange = (field: string) => (event: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value,
      page: 1,
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setFilters(prev => ({ ...prev, page: value }));
  };

  const handleViewEstimate = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    setViewDialogOpen(true);
  };

  const handleApproveEstimate = async (estimateId: string) => {
    try {
      await approveEstimate({ id: estimateId }).unwrap();
    } catch (error) {
      console.error('Error approving estimate:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SENT': return 'info';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'EXPIRED': return 'warning';
      default: return 'default';
    }
  };

  if (isEstimatesLoading) {
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
          Estimate Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => refetchEstimates()}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Estimate
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search estimates..."
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={handleFilterChange('status')}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="SENT">Sent</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Approval Status</InputLabel>
                <Select
                  value={filters.approvalStatus}
                  onChange={handleFilterChange('approvalStatus')}
                  label="Approval Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="APPROVED">Approved</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estimates Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estimate #</TableCell>
                  <TableCell>Lead/Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Final Amount</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estimatesData?.estimates?.map((estimate: any) => (
                  <TableRow key={estimate.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {estimate.estimateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {estimate.lead?.contactName || estimate.customer?.name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {estimate.lead?.leadNumber || estimate.customer?.code || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={estimate.status}
                        color={getStatusColor(estimate.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      ₹{estimate.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ₹{estimate.finalAmount.toLocaleString()}
                      </Typography>
                      {estimate.discountAmount > 0 && (
                        <Typography variant="caption" color="success.main">
                          -{estimate.discountAmount.toLocaleString()} discount
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(estimate.validUntil).toLocaleDateString()}
                      </Typography>
                      {new Date(estimate.validUntil) < new Date() && (
                        <Typography variant="caption" color="error">
                          Expired
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(estimate.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={() => handleViewEstimate(estimate.id)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      {estimate.status === 'DRAFT' && (
                        <IconButton 
                          size="small"
                          color="success"
                          onClick={() => handleApproveEstimate(estimate.id)}
                        >
                          <CheckCircle />
                        </IconButton>
                      )}
                      <IconButton size="small">
                        <Print />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No estimates found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {estimatesData?.pagination && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={estimatesData.pagination.pages}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Estimate Dialog */}
      <CreateEstimateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />

      {/* View Estimate Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Estimate Details
          {estimateDetails && (
            <Typography variant="subtitle1" color="text.secondary">
              {estimateDetails.estimateNumber}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {isDetailsLoading ? (
            <CircularProgress />
          ) : estimateDetails ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {estimateDetails.lead?.contactName || estimateDetails.customer?.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {estimateDetails.lead?.phone || estimateDetails.customer?.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {estimateDetails.lead?.email || estimateDetails.customer?.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {estimateDetails.lead?.address || estimateDetails.customer?.address}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Estimate Summary
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> ₹{estimateDetails.totalAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Discount:</strong> ₹{estimateDetails.discountAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Final Amount:</strong> ₹{estimateDetails.finalAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Valid Until:</strong> {new Date(estimateDetails.validUntil).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Items
                </Typography>
                <List>
                  {estimateDetails.items?.map((item: any, index: number) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={item.description}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Quantity: {item.quantity} | Unit Price: ₹{item.unitPrice.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              Total: ₹{item.totalPrice.toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="error">Failed to load estimate details</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<Print />}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<Send />}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstimateManagement;