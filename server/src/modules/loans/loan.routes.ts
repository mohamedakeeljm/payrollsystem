import { Router } from 'express';
import { LoanController } from './loan.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', LoanController.getLoans);
router.post('/request', LoanController.requestLoan);
router.put('/:id/review', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), LoanController.reviewLoan);

export default router;
