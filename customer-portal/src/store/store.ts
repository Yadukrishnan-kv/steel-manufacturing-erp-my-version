import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import ordersReducer from './slices/ordersSlice'
import serviceRequestsReducer from './slices/serviceRequestsSlice'
import documentsReducer from './slices/documentsSlice'
import feedbackReducer from './slices/feedbackSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    serviceRequests: serviceRequestsReducer,
    documents: documentsReducer,
    feedback: feedbackReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch