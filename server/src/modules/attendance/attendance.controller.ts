import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class AttendanceController {
  static async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('User is not associated with an employee profile');

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        source: 'WEB',
      };

      const record = await AttendanceService.clockIn(req.user!.organizationId, employeeId, meta);
      return sendCreated(res, record, 'Clocked in successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('User is not associated with an employee profile');

      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        source: 'WEB',
      };

      const record = await AttendanceService.clockOut(req.user!.organizationId, employeeId, meta);
      return sendSuccess(res, record, 'Clocked out successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {
        employeeId: req.query.employeeId as string,
        departmentId: req.query.departmentId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      // Role scoped access
      if (req.user!.role === 'EMPLOYEE') {
        filters.employeeId = req.user!.employeeId;
      } else if (req.user!.role === 'DEPT_MANAGER' && req.user!.departmentId) {
        filters.departmentId = req.user!.departmentId;
      }

      const result = await AttendanceService.getAttendanceRecords(req.user!.organizationId, filters);
      return sendSuccess(res, result.records, undefined, 200, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  static async requestCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const correction = await AttendanceService.requestCorrection(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, correction, 'Attendance correction requested');
    } catch (error) {
      return next(error);
    }
  }

  static async reviewCorrection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, reviewNotes } = req.body;
      const result = await AttendanceService.reviewCorrection(
        id,
        req.user!.organizationId,
        decision,
        reviewNotes,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, result, `Attendance correction ${decision.toLowerCase()} successfully`);
    } catch (error) {
      return next(error);
    }
  }

  static async requestOvertime(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('User is not associated with an employee profile');

      const ot = await AttendanceService.requestOvertime(
        req.user!.organizationId,
        employeeId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, ot, 'Overtime request submitted');
    } catch (error) {
      return next(error);
    }
  }

  static async reviewOvertime(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, reviewNotes } = req.body;
      const result = await AttendanceService.reviewOvertime(
        id,
        req.user!.organizationId,
        decision,
        reviewNotes,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, result, `Overtime request ${decision.toLowerCase()}`);
    } catch (error) {
      return next(error);
    }
  }
}
