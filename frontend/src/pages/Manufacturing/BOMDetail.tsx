import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Breadcrumbs,
  Link,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Assignment as BOMIcon,
  NavigateNext,
  Engineering as EngineeringIcon,
  Calculate as CalculateIcon,
  ExpandMore as ExpandMoreIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import {
  useGetBOMQuery,
  useGetBOMCostQuery,
  useApproveBOMMutation,
  useCreateEngineeringChangeMutation,
  useUpdateBOMWithEngineeringChangeMutation,
} from '../../services/api';

const BOMDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State management
  const [editDialog, setEditDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [engineeringChangeDialog, setEngineeringChangeDialog] = useState(false);
  const [costAnalysisDialog, setCostAnalysisDialog] = useState(false);
  const [costQuantity, setCostQuantity] = useState(1);

  // API hooks
  const {
    data: bomData,
    isLoading,
    error,
    refetch,
  } = useGetBOMQuery(id!, { skip: !id });

  const { data: costAnalysis } = useGetBOMCostQuery(
    { id: id!, quantity: costQuantity },
    { skip: !id }
  );

  const [approveBOM, { isLoading: isApproving }] = useApproveBOMMutation();
  const [createEngineeringChange] = useCreateEngineeringChangeMutation();
  const [updateBOM] = useUpdateBOMWithEngineeringChangeMutation();

  const bom = bomData;

  // Status configuration
  const statusConfig = {
    DRAFT: { color: 'rgba(0, 0, 0, 0.08)', textColor: 'text.secondary', icon: <BOMIcon />, label: 'Draft' },
    PENDING_APPROVAL: { color: '#fff3e0', textColor: '#f57c00', icon: <EditIcon />, label: 'Pending Approval' },
    APPROVED: { color: '#e8f5e8', textColor: '#2e7d32', icon: <ApproveIcon />, label: 'Approved' },
    OBSOLETE: { color: '#ffebee', textColor: '#d32f2f', icon: <HistoryIcon />, label: 'Obsolete' },
  };

  // Handle approve BOM
  const handleApproveBOM = async () => {
    if (!bom) return;
    
    try {
      await approveBOM(bom.id).unwrap();
      refetch();
      setApproveDialog(false);
    } catch (error) {
      console.error('Failed to approve BOM:', error);
    }
  };

  // Handle engineering change
  const handleEngineeringChange = async (changeData: any) => {
    if (!bom) return;
    
    try {
      await createEngineeringChange({
        bomId: bom.id,
        ...changeData,
      }).unwrap();
      refetch();
      setEngineeringChangeDialog(false);
    } catch (error) {
      console.error('Failed to create engineering change:', error);
    }
  };

  // Render BOM tree structure
  const renderBOMTree = (items: any[], level = 0) => {
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
          {item.scrapPercentage > 0 && (
            <Chip
              label={`Scrap: ${item.scrapPercentage}%`}
              size="small"
              color="warning"
              sx={{ ml: 0.5, height: 20, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {item.children && item.children.length > 0 && renderBOMTree(item.children, level + 1)}
      </Box>
    ));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading BOM details...</Typography>
      </Box>
    );
  }

  if (error || !bom) {
    return (
      <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
        <Alert severity="error">
          Failed to load BOM details. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 1.5, px: 1.5 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1.5 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/manufacturing');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          Manufacturing
        </Link>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/manufacturing/bom-management');
          }}
          sx={{ fontSize: '0.75rem' }}
        >
          BOM Management
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '0.75rem' }}>
          {bom.product?.code} - Rev. {bom.revision}
        </Typography>
      </Breadcrumbs>

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
            onClick={() => navigate('/manufacturing/bom-management')}
            sx={{ p: 0.5 }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
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
              BOM: {bom.product?.name}
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}>
              {bom.product?.code} - Revision {bom.revision}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {bom.status === 'PENDING_APPROVAL' && (
            <Button
              variant="contained"
              size="small"
              startIcon={<ApproveIcon sx={{ fontSize: 16 }} />}
              onClick={() => setApproveDialog(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                bgcolor: '#2e7d32',
                '&:hover': { bgcolor: '#1b5e20' }
              }}
            >
              Approve BOM
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
            onClick={() => setEditDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EngineeringIcon sx={{ fontSize: 16 }} />}
            onClick={() => setEngineeringChangeDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Engineering Change
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalculateIcon sx={{ fontSize: 16 }} />}
            onClick={() => setCostAnalysisDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5
            }}
          >
            Cost Analysis
          </Button>
        </Box>
      </Box>

      <Grid container spacing={1.5}>
        {/* BOM Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                BOM Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        icon={statusConfig[bom.status as keyof typeof statusConfig]?.icon}
                        label={statusConfig[bom.status as keyof typeof statusConfig]?.label || bom.status}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: statusConfig[bom.status as keyof typeof statusConfig]?.color,
                          color: statusConfig[bom.status as keyof typeof statusConfig]?.textColor,
                          '& .MuiChip-icon': { fontSize: 16 }
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Revision
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={bom.revision}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Items
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, mt: 0.5 }}>
                      {bom.items?.length || 0} items
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Effective Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                      {new Date(bom.effectiveDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Total Cost
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.primary.main }}>
                      ${bom.totalCost?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                </Grid>
                
                {bom.engineeringChangeNumber && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Engineering Change
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {bom.engineeringChangeNumber}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {bom.approvedBy && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Approved By
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {bom.approvedBy}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                
                {bom.approvedAt && (
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Approved Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {new Date(bom.approvedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* BOM Structure */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                BOM Structure
              </Typography>
              
              {bom.items && bom.items.length > 0 ? (
                <Accordion sx={{ borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ 
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px 8px 0 0',
                      '&.Mui-expanded': {
                        borderRadius: '8px 8px 0 0'
                      }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      fontSize: '0.875rem'
                    }}>
                      Material List ({bom.items.length} items)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 1.5 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Quantity</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Unit</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Scrap %</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Operation</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Level</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {bom.items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    {item.inventoryItem.code}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                    {item.inventoryItem.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {item.quantity}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {item.unit}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {item.scrapPercentage}%
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {item.operation || '-'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {item.level}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                ${item.inventoryItem.standardCost ? 
                                  (item.quantity * item.inventoryItem.standardCost).toFixed(2) : 
                                  '0.00'
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ) : (
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
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ borderRadius: 1.5, mb: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                Quick Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CalculateIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setCostAnalysisDialog(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Cost Analysis
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EngineeringIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setEngineeringChangeDialog(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  Engineering Change
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/production-orders?bom=${bom.id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  View Production Orders
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HistoryIcon sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/manufacturing/bom-management?product=${bom.productId}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    justifyContent: 'flex-start'
                  }}
                >
                  View All Revisions
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* BOM Statistics */}
          <Card sx={{ borderRadius: 1.5 }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 600, 
                mb: 1.5, 
                color: theme.palette.text.primary,
                fontSize: '0.875rem'
              }}>
                BOM Statistics
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Items
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {bom.items?.length || 0}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Total Cost
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600, color: theme.palette.primary.main }}>
                    ${bom.totalCost?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    BOM Levels
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {Math.max(...(bom.items?.map((item: any) => item.level) || [1]))}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Average Scrap %
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {bom.items?.length > 0 ? 
                      (bom.items.reduce((sum: number, item: any) => sum + item.scrapPercentage, 0) / bom.items.length).toFixed(1) : 
                      '0.0'
                    }%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approve BOM Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve BOM</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to approve this BOM?
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            BOM: {bom.product?.name} - Revision {bom.revision}
          </Typography>
          <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
            Once approved, this BOM will become active and can be used for production orders.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleApproveBOM}
            disabled={isApproving}
            sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            {isApproving ? 'Approving...' : 'Approve BOM'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Engineering Change Dialog */}
      <Dialog open={engineeringChangeDialog} onClose={() => setEngineeringChangeDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Engineering Change Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            BOM: {bom.product?.name} - Revision {bom.revision}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Change Number"
                placeholder="e.g., ECR-2024-001"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="New Revision"
                placeholder="e.g., Rev-002"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Effective Date"
                defaultValue={new Date().toISOString().split('T')[0]}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
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
                label="Change Reason"
                multiline
                rows={3}
                placeholder="Describe the reason for this engineering change..."
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                placeholder="Provide detailed description of the changes..."
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEngineeringChangeDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleEngineeringChange({
                changeNumber: 'ECR-001',
                changeReason: 'Material substitution',
                effectiveDate: new Date().toISOString(),
                priority: 'MEDIUM',
                description: 'Engineering change request',
              });
            }}
          >
            Create Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cost Analysis Dialog */}
      <Dialog open={costAnalysisDialog} onClose={() => setCostAnalysisDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cost Analysis - {bom.product?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={costQuantity}
              onChange={(e) => setCostQuantity(parseInt(e.target.value) || 1)}
              size="small"
              inputProps={{ min: 1 }}
              sx={{ width: 120 }}
            />
          </Box>
          
          {costAnalysis && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Total Cost: ${costAnalysis.totalCost?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cost breakdown for quantity: {costQuantity}
              </Typography>
              
              {costAnalysis.breakdown && (
                <TableContainer>
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
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostAnalysisDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BOMDetail;