import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { fetchOrderDetails, clearSelectedOrder, clearError } from '../store/slices/ordersSlice'

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  
  const { selectedOrder: order, isLoading, error } = useSelector((state: RootState) => state.orders)

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderDetails(orderId))
    }
    return () => {
      dispatch(clearSelectedOrder())
      dispatch(clearError())
    }
  }, [dispatch, orderId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'success'
      case 'in_production':
      case 'confirmed':
        return 'primary'
      case 'ready':
        return 'info'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'IN_PROGRESS':
        return 'primary'
      default:
        return 'inherit'
    }
  }

  const getQCStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'success'
      case 'FAILED':
        return 'error'
      case 'REWORK':
        return 'warning'
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    )
  }

  if (!order) {
    return (
      <Box>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/orders')}
          sx={{ mb: 2 }}
        >
          Back to Orders
        </Button>
        <Alert severity="info">
          Order not found
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/orders')}
        sx={{ mb: 2 }}
      >
        Back to Orders
      </Button>

      <Typography variant="h4" gutterBottom>
        Order #{order.orderNumber}
      </Typography>

      <Grid container spacing={3}>
        {/* Order Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={order.status}
                  color={getStatusColor(order.status) as any}
                  sx={{ mt: 0.5 }}
                />
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Order Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(order.orderDate)}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Delivery Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(order.deliveryDate)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{order.totalAmount.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Items */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ₹{item.unitPrice.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Production Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Production Progress
              </Typography>
              <Grid container spacing={2}>
                {order.productionProgress.map((stage) => (
                  <Grid item xs={12} sm={6} md={2} key={stage.stage}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {stage.stage}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={stage.completionPercentage}
                        color={getProgressColor(stage.status) as any}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {stage.completionPercentage}%
                      </Typography>
                      <Box mt={1}>
                        <Chip
                          label={stage.status}
                          size="small"
                          color={getProgressColor(stage.status) as any}
                        />
                      </Box>
                      {stage.startDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Started: {formatDate(stage.startDate)}
                        </Typography>
                      )}
                      {stage.endDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Completed: {formatDate(stage.endDate)}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality Control Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Control Status
              </Typography>
              <Grid container spacing={2}>
                {order.qcStatus.map((qc) => (
                  <Grid item xs={12} sm={6} md={2} key={qc.stage}>
                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {qc.stage}
                      </Typography>
                      <Chip
                        label={qc.status}
                        color={getQCStatusColor(qc.status) as any}
                        sx={{ mb: 1 }}
                      />
                      {qc.inspectionDate && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Inspected: {formatDate(qc.inspectionDate)}
                        </Typography>
                      )}
                      {qc.inspector && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Inspector: {qc.inspector}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}