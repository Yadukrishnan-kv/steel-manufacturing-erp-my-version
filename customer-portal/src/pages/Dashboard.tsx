import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  ShoppingCart as OrderIcon,
  Build as ServiceIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { fetchOrders } from '../store/slices/ordersSlice'
import { fetchServiceRequests } from '../store/slices/serviceRequestsSlice'

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  
  const { customer } = useSelector((state: RootState) => state.auth)
  const { orders } = useSelector((state: RootState) => state.orders)
  const { serviceRequests } = useSelector((state: RootState) => state.serviceRequests)

  useEffect(() => {
    dispatch(fetchOrders())
    dispatch(fetchServiceRequests())
  }, [dispatch])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'success'
      case 'in_progress':
      case 'in-progress':
      case 'confirmed':
        return 'primary'
      case 'pending':
      case 'scheduled':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CompletedIcon color="success" />
      case 'pending':
      case 'scheduled':
        return <PendingIcon color="warning" />
      default:
        return <WarningIcon color="action" />
    }
  }

  const recentOrders = orders.slice(0, 3)
  const recentServiceRequests = serviceRequests.slice(0, 3)

  const orderStats = {
    total: orders.length,
    inProgress: orders.filter(o => o.status.toLowerCase().includes('progress') || o.status.toLowerCase() === 'confirmed').length,
    completed: orders.filter(o => o.status.toLowerCase() === 'delivered' || o.status.toLowerCase() === 'completed').length,
  }

  const serviceStats = {
    total: serviceRequests.length,
    scheduled: serviceRequests.filter(s => s.status.toLowerCase() === 'scheduled').length,
    completed: serviceRequests.filter(s => s.status.toLowerCase() === 'completed').length,
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {customer?.name}!
      </Typography>
      
      <Grid container spacing={3}>
        {/* Order Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <OrderIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Orders</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {orderStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {orderStats.inProgress} in progress, {orderStats.completed} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ServiceIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Services</Typography>
              </Box>
              <Typography variant="h3" color="secondary">
                {serviceStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {serviceStats.scheduled} scheduled, {serviceStats.completed} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/service-requests')}
                >
                  Book Service
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/feedback')}
                >
                  Give Feedback
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Info */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Info
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer ID: {customer?.code}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: {customer?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {customer?.phone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Orders</Typography>
                <Button size="small" onClick={() => navigate('/orders')}>
                  View All
                </Button>
              </Box>
              
              {recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No orders found
                </Typography>
              ) : (
                <List>
                  {recentOrders.map((order, index) => (
                    <div key={order.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        sx={{ px: 0 }}
                      >
                        <ListItemIcon>
                          {getStatusIcon(order.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Order #${order.orderNumber}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                ₹{order.totalAmount.toLocaleString()}
                              </Typography>
                              <Chip
                                label={order.status}
                                size="small"
                                color={getStatusColor(order.status) as any}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentOrders.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Service Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Service Requests</Typography>
                <Button size="small" onClick={() => navigate('/service-requests')}>
                  View All
                </Button>
              </Box>
              
              {recentServiceRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No service requests found
                </Typography>
              ) : (
                <List>
                  {recentServiceRequests.map((service, index) => (
                    <div key={service.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getStatusIcon(service.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${service.type} - #${service.serviceNumber}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(service.scheduledDate).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={service.status}
                                size="small"
                                color={getStatusColor(service.status) as any}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentServiceRequests.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Production Progress (if any orders in progress) */}
        {orderStats.inProgress > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Production Progress
                </Typography>
                {orders
                  .filter(order => order.status.toLowerCase().includes('progress') || order.status.toLowerCase() === 'confirmed')
                  .slice(0, 2)
                  .map(order => (
                    <Box key={order.id} mb={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        Order #{order.orderNumber}
                      </Typography>
                      <Grid container spacing={2}>
                        {order.productionProgress.map(stage => (
                          <Grid item xs={12} sm={6} md={2} key={stage.stage}>
                            <Box>
                              <Typography variant="body2" gutterBottom>
                                {stage.stage}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={stage.completionPercentage}
                                color={stage.status === 'COMPLETED' ? 'success' : stage.status === 'IN_PROGRESS' ? 'primary' : 'inherit'}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {stage.completionPercentage}%
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}