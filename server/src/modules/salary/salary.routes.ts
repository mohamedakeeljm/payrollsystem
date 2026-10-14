import { Router } from 'express';
import { SalaryController } from './salary.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Structures & Components
router.get('/structures', SalaryController.getStructures);
router.post('/structures', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), SalaryController.createStructure);

router.get('/components', SalaryController.getComponents);
router.post('/components', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), SalaryController.createComponent);

// Employee Salary Assignment & History
router.get('/employees/:employeeId', SalaryController.getEmployeeSalary);
router.get('/employees/:employeeId/history', SalaryController.getSalaryHistory);
router.post('/employees/:employeeId/assign', requireRole('SUPER_ADMIN', 'PAYROLL_MANAGER'), SalaryController.assignSalary);

export default router;
