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
  }, [currentUser?.id, user?.id, dispatch]);

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
        
        {/* Manufacturing routes - Backend APIs Available */}
        <Route path="manufacturing" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ManufacturingDashboard')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/production-orders" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ProductionOrderManagement')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/production-orders/:id" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ProductionOrderDetail')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/create-order" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/CreateProductionOrder')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/bom-management" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/BOMManagement')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/bom/:id" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/BOMDetail')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/create-bom" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/CreateBOM')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/work-center-management" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/WorkCenterManagement')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/work-centers/:id" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/WorkCenterDetail')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/create-work-center" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/CreateWorkCenter')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/material-consumption" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/MaterialConsumption')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/scrap-tracking" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ScrapTracking')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/gantt-chart" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/GanttChart')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/engineering-changes" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/EngineeringChanges')))}
          </React.Suspense>
        } />
        
        {/* Sales routes - Backend APIs Available */}
        <Route path="sales" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/SalesDashboard')))}
          </React.Suspense>
        } />
        <Route path="sales/dashboard" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/SalesDashboard')))}
          </React.Suspense>
        } />
        <Route path="sales/lead-management" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/LeadManagement')))}
          </React.Suspense>
        } />
        <Route path="sales/estimates" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/EstimateManagement')))}
          </React.Suspense>
        } />
        <Route path="sales/orders" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/SalesOrderManagement')))}
          </React.Suspense>
        } />
        <Route path="sales/customers" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/CustomerManagement')))}
          </React.Suspense>
        } />
        <Route path="sales/customers/:id" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Sales/CustomerDetail')))}
          </React.Suspense>
        } />
        <Route path="sales/site-measurements" element={
          <Box sx={{ p: 2 }}>
            <h2>Site Measurements</h2>
            <p>Geo-tagged measurement capture - Backend API Available</p>
          </Box>
        } />
        <Route path="sales/discount-approval" element={
          <Box sx={{ p: 2 }}>
            <h2>Discount Approval Workflow</h2>
            <p>Multi-level discount approval routing - Backend API Available</p>
          </Box>
        } />
        <Route path="sales/analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>Sales Analytics</h2>
            <p>Performance metrics and reporting - Backend API Available</p>
          </Box>
        } />
        
        {/* Inventory routes - Backend APIs Available */}
        <Route path="inventory" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/InventoryManagement')))}
          </React.Suspense>
        } />
        <Route path="inventory/items" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/InventoryItems')))}
          </React.Suspense>
        } />
        <Route path="inventory/stock-levels" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/StockLevels')))}
          </React.Suspense>
        } />
        <Route path="inventory/stock-transactions" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/StockTransactions')))}
          </React.Suspense>
        } />
        <Route path="inventory/batch-tracking" element={
          <Box sx={{ p: 2 }}>
            <h2>Batch/Lot Tracking</h2>
            <p>Batch and lot management - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/location-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Location Management</h2>
            <p>Rack/bin location management - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/barcode-scanning" element={
          <Box sx={{ p: 2 }}>
            <h2>Barcode Scanning</h2>
            <p>Barcode/QR code operations - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/safety-stock" element={
          <Box sx={{ p: 2 }}>
            <h2>Safety Stock Alerts</h2>
            <p>Low stock monitoring - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/material-allocation" element={
          <Box sx={{ p: 2 }}>
            <h2>Material Allocation</h2>
            <p>Order-wise material allocation - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/inter-branch-transfers" element={
          <Box sx={{ p: 2 }}>
            <h2>Inter-branch Transfers</h2>
            <p>Stock transfers between branches - Backend API Available</p>
          </Box>
        } />
        <Route path="inventory/inventory-valuation" element={
          <Box sx={{ p: 2 }}>
            <h2>Inventory Valuation</h2>
            <p>FIFO/LIFO/Weighted Average - Backend API Available</p>
          </Box>
        } />
        
        {/* Procurement routes - Backend APIs Available */}
        <Route path="procurement" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Procurement/ProcurementManagement')))}
          </React.Suspense>
        } />
        <Route path="procurement/purchase-requisitions" element={
          <Box sx={{ p: 2 }}>
            <h2>Purchase Requisitions</h2>
            <p>PR management and approval - Backend API Available</p>
          </Box>
        } />
        <Route path="procurement/rfq-management" element={
          <Box sx={{ p: 2 }}>
            <h2>RFQ Management</h2>
            <p>Request for quotation processing - Backend API Available</p>
          </Box>
        } />
        <Route path="procurement/purchase-orders" element={
          <Box sx={{ p: 2 }}>
            <h2>Purchase Orders</h2>
            <p>PO lifecycle management - Backend API Available</p>
          </Box>
        } />
        <Route path="procurement/supplier-evaluation" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Evaluation</h2>
            <p>Supplier performance tracking - Backend API Available</p>
          </Box>
        } />
        <Route path="procurement/grn-processing" element={
          <Box sx={{ p: 2 }}>
            <h2>GRN Processing</h2>
            <p>Goods receipt processing - Backend API Available</p>
          </Box>
        } />
        
        {/* QC routes - Backend APIs Available */}
        <Route path="qc" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/QC/QCManagement')))}
          </React.Suspense>
        } />
        <Route path="qc/inspections" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Inspections</h2>
            <p>Quality control inspections - Backend API Available</p>
          </Box>
        } />
        <Route path="qc/checklists" element={
          <Box sx={{ p: 2 }}>
            <h2>Inspection Checklists</h2>
            <p>Stage-specific QC checklists - Backend API Available</p>
          </Box>
        } />
        <Route path="qc/rework-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Rework Management</h2>
            <p>Rework job card generation - Backend API Available</p>
          </Box>
        } />
        <Route path="qc/reports" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Reports</h2>
            <p>Quality control reporting - Backend API Available</p>
          </Box>
        } />
        
        {/* Service routes - Backend APIs Available */}
        <Route path="service" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Service/ServiceManagement')))}
          </React.Suspense>
        } />
        <Route path="service/requests" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Requests</h2>
            <p>Service request management - Backend API Available</p>
          </Box>
        } />
        <Route path="service/technician-assignment" element={
          <Box sx={{ p: 2 }}>
            <h2>Technician Assignment</h2>
            <p>Auto-assign technicians - Backend API Available</p>
          </Box>
        } />
        <Route path="service/amc-contracts" element={
          <Box sx={{ p: 2 }}>
            <h2>AMC Contracts</h2>
            <p>AMC contract management - Backend API Available</p>
          </Box>
        } />
        <Route path="service/warranty-validation" element={
          <Box sx={{ p: 2 }}>
            <h2>Warranty Validation</h2>
            <p>Warranty tracking and validation - Backend API Available</p>
          </Box>
        } />
        <Route path="service/installation-scheduling" element={
          <Box sx={{ p: 2 }}>
            <h2>Installation Scheduling</h2>
            <p>Schedule installations - Backend API Available</p>
          </Box>
        } />
        <Route path="service/rma-management" element={
          <Box sx={{ p: 2 }}>
            <h2>RMA Management</h2>
            <p>Return merchandise authorization - Backend API Available</p>
          </Box>
        } />
        <Route path="service/service-completion" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Completion</h2>
            <p>Complete services with costing - Backend API Available</p>
          </Box>
        } />
        <Route path="service/performance-metrics" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Metrics</h2>
            <p>Service performance analytics - Backend API Available</p>
          </Box>
        } />
        <Route path="service/cost-breakdown" element={
          <Box sx={{ p: 2 }}>
            <h2>Cost Breakdown</h2>
            <p>Service cost analysis - Backend API Available</p>
          </Box>
        } />
        <Route path="service/mobile-sync" element={
          <Box sx={{ p: 2 }}>
            <h2>Mobile Sync</h2>
            <p>Mobile technician data sync - Backend API Available</p>
          </Box>
        } />
        
        {/* HR routes - Backend APIs Available */}
        <Route path="hr" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/HR/HRDashboard')))}
          </React.Suspense>
        } />
        <Route path="hr/employee-master" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/HR/EmployeeManagement')))}
          </React.Suspense>
        } />
        <Route path="hr/biometric-attendance" element={
          <Box sx={{ p: 2 }}>
            <h2>Biometric Attendance</h2>
            <p>Biometric attendance processing - Backend API Available</p>
          </Box>
        } />
        <Route path="hr/geo-attendance" element={
          <Box sx={{ p: 2 }}>
            <h2>Geo-tagged Attendance</h2>
            <p>Location-based attendance - Backend API Available</p>
          </Box>
        } />
        <Route path="hr/payroll-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Payroll Management</h2>
            <p>Payroll calculation and processing - Backend API Available</p>
          </Box>
        } />
        <Route path="hr/kpi-management" element={
          <Box sx={{ p: 2 }}>
            <h2>KPI Management</h2>
            <p>Employee KPI tracking - Backend API Available</p>
          </Box>
        } />
        <Route path="hr/leave-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Leave Management</h2>
            <p>Leave request processing - Backend API Available</p>
          </Box>
        } />
        <Route path="hr/performance-reviews" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Reviews</h2>
            <p>Employee performance reviews - Backend API Available</p>
          </Box>
        } />
        
        {/* Employee Portal routes - Backend APIs Available */}
        <Route path="employee-portal" element={
          <Box sx={{ p: 2 }}>
            <h2>Employee Portal</h2>
            <p>Employee self-service portal - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/dashboard" element={
          <Box sx={{ p: 2 }}>
            <h2>Employee Dashboard</h2>
            <p>Personal dashboard - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/profile" element={
          <Box sx={{ p: 2 }}>
            <h2>Profile Management</h2>
            <p>Personal information management - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/attendance" element={
          <Box sx={{ p: 2 }}>
            <h2>Attendance Tracking</h2>
            <p>View attendance records - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/leave-requests" element={
          <Box sx={{ p: 2 }}>
            <h2>Leave Requests</h2>
            <p>Submit and track leave requests - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/payroll" element={
          <Box sx={{ p: 2 }}>
            <h2>Payroll Access</h2>
            <p>View salary slips - Backend API Available</p>
          </Box>
        } />
        <Route path="employee-portal/performance" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Reviews</h2>
            <p>Performance review participation - Backend API Available</p>
          </Box>
        } />
        
        {/* Finance routes - Backend APIs Available */}
        <Route path="finance" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/FinanceDashboard')))}
          </React.Suspense>
        } />
        <Route path="finance/accounts-receivable" element={
          <Box sx={{ p: 2 }}>
            <h2>Accounts Receivable</h2>
            <p>Customer payment tracking - Backend API Available</p>
          </Box>
        } />
        <Route path="finance/invoices" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/InvoiceManagement')))}
          </React.Suspense>
        } />
        <Route path="finance/payments" element={
          <Box sx={{ p: 2 }}>
            <h2>Payment Management</h2>
            <p>Payment processing - Backend API Available</p>
          </Box>
        } />
        <Route path="finance/tax-calculations" element={
          <Box sx={{ p: 2 }}>
            <h2>Tax Calculations</h2>
            <p>GST, TDS calculations - Backend API Available</p>
          </Box>
        } />
        <Route path="finance/pl-reporting" element={
          <Box sx={{ p: 2 }}>
            <h2>P&L Reporting</h2>
            <p>Profit & Loss reports - Backend API Available</p>
          </Box>
        } />
        <Route path="finance/cash-flow-forecasting" element={
          <Box sx={{ p: 2 }}>
            <h2>Cash Flow Forecasting</h2>
            <p>Financial forecasting - Backend API Available</p>
          </Box>
        } />
        <Route path="finance/bank-reconciliation" element={
          <Box sx={{ p: 2 }}>
            <h2>Bank Reconciliation</h2>
            <p>Payment reconciliation - Backend API Available</p>
          </Box>
        } />
        
        {/* Supplier Management routes - Backend APIs Available */}
        <Route path="suppliers" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Management</h2>
            <p>Supplier management dashboard - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/master" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Master</h2>
            <p>Supplier master data - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/performance" element={
          <Box sx={{ p: 2 }}>
            <h2>Vendor Performance</h2>
            <p>Supplier performance tracking - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/quote-comparison" element={
          <Box sx={{ p: 2 }}>
            <h2>Quote Comparison</h2>
            <p>RFQ response comparison - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/payment-terms" element={
          <Box sx={{ p: 2 }}>
            <h2>Payment Terms</h2>
            <p>Payment terms management - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/communications" element={
          <Box sx={{ p: 2 }}>
            <h2>Communication Log</h2>
            <p>Supplier communication tracking - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/documents" element={
          <Box sx={{ p: 2 }}>
            <h2>Document Management</h2>
            <p>Supplier document management - Backend API Available</p>
          </Box>
        } />
        <Route path="suppliers/vendor-portal" element={
          <Box sx={{ p: 2 }}>
            <h2>Vendor Portal</h2>
            <p>Vendor portal integration - Backend API Available</p>
          </Box>
        } />
        
        {/* Alert Management routes - Backend APIs Available */}
        <Route path="alerts" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Alerts/AlertManagement')))}
          </React.Suspense>
        } />
        <Route path="alerts/sla-configuration" element={
          <Box sx={{ p: 2 }}>
            <h2>SLA Configuration</h2>
            <p>SLA rules and escalations - Backend API Available</p>
          </Box>
        } />
        <Route path="alerts/management" element={
          <Box sx={{ p: 2 }}>
            <h2>Alert Management</h2>
            <p>Alert creation and management - Backend API Available</p>
          </Box>
        } />
        <Route path="alerts/notifications" element={
          <Box sx={{ p: 2 }}>
            <h2>Notifications</h2>
            <p>Multi-channel notifications - Backend API Available</p>
          </Box>
        } />
        <Route path="alerts/escalation" element={
          <Box sx={{ p: 2 }}>
            <h2>Escalation Processing</h2>
            <p>Automatic escalation workflows - Backend API Available</p>
          </Box>
        } />
        
        {/* BI routes - Backend APIs Available */}
        <Route path="bi" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/BI/BIDashboard')))}
          </React.Suspense>
        } />
        <Route path="bi/dashboards" element={
          <Box sx={{ p: 2 }}>
            <h2>Role-based Dashboards</h2>
            <p>Dashboards for each role - Backend API Available</p>
          </Box>
        } />
        <Route path="bi/trends" element={
          <Box sx={{ p: 2 }}>
            <h2>Trend Analysis</h2>
            <p>Advanced trend analysis - Backend API Available</p>
          </Box>
        } />
        <Route path="bi/drill-down" element={
          <Box sx={{ p: 2 }}>
            <h2>Drill-down Reports</h2>
            <p>Power BI-style drill-down - Backend API Available</p>
          </Box>
        } />
        <Route path="bi/real-time" element={
          <Box sx={{ p: 2 }}>
            <h2>Real-time Data</h2>
            <p>Live dashboard updates - Backend API Available</p>
          </Box>
        } />
        <Route path="bi/custom-reports" element={
          <Box sx={{ p: 2 }}>
            <h2>Custom Reports</h2>
            <p>Custom report builder - Backend API Available</p>
          </Box>
        } />
        
        {/* External Integrations routes - Backend APIs Available */}
        <Route path="integrations/meta-sync" element={
          <Box sx={{ p: 2 }}>
            <h2>Meta Lead Sync</h2>
            <p>Sync leads from Meta platforms - Backend API Available</p>
          </Box>
        } />
        <Route path="integrations/google-ads" element={
          <Box sx={{ p: 2 }}>
            <h2>Google Ads Integration</h2>
            <p>Google Ads lead sync - Backend API Available</p>
          </Box>
        } />
        <Route path="integrations/whatsapp" element={
          <Box sx={{ p: 2 }}>
            <h2>WhatsApp Notifications</h2>
            <p>WhatsApp customer notifications - Backend API Available</p>
          </Box>
        } />
        <Route path="integrations/communications" element={
          <Box sx={{ p: 2 }}>
            <h2>Communication Management</h2>
            <p>Multi-channel communication - Backend API Available</p>
          </Box>
        } />
        <Route path="integrations/lead-scoring" element={
          <Box sx={{ p: 2 }}>
            <h2>Lead Scoring</h2>
            <p>Automatic lead qualification - Backend API Available</p>
          </Box>
        } />
        
        {/* Admin routes - Backend APIs Available */}
        <Route path="admin/branches" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Admin/BranchManagement')))}
          </React.Suspense>
        } />
        <Route path="admin/users" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Admin/UserManagement')))}
          </React.Suspense>
        } />
        <Route path="admin/roles" element={
          <Box sx={{ p: 2 }}>
            <h2>Roles & Permissions</h2>
            <p>Role and permission management - Backend API Available</p>
          </Box>
        } />
        
        {/* Settings and profile routes */}
        <Route path="settings" element={
          <Box sx={{ p: 2 }}>
            <h2>Settings</h2>
            <p>Application settings - Backend API Available</p>
          </Box>
        } />
        
        <Route path="profile" element={
          <Box sx={{ p: 2 }}>
            <h2>Profile</h2>
            <p>User profile management - Backend API Available</p>
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