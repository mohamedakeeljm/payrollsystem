import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Clock in / out
router.post('/clock-in', AttendanceController.clockIn);
router.post('/clock-out', AttendanceController.clockOut);
router.get('/', AttendanceController.getAttendance);

// Corrections
router.post('/corrections', AttendanceController.requestCorrection);
router.put('/corrections/:id/review', requireRole('SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'), AttendanceController.reviewCorrection);

// Overtime
router.post('/overtime', AttendanceController.requestOvertime);
router.put('/overtime/:id/review', requireRole('SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER'), AttendanceController.reviewOvertime);

export default router;
