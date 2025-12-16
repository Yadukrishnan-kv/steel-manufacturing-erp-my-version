import axios from 'axios'
import { LoginCredentials, RegisterData } from '../store/slices/authSlice'
import { ServiceBookingData } from '../store/slices/serviceRequestsSlice'
import { FeedbackData } from '../store/slices/feedbackSlice'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    const customerId = localStorage.getItem('customerId')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (customerId) {
      config.headers['x-customer-id'] = customerId
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('customerId')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post('/customer-portal/login', credentials),
  
  register: (data: RegisterData) =>
    api.post('/customer-portal/register', data),
}

// Orders API
export const ordersAPI = {
  getOrders: () =>
    api.get('/customer-portal/orders'),
  
  getOrderDetails: (orderId: string) =>
    api.get(`/customer-portal/orders/${orderId}`),
  
  sendOrderUpdate: (orderId: string, status: string) =>
    api.post(`/customer-portal/orders/${orderId}/notify`, { status }),
}

// Service Requests API
export const serviceRequestsAPI = {
  getServiceRequests: () =>
    api.get('/customer-portal/service-requests'),
  
  bookServiceRequest: (data: ServiceBookingData) =>
    api.post('/customer-portal/service-requests', data),
}

// Documents API
export const documentsAPI = {
  getDocuments: () =>
    api.get('/customer-portal/documents'),
}

// Feedback API
export const feedbackAPI = {
  submitFeedback: (data: FeedbackData) =>
    api.post('/customer-portal/feedback', data),
}

export default api