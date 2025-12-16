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
        
        {/* Manufacturing routes */}
        <Route path="manufacturing" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/ManufacturingDashboard')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/bom-management" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/BOMManagement')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/work-center-management" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/WorkCenterManagement')))}
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
        <Route path="manufacturing/calendar-view" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/CalendarView')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/engineering-changes" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/EngineeringChanges')))}
          </React.Suspense>
        } />
        <Route path="manufacturing/delivery-calculations" element={
          <Box sx={{ p: 2 }}>
            <h2>Delivery Date Calculations</h2>
            <p>Enhanced delivery date calculations with buffer days will be implemented.</p>
          </Box>
        } />
        <Route path="manufacturing/production-rescheduling" element={
          <Box sx={{ p: 2 }}>
            <h2>Production Order Rescheduling</h2>
            <p>Capacity-based rescheduling will be implemented.</p>
          </Box>
        } />
        <Route path="manufacturing/machine-schedule" element={
          <Box sx={{ p: 2 }}>
            <h2>Machine Schedule</h2>
            <p>Work center utilization and scheduling will be implemented.</p>
          </Box>
        } />
        <Route path="manufacturing/overtime-calculations" element={
          <Box sx={{ p: 2 }}>
            <h2>Overtime Calculations</h2>
            <p>Production overtime tracking will be implemented.</p>
          </Box>
        } />
        <Route path="manufacturing/create-order" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Manufacturing/CreateProductionOrder')))}
          </React.Suspense>
        } />
        
        {/* Sales routes */}
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
          <Box sx={{ p: 2 }}>
            <h2>Customer Management</h2>
            <p>Full CRUD operations for customers will be implemented.</p>
          </Box>
        } />
        <Route path="sales/site-measurements" element={
          <Box sx={{ p: 2 }}>
            <h2>Site Measurements</h2>
            <p>Geo-tagged measurement capture with photos will be implemented.</p>
          </Box>
        } />
        <Route path="sales/discount-approval" element={
          <Box sx={{ p: 2 }}>
            <h2>Discount Approval Workflow</h2>
            <p>Multi-level discount approval routing will be implemented.</p>
          </Box>
        } />
        <Route path="sales/analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>Sales Analytics</h2>
            <p>Performance metrics and reporting will be implemented.</p>
          </Box>
        } />
        
        {/* Inventory routes */}
        <Route path="inventory" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Inventory/InventoryManagement')))}
          </React.Suspense>
        } />
        <Route path="inventory/multi-warehouse" element={
          <Box sx={{ p: 2 }}>
            <h2>Multi-warehouse Management</h2>
            <p>Warehouse-specific inventory operations will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/rack-bin-location" element={
          <Box sx={{ p: 2 }}>
            <h2>Rack/Bin Location Management</h2>
            <p>Location assignment and tracking will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/batch-lot-tracking" element={
          <Box sx={{ p: 2 }}>
            <h2>Batch/Lot Tracking</h2>
            <p>Batch creation, expiry management will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/stock-transactions" element={
          <Box sx={{ p: 2 }}>
            <h2>Stock Transactions</h2>
            <p>Detailed transaction recording (IN/OUT/TRANSFER/ADJUSTMENT) will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/safety-stock" element={
          <Box sx={{ p: 2 }}>
            <h2>Safety Stock Monitoring</h2>
            <p>Low stock alerts and reorder point management will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/material-allocation" element={
          <Box sx={{ p: 2 }}>
            <h2>Order-wise Material Allocation</h2>
            <p>Material reservation and allocation will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/inter-branch-transfers" element={
          <Box sx={{ p: 2 }}>
            <h2>Inter-branch Stock Transfers</h2>
            <p>Transfer management between branches will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/inventory-valuation" element={
          <Box sx={{ p: 2 }}>
            <h2>Inventory Valuation</h2>
            <p>FIFO/LIFO/Weighted Average calculations will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/cycle-counting" element={
          <Box sx={{ p: 2 }}>
            <h2>Cycle Counting</h2>
            <p>Physical inventory counting will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/goods-receipt" element={
          <Box sx={{ p: 2 }}>
            <h2>Goods Receipt Processing</h2>
            <p>GRN processing with QC integration will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/put-away" element={
          <Box sx={{ p: 2 }}>
            <h2>Put-away Management</h2>
            <p>Warehouse put-away operations will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/stock-inquiry" element={
          <Box sx={{ p: 2 }}>
            <h2>Stock Inquiry and Reporting</h2>
            <p>Advanced stock reporting will be implemented.</p>
          </Box>
        } />
        <Route path="inventory/aging-reports" element={
          <Box sx={{ p: 2 }}>
            <h2>Inventory Aging Reports</h2>
            <p>Stock aging analysis will be implemented.</p>
          </Box>
        } />
        
        {/* Procurement routes */}
        <Route path="procurement" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Procurement/ProcurementManagement')))}
          </React.Suspense>
        } />
        <Route path="procurement/purchase-requisition" element={
          <Box sx={{ p: 2 }}>
            <h2>Purchase Requisition Management</h2>
            <p>Create, approve, reject PRs will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/automatic-pr" element={
          <Box sx={{ p: 2 }}>
            <h2>Automatic PR Generation</h2>
            <p>Auto-generate PRs for stock-out items will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/rfq-management" element={
          <Box sx={{ p: 2 }}>
            <h2>RFQ Management</h2>
            <p>Create RFQs, manage responses, comparison will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/supplier-evaluation" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Evaluation</h2>
            <p>Performance tracking and rating will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/purchase-order" element={
          <Box sx={{ p: 2 }}>
            <h2>Purchase Order Management</h2>
            <p>Full PO lifecycle management will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/grn-processing" element={
          <Box sx={{ p: 2 }}>
            <h2>GRN Processing</h2>
            <p>Goods receipt with QC status updates will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/transfer-requests" element={
          <Box sx={{ p: 2 }}>
            <h2>Inter-branch Transfer Requests</h2>
            <p>Transfer request management will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/procurement-dashboard" element={
          <Box sx={{ p: 2 }}>
            <h2>Procurement Dashboard</h2>
            <p>Analytics and KPIs will be implemented.</p>
          </Box>
        } />
        <Route path="procurement/supplier-performance" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Performance Reports</h2>
            <p>Delivery, quality, pricing metrics will be implemented.</p>
          </Box>
        } />
        
        {/* QC routes */}
        <Route path="qc" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/QC/QCManagement')))}
          </React.Suspense>
        } />
        <Route path="qc/qc-checklists" element={
          <Box sx={{ p: 2 }}>
            <h2>Stage-specific QC Checklists</h2>
            <p>Different checklists for each production stage will be implemented.</p>
          </Box>
        } />
        <Route path="qc/inspector-assignment" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Inspector Assignment</h2>
            <p>Assign inspectors to inspections will be implemented.</p>
          </Box>
        } />
        <Route path="qc/inspection-recording" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Inspection Recording</h2>
            <p>Record inspection results with photos will be implemented.</p>
          </Box>
        } />
        <Route path="qc/rework-job-cards" element={
          <Box sx={{ p: 2 }}>
            <h2>Rework Job Card Generation</h2>
            <p>Generate rework orders for failed QC will be implemented.</p>
          </Box>
        } />
        <Route path="qc/qc-analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Analytics</h2>
            <p>Quality trend analysis and reporting will be implemented.</p>
          </Box>
        } />
        <Route path="qc/qc-reports" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Report Generation</h2>
            <p>Detailed inspection reports will be implemented.</p>
          </Box>
        } />
        <Route path="qc/qc-delivery-linking" element={
          <Box sx={{ p: 2 }}>
            <h2>QC-Delivery Linking</h2>
            <p>Link QC reports to delivery documentation will be implemented.</p>
          </Box>
        } />
        <Route path="qc/inspector-workload" element={
          <Box sx={{ p: 2 }}>
            <h2>Inspector Workload Management</h2>
            <p>Track inspector performance will be implemented.</p>
          </Box>
        } />
        <Route path="qc/production-qc-status" element={
          <Box sx={{ p: 2 }}>
            <h2>Production Order QC Status</h2>
            <p>Overall QC status for production orders will be implemented.</p>
          </Box>
        } />
        <Route path="qc/customer-requirements" element={
          <Box sx={{ p: 2 }}>
            <h2>Customer Requirements Integration</h2>
            <p>Embed customer-specific requirements will be implemented.</p>
          </Box>
        } />
        <Route path="qc/qc-certificates" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Certificate Generation</h2>
            <p>Generate quality certificates will be implemented.</p>
          </Box>
        } />
        <Route path="qc/customer-approval" element={
          <Box sx={{ p: 2 }}>
            <h2>Customer Approval Workflows</h2>
            <p>QC certificate approval by customers will be implemented.</p>
          </Box>
        } />
        <Route path="qc/qc-dashboard" element={
          <Box sx={{ p: 2 }}>
            <h2>QC Dashboard</h2>
            <p>Real-time QC monitoring will be implemented.</p>
          </Box>
        } />
        <Route path="qc/production-integration" element={
          <Box sx={{ p: 2 }}>
            <h2>Production Integration</h2>
            <p>QC integration with production workflow will be implemented.</p>
          </Box>
        } />
        
        {/* Service routes */}
        <Route path="service" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Service/ServiceManagement')))}
          </React.Suspense>
        } />
        <Route path="service/technician-assignment" element={
          <Box sx={{ p: 2 }}>
            <h2>Technician Assignment</h2>
            <p>Automatic assignment based on location/expertise will be implemented.</p>
          </Box>
        } />
        <Route path="service/amc-contracts" element={
          <Box sx={{ p: 2 }}>
            <h2>AMC Contract Management</h2>
            <p>Create and manage AMC contracts will be implemented.</p>
          </Box>
        } />
        <Route path="service/warranty-validation" element={
          <Box sx={{ p: 2 }}>
            <h2>Warranty Validation</h2>
            <p>Warranty tracking and validation will be implemented.</p>
          </Box>
        } />
        <Route path="service/installation-scheduling" element={
          <Box sx={{ p: 2 }}>
            <h2>Installation Scheduling</h2>
            <p>Schedule installations with geo-tagging will be implemented.</p>
          </Box>
        } />
        <Route path="service/rma-management" element={
          <Box sx={{ p: 2 }}>
            <h2>RMA Management</h2>
            <p>Return merchandise authorization workflow will be implemented.</p>
          </Box>
        } />
        <Route path="service/service-completion" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Completion</h2>
            <p>Complete services with parts/labor tracking will be implemented.</p>
          </Box>
        } />
        <Route path="service/performance-metrics" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Performance Metrics</h2>
            <p>Technician evaluation and analytics will be implemented.</p>
          </Box>
        } />
        <Route path="service/cost-breakdown" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Cost Breakdown</h2>
            <p>Detailed costing analysis will be implemented.</p>
          </Box>
        } />
        <Route path="service/invoice-generation" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Invoice Generation</h2>
            <p>Generate service invoices will be implemented.</p>
          </Box>
        } />
        <Route path="service/mobile-integration" element={
          <Box sx={{ p: 2 }}>
            <h2>Mobile App Integration</h2>
            <p>Sync data for mobile technicians will be implemented.</p>
          </Box>
        } />
        <Route path="service/parts-inventory" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Parts Inventory</h2>
            <p>Parts inventory management will be implemented.</p>
          </Box>
        } />
        <Route path="service/service-analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>Service Analytics</h2>
            <p>Comprehensive service reporting will be implemented.</p>
          </Box>
        } />
        
        {/* HR routes */}
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
            <p>Process biometric attendance data will be implemented.</p>
          </Box>
        } />
        <Route path="hr/geo-attendance" element={
          <Box sx={{ p: 2 }}>
            <h2>Geo-tagged Attendance</h2>
            <p>Location-based attendance tracking will be implemented.</p>
          </Box>
        } />
        <Route path="hr/attendance-reports" element={
          <Box sx={{ p: 2 }}>
            <h2>Attendance Reports</h2>
            <p>Detailed attendance analysis will be implemented.</p>
          </Box>
        } />
        <Route path="hr/overtime-calculations" element={
          <Box sx={{ p: 2 }}>
            <h2>Overtime Calculations</h2>
            <p>Automatic overtime calculations will be implemented.</p>
          </Box>
        } />
        <Route path="hr/payroll-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Payroll Management</h2>
            <p>Calculate and process payroll will be implemented.</p>
          </Box>
        } />
        <Route path="hr/kpi-management" element={
          <Box sx={{ p: 2 }}>
            <h2>KPI Management</h2>
            <p>Record and track employee KPIs will be implemented.</p>
          </Box>
        } />
        <Route path="hr/leave-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Leave Management</h2>
            <p>Submit, approve, track leave requests will be implemented.</p>
          </Box>
        } />
        <Route path="hr/leave-balance" element={
          <Box sx={{ p: 2 }}>
            <h2>Leave Balance Tracking</h2>
            <p>Track leave balances by type will be implemented.</p>
          </Box>
        } />
        <Route path="hr/performance-reviews" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Reviews</h2>
            <p>Create and manage performance reviews will be implemented.</p>
          </Box>
        } />
        <Route path="hr/self-assessment" element={
          <Box sx={{ p: 2 }}>
            <h2>Self-assessment</h2>
            <p>Employee self-assessment functionality will be implemented.</p>
          </Box>
        } />
        <Route path="hr/appraisal-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Appraisal Management</h2>
            <p>Detailed appraisal workflows will be implemented.</p>
          </Box>
        } />
        <Route path="hr/promotion-processing" element={
          <Box sx={{ p: 2 }}>
            <h2>Promotion Processing</h2>
            <p>Handle employee promotions will be implemented.</p>
          </Box>
        } />
        <Route path="hr/incentive-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Incentive Management</h2>
            <p>Award and track incentives will be implemented.</p>
          </Box>
        } />
        <Route path="hr/organizational-hierarchy" element={
          <Box sx={{ p: 2 }}>
            <h2>Organizational Hierarchy</h2>
            <p>Manage reporting structures will be implemented.</p>
          </Box>
        } />
        <Route path="hr/training-programs" element={
          <Box sx={{ p: 2 }}>
            <h2>Training Programs</h2>
            <p>Create and manage training programs will be implemented.</p>
          </Box>
        } />
        <Route path="hr/training-enrollments" element={
          <Box sx={{ p: 2 }}>
            <h2>Training Enrollments</h2>
            <p>Enroll employees in training will be implemented.</p>
          </Box>
        } />
        <Route path="hr/performance-analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Analytics</h2>
            <p>HR analytics and reporting will be implemented.</p>
          </Box>
        } />
        
        {/* Employee Portal routes */}
        <Route path="employee-portal/employee-dashboard" element={
          <Box sx={{ p: 2 }}>
            <h2>Employee Dashboard</h2>
            <p>Self-service employee dashboard will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/profile-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Profile Management</h2>
            <p>Update personal information will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/attendance-tracking" element={
          <Box sx={{ p: 2 }}>
            <h2>Attendance Tracking</h2>
            <p>View attendance records will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/leave-requests" element={
          <Box sx={{ p: 2 }}>
            <h2>Leave Requests</h2>
            <p>Submit and track leave requests will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/payroll-access" element={
          <Box sx={{ p: 2 }}>
            <h2>Payroll Access</h2>
            <p>View salary slips and payroll records will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/performance-reviews" element={
          <Box sx={{ p: 2 }}>
            <h2>Performance Reviews</h2>
            <p>Participate in performance reviews will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/training-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Training Management</h2>
            <p>View and enroll in training programs will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/employee-directory" element={
          <Box sx={{ p: 2 }}>
            <h2>Employee Directory</h2>
            <p>Company directory access will be implemented.</p>
          </Box>
        } />
        <Route path="employee-portal/document-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Document Management</h2>
            <p>Upload and manage personal documents will be implemented.</p>
          </Box>
        } />
        
        {/* Finance routes */}
        <Route path="finance" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/FinanceDashboard')))}
          </React.Suspense>
        } />
        <Route path="finance/accounts-receivable" element={
          <Box sx={{ p: 2 }}>
            <h2>Accounts Receivable</h2>
            <p>Customer payment tracking will be implemented.</p>
          </Box>
        } />
        <Route path="finance/accounts-payable" element={
          <Box sx={{ p: 2 }}>
            <h2>Accounts Payable</h2>
            <p>Supplier payment management will be implemented.</p>
          </Box>
        } />
        <Route path="finance/tax-calculations" element={
          <Box sx={{ p: 2 }}>
            <h2>Tax Calculations</h2>
            <p>GST, TDS, statutory tax calculations will be implemented.</p>
          </Box>
        } />
        <Route path="finance/pl-reporting" element={
          <Box sx={{ p: 2 }}>
            <h2>P&L Reporting</h2>
            <p>Branch-wise and consolidated P&L will be implemented.</p>
          </Box>
        } />
        <Route path="finance/cash-flow-forecasting" element={
          <Box sx={{ p: 2 }}>
            <h2>Cash Flow Forecasting</h2>
            <p>Financial forecasting and analytics will be implemented.</p>
          </Box>
        } />
        <Route path="finance/manufacturing-cost-analysis" element={
          <Box sx={{ p: 2 }}>
            <h2>Manufacturing Cost Analysis</h2>
            <p>Standard vs actual cost analysis will be implemented.</p>
          </Box>
        } />
        <Route path="finance/credit-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Credit Management</h2>
            <p>Customer credit tracking will be implemented.</p>
          </Box>
        } />
        <Route path="finance/bank-reconciliation" element={
          <Box sx={{ p: 2 }}>
            <h2>Bank Reconciliation</h2>
            <p>Payment reconciliation workflows will be implemented.</p>
          </Box>
        } />
        <Route path="finance/collection-analysis" element={
          <Box sx={{ p: 2 }}>
            <h2>Collection Analysis</h2>
            <p>Aging analysis and collection management will be implemented.</p>
          </Box>
        } />
        <Route path="finance/invoices" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Finance/InvoiceManagement')))}
          </React.Suspense>
        } />
        
        {/* Supplier Management routes */}
        <Route path="supplier/supplier-master" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Master Data</h2>
            <p>Full supplier CRUD operations will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/vendor-performance" element={
          <Box sx={{ p: 2 }}>
            <h2>Vendor Performance Tracking</h2>
            <p>Performance metrics and ratings will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/quote-comparison" element={
          <Box sx={{ p: 2 }}>
            <h2>Quote Comparison</h2>
            <p>RFQ response comparison will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/payment-terms" element={
          <Box sx={{ p: 2 }}>
            <h2>Payment Terms Management</h2>
            <p>Credit and payment term management will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/communication-logging" element={
          <Box sx={{ p: 2 }}>
            <h2>Communication Logging</h2>
            <p>Track supplier communications will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/document-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Document Management</h2>
            <p>Supplier document uploads will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/vendor-portal" element={
          <Box sx={{ p: 2 }}>
            <h2>Vendor Portal Integration</h2>
            <p>Portal access management will be implemented.</p>
          </Box>
        } />
        <Route path="supplier/supplier-reports" element={
          <Box sx={{ p: 2 }}>
            <h2>Supplier Reports</h2>
            <p>Performance and compliance reporting will be implemented.</p>
          </Box>
        } />

        {/* Alert Management routes */}
        <Route path="alerts" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/Alerts/AlertManagement')))}
          </React.Suspense>
        } />
        <Route path="alerts/sla-configuration" element={
          <Box sx={{ p: 2 }}>
            <h2>SLA Configuration</h2>
            <p>Configure SLA rules and escalations will be implemented.</p>
          </Box>
        } />
        <Route path="alerts/alert-creation" element={
          <Box sx={{ p: 2 }}>
            <h2>Alert Creation</h2>
            <p>Create custom alerts will be implemented.</p>
          </Box>
        } />
        <Route path="alerts/notification-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Notification Management</h2>
            <p>Send alerts via multiple channels will be implemented.</p>
          </Box>
        } />
        <Route path="alerts/escalation-processing" element={
          <Box sx={{ p: 2 }}>
            <h2>Escalation Processing</h2>
            <p>Automatic escalation workflows will be implemented.</p>
          </Box>
        } />
        <Route path="alerts/reminder-generation" element={
          <Box sx={{ p: 2 }}>
            <h2>Reminder Generation</h2>
            <p>Automatic reminder system will be implemented.</p>
          </Box>
        } />
        <Route path="alerts/sla-performance" element={
          <Box sx={{ p: 2 }}>
            <h2>SLA Performance Metrics</h2>
            <p>Track SLA compliance will be implemented.</p>
          </Box>
        } />

        {/* BI routes */}
        <Route path="bi" element={
          <React.Suspense fallback={<CircularProgress />}>
            {React.createElement(React.lazy(() => import('./pages/BI/BIDashboard')))}
          </React.Suspense>
        } />
        <Route path="bi/role-dashboards" element={
          <Box sx={{ p: 2 }}>
            <h2>Role-based Dashboards</h2>
            <p>Specific dashboards for each role will be implemented.</p>
          </Box>
        } />
        <Route path="bi/trend-analysis" element={
          <Box sx={{ p: 2 }}>
            <h2>Trend Analysis</h2>
            <p>Advanced trend analysis and forecasting will be implemented.</p>
          </Box>
        } />
        <Route path="bi/drill-down-reporting" element={
          <Box sx={{ p: 2 }}>
            <h2>Drill-down Reporting</h2>
            <p>Power BI-style drill-down functionality will be implemented.</p>
          </Box>
        } />
        <Route path="bi/real-time-updates" element={
          <Box sx={{ p: 2 }}>
            <h2>Real-time Data Updates</h2>
            <p>Live dashboard updates will be implemented.</p>
          </Box>
        } />
        <Route path="bi/custom-report-builder" element={
          <Box sx={{ p: 2 }}>
            <h2>Custom Report Builder</h2>
            <p>Build custom reports will be implemented.</p>
          </Box>
        } />
        <Route path="bi/executive-dashboards" element={
          <Box sx={{ p: 2 }}>
            <h2>Executive Dashboards</h2>
            <p>High-level KPI monitoring will be implemented.</p>
          </Box>
        } />
        <Route path="bi/advanced-analytics" element={
          <Box sx={{ p: 2 }}>
            <h2>Advanced Analytics</h2>
            <p>Complex analytical capabilities will be implemented.</p>
          </Box>
        } />
        <Route path="bi/data-export" element={
          <Box sx={{ p: 2 }}>
            <h2>Data Export</h2>
            <p>Export dashboard data in various formats will be implemented.</p>
          </Box>
        } />

        {/* External Integrations routes */}
        <Route path="integrations/meta-lead-sync" element={
          <Box sx={{ p: 2 }}>
            <h2>Meta/Facebook Lead Sync</h2>
            <p>Sync leads from Meta platforms will be implemented.</p>
          </Box>
        } />
        <Route path="integrations/google-ads" element={
          <Box sx={{ p: 2 }}>
            <h2>Google Ads Integration</h2>
            <p>Sync Google Ads leads will be implemented.</p>
          </Box>
        } />
        <Route path="integrations/whatsapp-notifications" element={
          <Box sx={{ p: 2 }}>
            <h2>WhatsApp Notifications</h2>
            <p>Send customer notifications via WhatsApp will be implemented.</p>
          </Box>
        } />
        <Route path="integrations/communication-management" element={
          <Box sx={{ p: 2 }}>
            <h2>Communication Management</h2>
            <p>Multi-channel communication tracking will be implemented.</p>
          </Box>
        } />
        <Route path="integrations/lead-scoring" element={
          <Box sx={{ p: 2 }}>
            <h2>Lead Scoring</h2>
            <p>Automatic lead qualification will be implemented.</p>
          </Box>
        } />
        <Route path="integrations/integration-statistics" element={
          <Box sx={{ p: 2 }}>
            <h2>Integration Statistics</h2>
            <p>Monitor integration performance will be implemented.</p>
          </Box>
        } />
        
        {/* Admin routes */}
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
            <p>Role and permission management will be implemented.</p>
          </Box>
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