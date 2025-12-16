import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { feedbackAPI } from '../../services/api'

export interface FeedbackData {
  serviceRequestId?: string
  salesOrderId?: string
  rating: number
  feedback: string
  category: 'PRODUCT' | 'SERVICE' | 'DELIVERY' | 'SUPPORT'
}

export interface FeedbackState {
  isLoading: boolean
  error: string | null
  success: boolean
}

const initialState: FeedbackState = {
  isLoading: false,
  error: null,
  success: false,
}

// Async thunks
export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async (data: FeedbackData, { rejectWithValue }) => {
    try {
      const response = await feedbackAPI.submitFeedback(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to submit feedback')
    }
  }
)

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSuccess: (state) => {
      state.success = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit feedback
      .addCase(submitFeedback.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.success = false
      })
      .addCase(submitFeedback.fulfilled, (state) => {
        state.isLoading = false
        state.success = true
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearSuccess } = feedbackSlice.actions
export default feedbackSlice.reducer