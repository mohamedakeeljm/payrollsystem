import { Router } from 'express';
import { EmployeeController } from './employee.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Directory and profile
router.get('/', EmployeeController.getEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.post('/', requireRole('SUPER_ADMIN', 'HR_MANAGER'), EmployeeController.createEmployee);
router.put('/:id', EmployeeController.updateEmployee);
router.delete('/:id', requireRole('SUPER_ADMIN', 'HR_MANAGER'), EmployeeController.archiveEmployee);

// Documents
router.get('/:id/documents', EmployeeController.getDocuments);
router.post('/:id/documents', requireRole('SUPER_ADMIN', 'HR_MANAGER'), EmployeeController.addDocument);

export default router;
