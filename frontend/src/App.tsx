import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from './store/store';
import { useGetCurrentUserQuery } from './services/api';
import { setUser } from './store/slices/authSlice';

// Components
import LoginForm from './components/auth/LoginForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  
  // Fetch current user if we have a token but no user data
  const { data: currentUser, isLoading } = useGetCurrentUserQuery(undefined, {
    skip: !token || !!user,
  });

  useEffect(() => {
    if (currentUser && !user) {
      dispatch(setUser(currentUser));
    }
  }, [currentUser, user, dispatch]);

  // Show loading while checking authentication
  if (isLoading && token && !user) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
        }
      />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Manufacturing routes */}
        <Route path="manufacturing" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ManufacturingDashboard')))}
          </React.Suspense>
        } />
        
        {/* Sales routes */}
        <Route path="sales" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/SalesOrderManagement')))}
          </React.Suspense>
        } />
        
        {/* Inventory routes */}
        <Route path="inventory" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/InventoryManagement')))}
          </React.Suspense>
        } />
        
        {/* Procurement routes */}
        <Route path="procurement" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Procurement/ProcurementManagement')))}
          </React.Suspense>
        } />
        
        {/* QC routes */}
        <Route path="qc" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/QC/QCManagement')))}
          </React.Suspense>
        } />
        
        {/* Service routes */}
        <Route path="service" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Service/ServiceManagement')))}
          </React.Suspense>
        } />
        
        {/* HR routes */}
        <Route path="hr" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/HR/HRDashboard')))}
          </React.Suspense>
        } />
        <Route path="hr/employees" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/HR/EmployeeManagement')))}
          </React.Suspense>
        } />
        
        {/* Finance routes */}
        <Route path="finance" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/FinanceDashboard')))}
          </React.Suspense>
        } />
        <Route path="finance/invoices" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/InvoiceManagement')))}
          </React.Suspense>
        } />
        
        {/* BI routes */}
        <Route path="bi" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/BI/BIDashboard')))}
          </React.Suspense>
        } />
        <Route path="bi/dashboards" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/BI/BIDashboard')))}
          </React.Suspense>
        } />
        
        {/* Field Operations routes */}
        <Route path="field/geo-tagging" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/FieldOperations/GeoTagging')))}
          </React.Suspense>
        } />
        
        {/* Alerts routes */}
        <Route path="alerts" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Alerts/AlertManagement')))}
          </React.Suspense>
        } />
        
        {/* Admin routes */}
        <Route path="admin/users" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Admin/UserManagement')))}
          </React.Suspense>
        } />
        
        {/* Settings and profile routes */}
        <Route path="settings" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Admin/UserManagement')))}
          </React.Suspense>
        } />
        
        <Route path="profile" element={
          <Box sx={{ p: 2 }}>
            <h2>Profile</h2>
            <p>Profile page will be implemented in subsequent tasks.</p>
          </Box>
        } />
      </Route>
      
      {/* Error routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;