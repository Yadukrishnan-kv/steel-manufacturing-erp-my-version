import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
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
import { Visibility as ViewIcon } from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { fetchOrders, clearError } from '../store/slices/ordersSlice'

export default function Orders() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  
  const { orders, isLoading, error } = useSelector((state: RootState) => state.orders)

  useEffect(() => {
    dispatch(fetchOrders())
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

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
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Orders
      </Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" color="text.secondary" align="center">
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Your orders will appear here once you place them.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {isMobile ? (
            // Mobile Card Layout
            <Grid container spacing={2}>
              {orders.map((order) => (
                <Grid item xs={12} key={order.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6">
                            Order #{order.orderNumber}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(order.orderDate)}
                          </Typography>
                        </Box>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Total Amount
                        </Typography>
                        <Typography variant="h6">
                          ₹{order.totalAmount.toLocaleString()}
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
                      
                      <Button
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        fullWidth
                      >
                        View Details
                      </Button>
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
                    <TableCell>Order Number</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Delivery Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">
                          #{order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.deliveryDate)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2">
                          ₹{order.totalAmount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  )
}