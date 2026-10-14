import { Router } from 'express';
import { LeaveController } from './leave.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Types & Balances
router.get('/types', LeaveController.getLeaveTypes);
router.post('/types', requireRole('SUPER_ADMIN', 'HR_MANAGER'), LeaveController.createLeaveType);
router.get('/balances', LeaveController.getLeaveBalances);

// Requests
router.get('/requests', LeaveController.getLeaveRequests);
router.post('/requests', LeaveController.applyLeave);
router.put('/requests/:id/review', requireRole('SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'), LeaveController.reviewLeave);

export default router;
