import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import type { LoginCredentials, LoginResponse, User } from '../types/auth';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
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
    'Inventory',
    'QCInspection',
    'ServiceRequest',
    'Employee',
    'Customer',
    'Supplier',
    'Dashboard',
  ],
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
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
      providesTags: ['User'],
    }),
    
    // Dashboard endpoints
    getDashboardData: builder.query<any, { role: string }>({
      query: ({ role }) => `/bi/dashboards/${role}`,
      providesTags: ['Dashboard'],
    }),
    
    // Manufacturing endpoints
    getProductionOrders: builder.query<any[], void>({
      query: () => '/manufacturing/production-orders',
      providesTags: ['ProductionOrder'],
    }),
    
    getProductionSchedule: builder.query<any, void>({
      query: () => '/manufacturing/schedule',
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
    
    // Sales endpoints
    getSalesOrders: builder.query<any[], void>({
      query: () => '/sales/orders',
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
    
    createEstimation: builder.mutation<any, any>({
      query: (estimationData) => ({
        url: '/sales/estimates',
        method: 'POST',
        body: estimationData,
      }),
    }),
    
    // Inventory endpoints
    getInventoryItems: builder.query<any[], void>({
      query: () => '/inventory/items',
      providesTags: ['Inventory'],
    }),
    
    getStockLevels: builder.query<any[], void>({
      query: () => '/inventory/stock-levels',
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
      providesTags: ['Supplier'],
    }),
    
    getRFQs: builder.query<any[], void>({
      query: () => '/procurement/rfq',
      providesTags: ['Supplier'],
    }),
    
    getPurchaseRequisitions: builder.query<any[], void>({
      query: () => '/procurement/requisitions',
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
      providesTags: ['Employee'],
    }),
    
    // Finance endpoints
    getFinanceDashboard: builder.query<any, void>({
      query: () => '/finance/dashboard',
      providesTags: ['Dashboard'],
    }),
    
    getInvoices: builder.query<any[], void>({
      query: () => '/finance/invoices',
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
    getBIDashboard: builder.query<any, { period?: string; metric?: string }>({
      query: ({ period = '6months', metric = 'revenue' }) => 
        `/bi/dashboard?period=${period}&metric=${metric}`,
      providesTags: ['Dashboard'],
    }),
    
    // Alert endpoints
    getAlerts: builder.query<any[], void>({
      query: () => '/alerts',
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
      providesTags: ['User'],
    }),
    
    getRoles: builder.query<any[], void>({
      query: () => '/admin/roles',
      providesTags: ['User'],
    }),
    
    getPermissions: builder.query<any[], void>({
      query: () => '/admin/permissions',
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
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useGetDashboardDataQuery,
  useGetProductionOrdersQuery,
  useGetProductionScheduleQuery,
  useCreateProductionOrderMutation,
  useGetSalesOrdersQuery,
  useCreateSalesOrderMutation,
  useCreateEstimationMutation,
  useGetInventoryItemsQuery,
  useGetStockLevelsQuery,
  useCreateInventoryItemMutation,
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
} = api;