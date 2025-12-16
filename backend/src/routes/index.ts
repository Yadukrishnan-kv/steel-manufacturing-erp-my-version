import { Router } from 'express';
import { authRoutes } from './auth';
import { healthRoutes } from './health';
import { rbacRoutes } from './rbac';
import { manufacturingRoutes } from './manufacturing';
import inventoryRoutes from './inventory';
import procurementRoutes from './procurement';
import supplierRoutes from './supplier';
import { salesRoutes } from './sales';
import externalIntegrationRoutes from './externalIntegration';
import { qcRoutes } from './qc';
import { serviceRoutes } from './service';
import { financeRoutes } from './finance';
import hrRoutes from './hr';
import { alertRoutes } from './alert';
import { biRoutes } from './bi';
import { customerPortalRoutes } from './customerPortal';
import employeePortalRoutes from './employeePortal';

const router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Mount route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/health`, healthRoutes);
router.use(`${API_VERSION}/rbac`, rbacRoutes);
router.use(`${API_VERSION}/manufacturing`, manufacturingRoutes);
router.use(`${API_VERSION}/inventory`, inventoryRoutes);
router.use(`${API_VERSION}/procurement`, procurementRoutes);
router.use(`${API_VERSION}/suppliers`, supplierRoutes);
router.use(`${API_VERSION}/sales`, salesRoutes);
router.use(`${API_VERSION}/external-integration`, externalIntegrationRoutes);
router.use(`${API_VERSION}/qc`, qcRoutes);
router.use(`${API_VERSION}/service`, serviceRoutes);
router.use(`${API_VERSION}/finance`, financeRoutes);
router.use(`${API_VERSION}/hr`, hrRoutes);
router.use(`${API_VERSION}/alerts`, alertRoutes);
router.use(`${API_VERSION}/bi`, biRoutes);
router.use(`${API_VERSION}/customer-portal`, customerPortalRoutes);
router.use(`${API_VERSION}/employee-portal`, employeePortalRoutes);

// API root endpoint
router.get(API_VERSION, (req, res) => {
  res.json({
    success: true,
    message: 'Steel Manufacturing ERP API',
    version: 'v1',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export { router as apiRoutes };