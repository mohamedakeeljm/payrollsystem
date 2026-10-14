import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Organization Profile
router.get('/', OrganizationController.getOrganization);
router.put('/', requireRole('SUPER_ADMIN'), OrganizationController.updateOrganization);

// Branches
router.get('/branches', OrganizationController.getBranches);
router.post('/branches', requireRole('SUPER_ADMIN'), OrganizationController.createBranch);

// Departments
router.get('/departments', OrganizationController.getDepartments);
router.post('/departments', requireRole('SUPER_ADMIN', 'HR_MANAGER'), OrganizationController.createDepartment);
router.put('/departments/:id', requireRole('SUPER_ADMIN', 'HR_MANAGER'), OrganizationController.updateDepartment);
router.delete('/departments/:id', requireRole('SUPER_ADMIN'), OrganizationController.deleteDepartment);

// Designations
router.get('/designations', OrganizationController.getDesignations);
router.post('/designations', requireRole('SUPER_ADMIN', 'HR_MANAGER'), OrganizationController.createDesignation);

// Shifts
router.get('/shifts', OrganizationController.getShifts);
router.post('/shifts', requireRole('SUPER_ADMIN', 'HR_MANAGER'), OrganizationController.createShift);

// Holidays
router.get('/holidays', OrganizationController.getHolidays);
router.post('/holidays', requireRole('SUPER_ADMIN', 'HR_MANAGER'), OrganizationController.createHoliday);

export default router;
