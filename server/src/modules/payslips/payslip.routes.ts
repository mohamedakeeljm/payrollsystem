import { Router } from 'express';
import { PayslipController } from './payslip.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', PayslipController.getPayslips);
router.get('/:id', PayslipController.getPayslipById);
router.get('/:id/pdf', PayslipController.downloadPdf);

export default router;
