import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ordersAPI } from '../../services/api'

export interface OrderItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface ProductionProgress {
  stage: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  startDate?: string
  endDate?: string
  completionPercentage: number
}

export interface QCStatus {
  stage: string
  status: 'PENDING' | 'PASSED' | 'FAILED' | 'REWORK'
  inspectionDate?: string
  inspector?: string
}

export interface Order {
  id: string
  orderNumber: string
  orderDate: string
  deliveryDate: string
  status: string
  totalAmount: number
  items: OrderItem[]
  productionProgress: ProductionProgress[]
  qcStatus: QCStatus[]
}

export interface OrdersState {
  orders: Order[]
  selectedOrder: Order | null
  isLoading: boolean
  error: string | null
}

const initialState: OrdersState = {
  orders: [],
  selectedOrder: null,
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrders()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch orders')
    }
  }
)

export const fetchOrderDetails = createAsyncThunk(
  'orders/fetchOrderDetails',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await ordersAPI.getOrderDetails(orderId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch order details')
    }
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.data
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Fetch order details
      .addCase(fetchOrderDetails.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedOrder = action.payload.data
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearSelectedOrder } = ordersSlice.actions
export default ordersSlice.reducer