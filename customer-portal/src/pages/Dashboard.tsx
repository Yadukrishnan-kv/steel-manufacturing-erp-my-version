import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Paper,
  Stack,
  Avatar,
  LinearProgress,
  useTheme,
} from '@mui/material'
import {
  ShoppingCart as OrderIcon,
  Build as ServiceIcon,
  CheckCircle as CompletedIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { RootState, AppDispatch } from '../store/store'
import { fetchOrders } from '../store/slices/ordersSlice'
import { fetchServiceRequests } from '../store/slices/serviceRequestsSlice'
import { ModernButton } from '../components/modern'

export default function Dashboard() {
  const theme = useTheme()
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

  const recentOrders = (orders || []).slice(0, 3)
  const recentServiceRequests = (serviceRequests || []).slice(0, 3)

  const orderStats = {
    total: (orders || []).length,
    inProgress: (orders || []).filter(o => o.status.toLowerCase().includes('progress') || o.status.toLowerCase() === 'confirmed').length,
    completed: (orders || []).filter(o => o.status.toLowerCase() === 'delivered' || o.status.toLowerCase() === 'completed').length,
  }

  const serviceStats = {
    total: (serviceRequests || []).length,
    scheduled: (serviceRequests || []).filter(s => s.status.toLowerCase() === 'scheduled').length,
    completed: (serviceRequests || []).filter(s => s.status.toLowerCase() === 'completed').length,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Box>
      {/* Welcome Header - More compact */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.custom.colors.primary[600]} 0%, ${theme.custom.colors.primary[700]} 100%)`,
          color: 'white',
          p: 3,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                fontSize: '1.5rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {customer?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Welcome back, {customer?.name?.split(' ')[0]}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400 }}>
              Here's what's happening with your orders and services
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards - More compact */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.custom.colors.primary[600]} 0%, ${theme.custom.colors.primary[700]} 100%)`,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.75rem' }}>
                    {orderStats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Total Orders
                  </Typography>
                </Box>
                <OrderIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.custom.colors.secondary[500]} 0%, ${theme.custom.colors.secondary[600]} 100%)`,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.75rem' }}>
                    {orderStats.inProgress}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    In Progress
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.custom.colors.accent[500]} 0%, ${theme.custom.colors.accent[600]} 100%)`,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.75rem' }}>
                    {serviceStats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Services
                  </Typography>
                </Box>
                <ServiceIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${theme.custom.colors.semantic.success[500]} 0%, ${theme.custom.colors.semantic.success[600]} 100%)`,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.75rem' }}>
                    {orderStats.completed}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Completed
                  </Typography>
                </Box>
                <CompletedIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders - More compact */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Recent Orders
                </Typography>
                <ModernButton
                  variant="tertiary"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/orders')}
                >
                  View All
                </ModernButton>
              </Box>
              
              {recentOrders.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <AssessmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    No orders yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Your orders will appear here once you place them.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {recentOrders.map((order, index) => (
                    <Box key={order.id}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ backgroundColor: 'primary.main', width: 32, height: 32 }}>
                            <OrderIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              Order #{order.orderNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDate(order.orderDate)} • ₹{order.totalAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </Box>
                      {index < recentOrders.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Service Requests - More compact */}
        <Grid item xs={12} lg={6}>
          <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                  Service Requests
                </Typography>
                <ModernButton
                  variant="tertiary"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/service-requests')}
                >
                  View All
                </ModernButton>
              </Box>
              
              {recentServiceRequests.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <ServiceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    No service requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    Book a service to get started.
                  </Typography>
                  <ModernButton
                    variant="primary"
                    size="small"
                    onClick={() => navigate('/service-requests')}
                  >
                    Book Service
                  </ModernButton>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {recentServiceRequests.map((service, index) => (
                    <Box key={service.id}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" py={1}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ backgroundColor: 'secondary.main', width: 32, height: 32 }}>
                            <ServiceIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {service.type} - #{service.serviceNumber}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDate(service.scheduledDate)}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={service.status}
                          color={getStatusColor(service.status) as any}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </Box>
                      {index < recentServiceRequests.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Production Progress - More compact */}
        {(orders || []).filter(order => order.status.toLowerCase().includes('progress') || order.status.toLowerCase() === 'confirmed').length > 0 && (
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
                  Production Progress
                </Typography>
                {(orders || [])
                  .filter(order => order.status.toLowerCase().includes('progress') || order.status.toLowerCase() === 'confirmed')
                  .slice(0, 2)
                  .map(order => (
                    <Box key={order.id} mb={3}>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.95rem' }}>
                        Order #{order.orderNumber}
                      </Typography>
                      <Grid container spacing={2}>
                        {(order.productionProgress || []).map(stage => (
                          <Grid item xs={6} sm={4} md={2} key={stage.stage}>
                            <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block', fontSize: '0.75rem' }}>
                                {stage.stage}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={stage.completionPercentage}
                                color={stage.status === 'COMPLETED' ? 'success' : stage.status === 'IN_PROGRESS' ? 'primary' : 'inherit'}
                                sx={{ mb: 1, borderRadius: 1, height: 6 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                                {stage.completionPercentage}%
                              </Typography>
                              <Chip
                                label={stage.status}
                                size="small"
                                color={stage.status === 'COMPLETED' ? 'success' : stage.status === 'IN_PROGRESS' ? 'primary' : 'default'}
                                sx={{ fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                              />
                            </Paper>
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