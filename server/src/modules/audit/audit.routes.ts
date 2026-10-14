import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', requireRole('SUPER_ADMIN'), AuditController.getLogs);

export default router;
