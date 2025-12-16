import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Rating,
  Alert,
  CircularProgress,
} from '@mui/material'
import { RootState, AppDispatch } from '../store/store'
import { submitFeedback, clearError, clearSuccess } from '../store/slices/feedbackSlice'
import { fetchOrders } from '../store/slices/ordersSlice'
import { fetchServiceRequests } from '../store/slices/serviceRequestsSlice'

const categories = [
  { value: 'PRODUCT', label: 'Product Quality' },
  { value: 'SERVICE', label: 'Service Experience' },
  { value: 'DELIVERY', label: 'Delivery & Installation' },
  { value: 'SUPPORT', label: 'Customer Support' },
]

export default function Feedback() {
  const dispatch = useDispatch<AppDispatch>()
  
  const { isLoading, error, success } = useSelector((state: RootState) => state.feedback)
  const { orders } = useSelector((state: RootState) => state.orders)
  const { serviceRequests } = useSelector((state: RootState) => state.serviceRequests)
  
  const [formData, setFormData] = useState({
    category: 'PRODUCT',
    rating: 5,
    feedback: '',
    salesOrderId: '',
    serviceRequestId: '',
  })

  useEffect(() => {
    dispatch(fetchOrders())
    dispatch(fetchServiceRequests())
    return () => {
      dispatch(clearError())
      dispatch(clearSuccess())
    }
  }, [dispatch])

  useEffect(() => {
    if (success) {
      // Reset form on successful submission
      setFormData({
        category: 'PRODUCT',
        rating: 5,
        feedback: '',
        salesOrderId: '',
        serviceRequestId: '',
      })
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.feedback.trim()) {
      return
    }

    const feedbackData = {
      category: formData.category as 'PRODUCT' | 'SERVICE' | 'DELIVERY' | 'SUPPORT',
      rating: formData.rating,
      feedback: formData.feedback,
      ...(formData.salesOrderId && { salesOrderId: formData.salesOrderId }),
      ...(formData.serviceRequestId && { serviceRequestId: formData.serviceRequestId }),
    }

    dispatch(submitFeedback(feedbackData))
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feedback & Reviews
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Share Your Experience
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Thank you for your feedback! We appreciate your input.
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Feedback Category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      {categories.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography component="legend" variant="body2" gutterBottom>
                        Overall Rating
                      </Typography>
                      <Rating
                        name="rating"
                        value={formData.rating}
                        onChange={(event, newValue) => {
                          handleChange('rating', newValue || 1)
                        }}
                        size="large"
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Related Order (Optional)"
                      value={formData.salesOrderId}
                      onChange={(e) => handleChange('salesOrderId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {orders.map((order) => (
                        <MenuItem key={order.id} value={order.id}>
                          Order #{order.orderNumber}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Related Service (Optional)"
                      value={formData.serviceRequestId}
                      onChange={(e) => handleChange('serviceRequestId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {serviceRequests.map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          {service.type} - #{service.serviceNumber}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Your Feedback"
                      value={formData.feedback}
                      onChange={(e) => handleChange('feedback', e.target.value)}
                      placeholder="Please share your experience with us. Your feedback helps us improve our products and services."
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading || !formData.feedback.trim()}
                      sx={{ minWidth: 120 }}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Submit Feedback'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Why Your Feedback Matters
              </Typography>
              <Typography variant="body2" paragraph>
                Your feedback helps us understand how we're doing and where we can improve. We read every review and use your insights to enhance our products and services.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                What to include:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                <li>Product quality and performance</li>
                <li>Installation and delivery experience</li>
                <li>Customer service interactions</li>
                <li>Suggestions for improvement</li>
              </Typography>
              
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                We typically respond to feedback within 24-48 hours.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}