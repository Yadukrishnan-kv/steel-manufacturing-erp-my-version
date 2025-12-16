import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { documentsAPI } from '../../services/api'

export interface Document {
  id: string
  type: string
  name: string
  url: string
  created_at: string
}

export interface DocumentsState {
  documents: Document[]
  isLoading: boolean
  error: string | null
}

const initialState: DocumentsState = {
  documents: [],
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await documentsAPI.getDocuments()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch documents')
    }
  }
)

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch documents
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.isLoading = false
        state.documents = action.payload
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = documentsSlice.actions
export default documentsSlice.reducer