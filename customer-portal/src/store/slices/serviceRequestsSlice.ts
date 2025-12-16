import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { serviceRequestsAPI } from '../../services/api'

export interface ServiceRequest {
  id: string
  serviceNumber: string
  type: string
  priority: string
  description: string
  scheduledDate: string
  status: string
  assignedTechnician?: {
    firstName: string
    lastName: string
    phone: string
  }
  salesOrder?: {
    orderNumber: string
  }
}

export interface ServiceBookingData {
  type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'WARRANTY_CLAIM'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  preferredDate: string
  address: string
  salesOrderId?: string
}

export interface ServiceRequestsState {
  serviceRequests: ServiceRequest[]
  isLoading: boolean
  error: string | null
}

const initialState: ServiceRequestsState = {
  serviceRequests: [],
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchServiceRequests = createAsyncThunk(
  'serviceRequests/fetchServiceRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceRequestsAPI.getServiceRequests()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch service requests')
    }
  }
)

export const bookServiceRequest = createAsyncThunk(
  'serviceRequests/bookServiceRequest',
  async (data: ServiceBookingData, { rejectWithValue }) => {
    try {
      const response = await serviceRequestsAPI.bookServiceRequest(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to book service request')
    }
  }
)

const serviceRequestsSlice = createSlice({
  name: 'serviceRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch service requests
      .addCase(fetchServiceRequests.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.isLoading = false
        state.serviceRequests = action.payload
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Book service request
      .addCase(bookServiceRequest.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(bookServiceRequest.fulfilled, (state, action) => {
        state.isLoading = false
        state.serviceRequests.unshift(action.payload)
      })
      .addCase(bookServiceRequest.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = serviceRequestsSlice.actions
export default serviceRequestsSlice.reducer