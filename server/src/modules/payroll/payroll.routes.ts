import { Router } from 'express';
import { PayrollController } from './payroll.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Periods
router.get('/periods', PayrollController.getPeriods);
router.post('/periods', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.createPeriod);

// Statutory Config
router.get('/statutory-config', PayrollController.getStatutoryConfig);

// Preview & Runs
router.get('/preview/:periodId', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.previewPayroll);
router.post('/runs', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.createPayrollRun);
router.get('/runs', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.getPayrollRuns);
router.get('/runs/:id', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.getPayrollRunById);
router.post('/runs/:id/finalize', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), PayrollController.finalizePayrollRun);

export default router;
