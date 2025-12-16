import { screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Dashboard from './Dashboard';
import { renderWithTheme } from '../components/modern/testing/testUtils';
import authSlice from '../store/slices/authSlice';

// Mock all API hooks
vi.mock('../services/api', () => ({
  useGetDashboardDataQuery: vi.fn(() => ({
    data: {
      productionOrders: 24,
      salesOrders: 18,
      lowStockItems: 7,
      qcInspections: 12,
      serviceRequests: 9,
      activeEmployees: 156,
    },
    isLoading: false,
    error: null,
  })),
  useGetFinanceDashboardQuery: vi.fn(() => ({
    data: {
      revenue: 12400000,
      profitMargin: 18.5,
      cashFlow: 3200000,
      expenses: 9800000,
    },
    isLoading: false,
    error: null,
  })),
  useGetBIDashboardQuery: vi.fn(() => ({
    data: {
      trends: [],
      metrics: [],
    },
    isLoading: false,
    error: null,
  })),
  useGetAlertsQuery: vi.fn(() => ({
    data: [
      { id: 1, type: 'warning', message: 'Low inventory alert', time: '2 min ago' },
      { id: 2, type: 'error', message: 'Maintenance overdue', time: '15 min ago' },
    ],
    isLoading: false,
    error: null,
  })),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: 'admin',
          permissions: ['read', 'write', 'admin'],
        },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

describe('Dashboard', () => {
  it('renders comprehensive dashboard with modern components', () => {
    const store = createMockStore();
    
    renderWithTheme(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Check if dashboard title is rendered
    expect(screen.getByText('Steel Manufacturing ERP Dashboard')).toBeInTheDocument();
    
    // Check if welcome message is rendered
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
    
    // Check if core KPI cards are rendered
    expect(screen.getByText('Production Orders')).toBeInTheDocument();
    expect(screen.getByText('Sales Orders')).toBeInTheDocument();
    expect(screen.getByText('Inventory Items')).toBeInTheDocument();
    expect(screen.getByText('QC Inspections')).toBeInTheDocument();
    expect(screen.getByText('Service Requests')).toBeInTheDocument();
    expect(screen.getByText('Active Employees')).toBeInTheDocument();
    
    // Check if sections are rendered
    expect(screen.getByText('Financial Metrics')).toBeInTheDocument();
    expect(screen.getByText('Operational Metrics')).toBeInTheDocument();
    expect(screen.getByText('Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
    expect(screen.getByText('System Alerts')).toBeInTheDocument();
  });

  it('renders dashboard sections correctly', () => {
    const store = createMockStore();
    
    renderWithTheme(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Check if all main sections are present
    expect(screen.getByTestId('dashboard-kpi-grid')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-charts-grid')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activities-table')).toBeInTheDocument();
  });

  it('renders financial and operational metrics', () => {
    const store = createMockStore();
    
    renderWithTheme(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Check if financial metrics are rendered
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Profit Margin')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    
    // Check if operational metrics are rendered
    expect(screen.getByText('Production Efficiency')).toBeInTheDocument();
    expect(screen.getByText('Quality Score')).toBeInTheDocument();
    expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
    expect(screen.getByText('Equipment Uptime')).toBeInTheDocument();
  });

  it('displays system status and alerts', () => {
    const store = createMockStore();
    
    renderWithTheme(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );

    // Check system status indicators
    expect(screen.getByText('System Online')).toBeInTheDocument();
    expect(screen.getByText('2 Alerts')).toBeInTheDocument();
  });
});