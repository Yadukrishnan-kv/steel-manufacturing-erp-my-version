import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { configureStore } from '@reduxjs/toolkit'
import App from './App'
import authReducer from './store/slices/authSlice'
import ordersReducer from './store/slices/ordersSlice'
import serviceRequestsReducer from './store/slices/serviceRequestsSlice'
import documentsReducer from './store/slices/documentsSlice'
import feedbackReducer from './store/slices/feedbackSlice'

const theme = createTheme()

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      orders: ordersReducer,
      serviceRequests: serviceRequestsReducer,
      documents: documentsReducer,
      feedback: feedbackReducer,
    },
    preloadedState: initialState,
  })
}

const renderWithProviders = (ui: React.ReactElement, { initialState = {} } = {}) => {
  const store = createTestStore(initialState)
  
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

describe('App', () => {
  it('renders login page when not authenticated', () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: {
          customer: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
      },
    })
    
    expect(screen.getByText('Steel ERP')).toBeInTheDocument()
    expect(screen.getByText('Customer Portal')).toBeInTheDocument()
  })

  it('redirects to dashboard when authenticated', () => {
    renderWithProviders(<App />, {
      initialState: {
        auth: {
          customer: {
            id: '1',
            code: 'CUST000001',
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '9876543210',
          },
          accessToken: 'test-token',
          refreshToken: 'test-refresh-token',
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      },
    })
    
    // Should redirect to dashboard, so we should see dashboard content
    expect(screen.getByText('Welcome back, Test Customer!')).toBeInTheDocument()
  })
})