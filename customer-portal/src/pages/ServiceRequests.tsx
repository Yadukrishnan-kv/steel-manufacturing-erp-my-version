import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { RootState, AppDispatch } from '../store/store'
import { fetchServiceRequests, bookServiceRequest, clearError } from '../store/slices/serviceRequestsSlice'

const serviceTypes = [
  { value: 'INSTALLATION', label: 'Installation' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'WARRANTY_CLAIM', label: 'Warranty Claim' },
]

const priorities = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

export default function ServiceRequests() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch<AppDispatch>()
  
  const { serviceRequests, isLoading, error } = useSelector((state: RootState) => state.serviceRequests)
  
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: 'MAINTENANCE',
    priority: 'MEDIUM',
    description: '',
    address: '',
    salesOrderId: '',
  })
  const [preferredDate, setPreferredDate] = useState<Dayjs | null>(dayjs().add(1, 'day'))

  useEffect(() => {
    dispatch(fetchServiceRequests())
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const handleSubmit = async () => {
    if (!formData.description || !formData.address || !preferredDate) {
      return
    }

    try {
      await dispatch(bookServiceRequest({
        ...formData,
        preferredDate: preferredDate.toISOString(),
      })).unwrap()
      
      setOpen(false)
      setFormData({
        type: 'MAINTENANCE',
        priority: 'MEDIUM',
        description: '',
        address: '',
        salesOrderId: '',
      })
      setPreferredDate(dayjs().add(1, 'day'))
    } catch (error) {
      // Error handled by slice
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'primary'
      case 'scheduled':
        return 'info'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      case 'medium':
        return 'info'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading && serviceRequests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Service Requests
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Book Service
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {serviceRequests.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" align="center">
                No service requests found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Book your first service request to get started.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <>
            {isMobile ? (
              // Mobile Card Layout
              <Grid container spacing={2}>
                {serviceRequests.map((service) => (
                  <Grid item xs={12} key={service.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6">
                              {service.type} - #{service.serviceNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(service.scheduledDate)}
                            </Typography>
                          </Box>
                          <Box display="flex" flexDirection="column" gap={0.5}>
                            <Chip
                              label={service.status}
                              color={getStatusColor(service.status) as any}
                              size="small"
                            />
                            <Chip
                              label={service.priority}
                              color={getPriorityColor(service.priority) as any}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {service.description}
                        </Typography>
                        
                        {service.assignedTechnician && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Technician: {service.assignedTechnician.firstName} {service.assignedTechnician.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Phone: {service.assignedTechnician.phone}
                            </Typography>
                          </Box>
                        )}
                        
                        {service.salesOrder && (
                          <Typography variant="body2" color="text.secondary">
                            Related Order: #{service.salesOrder.orderNumber}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Desktop Table Layout
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Scheduled Date</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Technician</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceRequests.map((service) => (
                      <TableRow key={service.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">
                            #{service.serviceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{service.type}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {service.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(service.scheduledDate)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={service.priority}
                            color={getPriorityColor(service.priority) as any}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={service.status}
                            color={getStatusColor(service.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {service.assignedTechnician ? (
                            <Box>
                              <Typography variant="body2">
                                {service.assignedTechnician.firstName} {service.assignedTechnician.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {service.assignedTechnician.phone}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not assigned
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Book Service Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Book Service Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Service Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {serviceTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {priorities.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <DatePicker
                  label="Preferred Date"
                  value={preferredDate}
                  onChange={(newValue) => setPreferredDate(newValue)}
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the service you need..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Service Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter the address where service is needed..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Related Order ID (Optional)"
                  value={formData.salesOrderId}
                  onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
                  placeholder="Enter order ID if this service is related to an order"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isLoading || !formData.description || !formData.address || !preferredDate}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Book Service'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}