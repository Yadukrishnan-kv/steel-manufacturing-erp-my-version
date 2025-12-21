import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import type { LoginCredentials, LoginResponse, User } from '../types/auth';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// API slice with RTK Query
export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'User',
    'ProductionOrder',
    'SalesOrder',
    'Lead',
    'Estimate',
    'Customer',
    'SalesAnalytics',
    'FollowUpTasks',
    'Inventory',
    'QCInspection',
    'ServiceRequest',
    'Employee',
    'Supplier',
    'Dashboard',
    'BOM',
    'WorkCenter',
    'Branch',
  ],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: any) => ({
        user: {
          ...response.data.user,
          role: response.data.user.roles[0] || 'user', // Take first role as primary role
          permissions: response.data.user.roles || [], // Use roles as permissions for now
        },
        token: response.data.tokens.accessToken,
      }),
      invalidatesTags: ['User'],
    }),
    
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
    
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: any) => ({
        ...response.data.user,
        role: response.data.user.roles[0] || 'user', // Take first role as primary role
        permissions: response.data.user.roles || [], // Use roles as permissions for now
      }),
      providesTags: ['User'],
    }),
    
    // Dashboard endpoints
    getDashboardData: builder.query<any, { role: string }>({
      query: ({ role }) => `/bi/dashboards/${role}`,
      providesTags: ['Dashboard'],
    }),
    
    // Manufacturing endpoints
    getProductionOrders: builder.query<any, { page?: number; limit?: number; branchId?: string; status?: string; startDate?: string; endDate?: string; search?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/production-orders',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['ProductionOrder'],
    }),
    
    getProductionOrder: builder.query<any, string>({
      query: (id) => `/manufacturing/production-orders/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['ProductionOrder'],
    }),
    
    updateProductionOrderStatus: builder.mutation<any, { id: string; status: string; actualStartDate?: string; actualEndDate?: string }>({
      query: ({ id, ...data }) => ({
        url: `/manufacturing/production-orders/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),
    
    rescheduleProductionOrder: builder.mutation<any, { id: string; newStartDate?: string; bufferDays?: number; priority?: number }>({
      query: ({ id, ...data }) => ({
        url: `/manufacturing/production-orders/${id}/reschedule`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),
    
    getProductionSchedule: builder.query<any, { branchId?: string; startDate?: string; endDate?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/schedule',
        params,
      }),
      transformResponse: (response: any) => response.data || {},
      providesTags: ['ProductionOrder'],
    }),
    
    getGanttChartData: builder.query<any, { branchId?: string; startDate?: string; endDate?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/gantt-chart',
        params,
      }),
      transformResponse: (response: any) => response.data || {},
      providesTags: ['ProductionOrder'],
    }),
    
    getCalendarViewData: builder.query<any, { startDate: string; endDate: string; branchId?: string }>({
      query: (params) => ({
        url: '/manufacturing/calendar-view',
        params,
      }),
      transformResponse: (response: any) => response.data || {},
      providesTags: ['ProductionOrder'],
    }),
    
    createProductionOrder: builder.mutation<any, any>({
      query: (orderData) => ({
        url: '/manufacturing/production-orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),
    
    // BOM Management
    // Products for BOM creation
    getProducts: builder.query<any[], void>({
      query: () => '/manufacturing/products',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['BOM'],
    }),

    // Inventory items for BOM items
    getInventoryItemsForBOM: builder.query<any[], void>({
      query: () => '/manufacturing/inventory-items',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['BOM'],
    }),

    getBOMs: builder.query<any, { status?: string; page?: number; limit?: number; search?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/boms',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['BOM'],
    }),
    
    getBOM: builder.query<any, string>({
      query: (id) => `/manufacturing/bom/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['BOM'],
    }),
    
    createBOM: builder.mutation<any, any>({
      query: (bomData) => ({
        url: '/manufacturing/bom',
        method: 'POST',
        body: bomData,
      }),
      invalidatesTags: ['BOM'],
    }),
    
    updateBOMWithEngineeringChange: builder.mutation<any, any>({
      query: (changeData) => ({
        url: '/manufacturing/bom/engineering-change',
        method: 'PUT',
        body: changeData,
      }),
      invalidatesTags: ['BOM'],
    }),
    
    approveBOM: builder.mutation<any, string>({
      query: (id) => ({
        url: `/manufacturing/bom/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['BOM'],
    }),
    
    getBOMCost: builder.query<any, { id: string; quantity?: number }>({
      query: ({ id, quantity = 1 }) => ({
        url: `/manufacturing/bom/${id}/cost`,
        params: { quantity },
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['BOM'],
    }),
    
    // Work Center Management
    getWorkCenters: builder.query<any[], void>({
      query: () => '/manufacturing/work-centers',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['WorkCenter'],
    }),
    
    createWorkCenter: builder.mutation<any, any>({
      query: (workCenterData) => ({
        url: '/manufacturing/work-centers',
        method: 'POST',
        body: workCenterData,
      }),
      invalidatesTags: ['WorkCenter'],
    }),

    getWorkCenter: builder.query<any, string>({
      query: (id) => `/manufacturing/work-centers/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['WorkCenter'],
    }),

    updateWorkCenter: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/manufacturing/work-centers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['WorkCenter'],
    }),
    
    createOperation: builder.mutation<any, any>({
      query: (operationData) => ({
        url: '/manufacturing/operations',
        method: 'POST',
        body: operationData,
      }),
      invalidatesTags: ['WorkCenter'],
    }),
    
    calculateCapacityRouting: builder.mutation<any, any>({
      query: (routingData) => ({
        url: '/manufacturing/capacity-routing',
        method: 'POST',
        body: routingData,
      }),
    }),
    
    getMachineSchedule: builder.query<any, { startDate: string; endDate: string; workCenterIds?: string }>({
      query: (params) => ({
        url: '/manufacturing/machine-schedule',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['WorkCenter'],
    }),
    
    getWorkCenterUtilization: builder.query<any, { startDate: string; endDate: string; workCenterId?: string }>({
      query: (params) => ({
        url: '/manufacturing/utilization',
        params,
      }),
      transformResponse: (response: any) => response.data || {},
      providesTags: ['WorkCenter'],
    }),
    
    // Material Consumption & Scrap Tracking
    getMaterialConsumption: builder.query<any[], { productionOrderId?: string; startDate?: string; endDate?: string; workCenterId?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/material-consumption',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['ProductionOrder'],
    }),
    
    recordMaterialConsumption: builder.mutation<any, any>({
      query: (consumptionData) => ({
        url: '/manufacturing/material-consumption',
        method: 'POST',
        body: consumptionData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),
    
    getScrapRecords: builder.query<any[], { productionOrderId?: string; startDate?: string; endDate?: string; workCenterId?: string }>({
      query: (params = {}) => ({
        url: '/manufacturing/scrap-tracking',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['ProductionOrder'],
    }),
    
    recordScrap: builder.mutation<any, any>({
      query: (scrapData) => ({
        url: '/manufacturing/scrap-tracking',
        method: 'POST',
        body: scrapData,
      }),
      invalidatesTags: ['ProductionOrder'],
    }),
    
    // Engineering Change Management
    createEngineeringChange: builder.mutation<any, any>({
      query: (changeData) => ({
        url: '/manufacturing/engineering-change',
        method: 'POST',
        body: changeData,
      }),
      invalidatesTags: ['BOM'],
    }),
    
    calculateDeliveryDate: builder.mutation<any, any>({
      query: (calculationData) => ({
        url: '/manufacturing/delivery-date-calculation',
        method: 'POST',
        body: calculationData,
      }),
    }),
    
    getManufacturingBranches: builder.query<any[], void>({
      query: () => '/manufacturing/branches',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Branch'],
    }),
    
    // Sales endpoints
    getSalesOrders: builder.query<any, { page?: number; limit?: number; status?: string; customerId?: string; branchId?: string; search?: string }>({
      query: (params = {}) => ({
        url: '/sales/orders',
        params,
      }),
      transformResponse: (response: any) => response.data || { orders: [], pagination: {} },
      providesTags: ['SalesOrder'],
    }),
    
    getSalesOrder: builder.query<any, string>({
      query: (id) => `/sales/orders/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['SalesOrder'],
    }),
    
    createSalesOrder: builder.mutation<any, any>({
      query: (orderData) => ({
        url: '/sales/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['SalesOrder'],
    }),
    
    // Lead Management
    getLeads: builder.query<any, { page?: number; limit?: number; status?: string; source?: string; assignedTo?: string; priority?: string; search?: string }>({
      query: (params = {}) => ({
        url: '/sales/leads',
        params,
      }),
      transformResponse: (response: any) => response.data || { leads: [], pagination: {} },
      providesTags: ['Lead'],
    }),
    
    getLead: builder.query<any, string>({
      query: (id) => `/sales/leads/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Lead'],
    }),
    
    createLead: builder.mutation<any, any>({
      query: (leadData) => ({
        url: '/sales/leads',
        method: 'POST',
        body: leadData,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    updateLeadStatus: builder.mutation<any, { id: string; status: string; followUpDate?: string; notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `/sales/leads/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    assignLead: builder.mutation<any, { id: string; assignedTo: string; notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `/sales/leads/${id}/assign`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    bulkAssignLeads: builder.mutation<any, { leadIds: string[]; assignedTo: string }>({
      query: (data) => ({
        url: '/sales/leads/bulk-assign',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    getLeadAssignmentRecommendations: builder.query<any, string>({
      query: (leadId) => `/sales/leads/${leadId}/assignment-recommendations`,
      transformResponse: (response: any) => response.data,
    }),
    
    // Site Measurements
    captureSiteMeasurement: builder.mutation<any, any>({
      query: (measurementData) => ({
        url: '/sales/measurements',
        method: 'POST',
        body: measurementData,
      }),
      invalidatesTags: ['Lead'],
    }),
    
    // Estimates
    getEstimates: builder.query<any, { page?: number; limit?: number; status?: string; approvalStatus?: string; customerId?: string; search?: string }>({
      query: (params = {}) => ({
        url: '/sales/estimates',
        params,
      }),
      transformResponse: (response: any) => response.data || { estimates: [], pagination: {} },
      providesTags: ['Estimate'],
    }),
    
    getEstimate: builder.query<any, string>({
      query: (id) => `/sales/estimates/${id}/details`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Estimate'],
    }),
    
    createEstimation: builder.mutation<any, any>({
      query: (estimationData) => ({
        url: '/sales/estimates',
        method: 'POST',
        body: estimationData,
      }),
      invalidatesTags: ['Estimate', 'Lead'],
    }),
    
    approveEstimate: builder.mutation<any, { id: string; approvalLevel?: number; notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `/sales/estimates/${id}/approve`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Estimate', 'Lead'],
    }),
    
    // Discount Approval
    processDiscountApproval: builder.mutation<any, any>({
      query: (approvalData) => ({
        url: '/sales/discount-approval',
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: ['Estimate'],
    }),
    
    // Customer Management
    getCustomers: builder.query<any, { page?: number; limit?: number; search?: string; branchId?: string }>({
      query: (params = {}) => ({
        url: '/sales/customers',
        params,
      }),
      transformResponse: (response: any) => response.data || { customers: [], pagination: {} },
      providesTags: ['Customer'],
    }),
    
    getCustomer: builder.query<any, string>({
      query: (id) => `/sales/customers/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Customer'],
    }),
    
    createCustomer: builder.mutation<any, any>({
      query: (customerData) => ({
        url: '/sales/customers',
        method: 'POST',
        body: customerData,
      }),
      invalidatesTags: ['Customer'],
    }),
    
    // Sales Analytics
    getSalesAnalytics: builder.query<any, { branchId?: string; startDate?: string; endDate?: string }>({
      query: (params = {}) => ({
        url: '/sales/analytics',
        params,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['SalesAnalytics'],
    }),
    
    getSalesPipelineAnalytics: builder.query<any, { branchId?: string }>({
      query: (params = {}) => ({
        url: '/sales/pipeline-analytics',
        params,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['SalesAnalytics'],
    }),
    
    getSalesDashboard: builder.query<any, { branchId?: string; period?: string }>({
      query: (params = {}) => ({
        url: '/sales/dashboard',
        params,
      }),
      transformResponse: (response: any) => response.data,
      providesTags: ['SalesAnalytics'],
    }),
    
    getFollowUpTasks: builder.query<any, { assignedTo?: string; priority?: string }>({
      query: (params = {}) => ({
        url: '/sales/follow-up-tasks',
        params,
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['FollowUpTasks'],
    }),
    
    // Inventory endpoints
    getInventoryItems: builder.query<any[], void>({
      query: () => '/inventory/items',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Inventory'],
    }),
    
    getStockLevels: builder.query<any[], void>({
      query: () => '/inventory/stock-levels',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Inventory'],
    }),
    
    getStockTransactions: builder.query<any[], void>({
      query: () => '/inventory/stock-transactions',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Inventory'],
    }),
    
    createInventoryItem: builder.mutation<any, any>({
      query: (itemData) => ({
        url: '/inventory/items',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Inventory'],
    }),
    
    createStockTransaction: builder.mutation<any, any>({
      query: (transactionData) => ({
        url: '/inventory/stock-transactions',
        method: 'POST',
        body: transactionData,
      }),
      invalidatesTags: ['Inventory'],
    }),
    
    processBarcodeScan: builder.mutation<any, { barcode: string }>({
      query: ({ barcode }) => ({
        url: '/inventory/barcode-scan',
        method: 'POST',
        body: { barcode },
      }),
    }),
    
    // Procurement endpoints
    getPurchaseOrders: builder.query<any[], void>({
      query: () => '/procurement/orders',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Supplier'],
    }),
    
    getRFQs: builder.query<any[], void>({
      query: () => '/procurement/rfq',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Supplier'],
    }),
    
    getPurchaseRequisitions: builder.query<any[], void>({
      query: () => '/procurement/requisitions',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Supplier'],
    }),
    
    createRFQ: builder.mutation<any, any>({
      query: (rfqData) => ({
        url: '/procurement/rfq',
        method: 'POST',
        body: rfqData,
      }),
      invalidatesTags: ['Supplier'],
    }),
    
    createPurchaseOrder: builder.mutation<any, any>({
      query: (poData) => ({
        url: '/procurement/orders',
        method: 'POST',
        body: poData,
      }),
      invalidatesTags: ['Supplier'],
    }),
    
    // QC endpoints
    getQCInspections: builder.query<any[], void>({
      query: () => '/qc/inspections',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['QCInspection'],
    }),
    
    createQCInspection: builder.mutation<any, any>({
      query: (inspectionData) => ({
        url: '/qc/inspections',
        method: 'POST',
        body: inspectionData,
      }),
      invalidatesTags: ['QCInspection'],
    }),
    
    // Service endpoints
    getServiceRequests: builder.query<any[], void>({
      query: () => '/service/requests',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['ServiceRequest'],
    }),
    
    createServiceRequest: builder.mutation<any, any>({
      query: (serviceData) => ({
        url: '/service/requests',
        method: 'POST',
        body: serviceData,
      }),
      invalidatesTags: ['ServiceRequest'],
    }),
    
    // HR endpoints
    getEmployees: builder.query<any[], void>({
      query: () => '/hr/employees',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Employee'],
    }),
    
    // Finance endpoints
    getFinanceDashboard: builder.query<any, void>({
      query: () => '/finance/dashboard',
      transformResponse: (response: any) => response.data || {},
      providesTags: ['Dashboard'],
    }),
    
    getInvoices: builder.query<any[], void>({
      query: () => '/finance/invoices',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Dashboard'],
    }),
    
    createInvoice: builder.mutation<any, any>({
      query: (invoiceData) => ({
        url: '/finance/invoices',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Dashboard'],
    }),
    
    // BI endpoints
    getBIDashboard: builder.query<any, { role?: string; period?: string; metric?: string }>({
      query: ({ role = 'executive', period = '6months', metric = 'revenue' }) => 
        `/bi/dashboards/${role}?period=${period}&metric=${metric}`,
      providesTags: ['Dashboard'],
    }),
    
    // Alert endpoints
    getAlerts: builder.query<any[], void>({
      query: () => '/alerts',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Dashboard'],
    }),
    
    acknowledgeAlert: builder.mutation<any, { alertId: string }>({
      query: ({ alertId }) => ({
        url: `/alerts/${alertId}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['Dashboard'],
    }),
    
    resolveAlert: builder.mutation<any, { alertId: string }>({
      query: ({ alertId }) => ({
        url: `/alerts/${alertId}/resolve`,
        method: 'POST',
      }),
      invalidatesTags: ['Dashboard'],
    }),
    
    // Field Operations endpoints
    getFieldActivities: builder.query<any[], void>({
      query: () => '/field/activities',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Dashboard'],
    }),
    
    createFieldActivity: builder.mutation<any, any>({
      query: (activityData) => ({
        url: '/field/activities',
        method: 'POST',
        body: activityData,
      }),
      invalidatesTags: ['Dashboard'],
    }),
    
    // User Management endpoints
    getUsers: builder.query<any[], void>({
      query: () => '/admin/users',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['User'],
    }),
    
    getRoles: builder.query<any[], void>({
      query: () => '/admin/roles',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['User'],
    }),
    
    getPermissions: builder.query<any[], void>({
      query: () => '/admin/permissions',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['User'],
    }),
    
    createUser: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateUser: builder.mutation<any, { id: string; userData: any }>({
      query: ({ id, userData }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Branch Management endpoints
    getBranches: builder.query<any, { page?: number; limit?: number; search?: string; state?: string; isActive?: boolean }>({
      query: (params = {}) => ({
        url: '/admin/branches',
        params,
      }),
      transformResponse: (response: any) => ({
        data: response.data || [],
        pagination: response.pagination || { total: 0, totalPages: 0 }
      }),
      providesTags: ['Branch'],
    }),
    
    getBranch: builder.query<any, string>({
      query: (id) => `/admin/branches/${id}`,
      transformResponse: (response: any) => response.data,
      providesTags: ['Branch'],
    }),
    
    createBranch: builder.mutation<any, any>({
      query: (branchData) => ({
        url: '/admin/branches',
        method: 'POST',
        body: branchData,
      }),
      invalidatesTags: ['Branch'],
    }),
    
    updateBranch: builder.mutation<any, { id: string; branchData: any }>({
      query: ({ id, branchData }) => ({
        url: `/admin/branches/${id}`,
        method: 'PUT',
        body: branchData,
      }),
      invalidatesTags: ['Branch'],
    }),
    
    deleteBranch: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branch'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetDashboardDataQuery,
  useGetProductionOrdersQuery,
  useGetProductionOrderQuery,
  useUpdateProductionOrderStatusMutation,
  useRescheduleProductionOrderMutation,
  useGetProductionScheduleQuery,
  useGetGanttChartDataQuery,
  useGetCalendarViewDataQuery,
  useCreateProductionOrderMutation,
  useGetProductsQuery,
  useGetInventoryItemsForBOMQuery,
  useGetBOMsQuery,
  useGetBOMQuery,
  useCreateBOMMutation,
  useUpdateBOMWithEngineeringChangeMutation,
  useApproveBOMMutation,
  useGetBOMCostQuery,
  useGetWorkCentersQuery,
  useGetWorkCenterQuery,
  useCreateWorkCenterMutation,
  useUpdateWorkCenterMutation,
  useCreateOperationMutation,
  useCalculateCapacityRoutingMutation,
  useGetMachineScheduleQuery,
  useGetWorkCenterUtilizationQuery,
  useGetMaterialConsumptionQuery,
  useRecordMaterialConsumptionMutation,
  useGetScrapRecordsQuery,
  useRecordScrapMutation,
  useCreateEngineeringChangeMutation,
  useCalculateDeliveryDateMutation,
  useGetManufacturingBranchesQuery,
  
  // Sales Order hooks
  useGetSalesOrdersQuery,
  useGetSalesOrderQuery,
  useCreateSalesOrderMutation,
  
  // Lead Management hooks
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadStatusMutation,
  useAssignLeadMutation,
  useBulkAssignLeadsMutation,
  useGetLeadAssignmentRecommendationsQuery,
  
  // Site Measurement hooks
  useCaptureSiteMeasurementMutation,
  
  // Estimate hooks
  useGetEstimatesQuery,
  useGetEstimateQuery,
  useCreateEstimationMutation,
  useApproveEstimateMutation,
  
  // Discount Approval hooks
  useProcessDiscountApprovalMutation,
  
  // Customer Management hooks
  useGetCustomersQuery,
  useGetCustomerQuery,
  useCreateCustomerMutation,
  
  // Sales Analytics hooks
  useGetSalesAnalyticsQuery,
  useGetSalesPipelineAnalyticsQuery,
  useGetSalesDashboardQuery,
  useGetFollowUpTasksQuery,
  
  useGetInventoryItemsQuery,
  useGetStockLevelsQuery,
  useGetStockTransactionsQuery,
  useCreateInventoryItemMutation,
  useCreateStockTransactionMutation,
  useProcessBarcodeScanMutation,
  useGetPurchaseOrdersQuery,
  useGetRFQsQuery,
  useGetPurchaseRequisitionsQuery,
  useCreateRFQMutation,
  useCreatePurchaseOrderMutation,
  useGetQCInspectionsQuery,
  useCreateQCInspectionMutation,
  useGetServiceRequestsQuery,
  useCreateServiceRequestMutation,
  useGetEmployeesQuery,
  useGetFinanceDashboardQuery,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useGetBIDashboardQuery,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useResolveAlertMutation,
  useGetFieldActivitiesQuery,
  useCreateFieldActivityMutation,
  useGetUsersQuery,
  useGetRolesQuery,
  useGetPermissionsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  
  // Branch Management hooks
  useGetBranchesQuery,
  useGetBranchQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = api;