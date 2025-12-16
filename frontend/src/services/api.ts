import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import type { LoginCredentials, LoginResponse, User } from '../types/auth';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
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
    recordMaterialConsumption: builder.mutation<any, any>({
      query: (consumptionData) => ({
        url: '/manufacturing/material-consumption',
        method: 'POST',
        body: consumptionData,
      }),
      invalidatesTags: ['ProductionOrder'],
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
    
    getBranches: builder.query<any[], void>({
      query: () => '/manufacturing/branches',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Branch'],
    }),
    
    // Sales endpoints
    getSalesOrders: builder.query<any[], void>({
      query: () => '/sales/orders',
      transformResponse: (response: any) => response.data || [],
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
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Inventory'],
    }),
    
    getStockLevels: builder.query<any[], void>({
      query: () => '/inventory/stock-levels',
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
  useGetBOMsQuery,
  useGetBOMQuery,
  useCreateBOMMutation,
  useUpdateBOMWithEngineeringChangeMutation,
  useApproveBOMMutation,
  useGetBOMCostQuery,
  useGetWorkCentersQuery,
  useCreateWorkCenterMutation,
  useCreateOperationMutation,
  useCalculateCapacityRoutingMutation,
  useGetMachineScheduleQuery,
  useGetWorkCenterUtilizationQuery,
  useRecordMaterialConsumptionMutation,
  useRecordScrapMutation,
  useCreateEngineeringChangeMutation,
  useCalculateDeliveryDateMutation,
  useGetBranchesQuery,
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