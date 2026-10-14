import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportsController.getDashboard);
router.get('/payroll', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), ReportsController.getPayrollReports);

export default router;
