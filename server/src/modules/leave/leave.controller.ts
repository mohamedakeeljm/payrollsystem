import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class LeaveController {
  static async getLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await LeaveService.getLeaveTypes(req.user!.organizationId);
      return sendSuccess(res, types);
    } catch (error) {
      return next(error);
    }
  }

  static async createLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const type = await LeaveService.createLeaveType(req.user!.organizationId, req.body);
      return sendCreated(res, type, 'Leave type created');
    } catch (error) {
      return next(error);
    }
  }

  static async getLeaveBalances(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = (req.query.employeeId as string) || req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('Employee ID is required');

      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const balances = await LeaveService.getLeaveBalances(req.user!.organizationId, employeeId, year);
      return sendSuccess(res, balances);
    } catch (error) {
      return next(error);
    }
  }

  static async applyLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('User is not associated with an employee profile');

      const leave = await LeaveService.applyLeave(
        req.user!.organizationId,
        employeeId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, leave, 'Leave application submitted successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async getLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {
        employeeId: req.query.employeeId as string,
        departmentId: req.query.departmentId as string,
        status: req.query.status as string,
        leaveTypeId: req.query.leaveTypeId as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      if (req.user!.role === 'EMPLOYEE') {
        filters.employeeId = req.user!.employeeId;
      } else if (req.user!.role === 'DEPT_MANAGER' && req.user!.departmentId) {
        filters.departmentId = req.user!.departmentId;
      }

      const result = await LeaveService.getLeaveRequests(req.user!.organizationId, filters);
      return sendSuccess(res, result.requests, undefined, 200, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  static async reviewLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, reviewNotes } = req.body;
      const result = await LeaveService.reviewLeave(
        id,
        req.user!.organizationId,
        decision,
        reviewNotes,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, result, `Leave request ${decision.toLowerCase()} successfully`);
    } catch (error) {
      return next(error);
    }
  }
}
