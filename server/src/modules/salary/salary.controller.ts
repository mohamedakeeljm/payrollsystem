import { Request, Response, NextFunction } from 'express';
import { SalaryService } from './salary.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { ForbiddenError } from '../../utils/errors';

export class SalaryController {
  static async getStructures(req: Request, res: Response, next: NextFunction) {
    try {
      const structures = await SalaryService.getStructures(req.user!.organizationId);
      return sendSuccess(res, structures);
    } catch (error) {
      return next(error);
    }
  }

  static async createStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const struct = await SalaryService.createStructure(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, struct, 'Salary structure created');
    } catch (error) {
      return next(error);
    }
  }

  static async getComponents(req: Request, res: Response, next: NextFunction) {
    try {
      const components = await SalaryService.getComponents(req.user!.organizationId);
      return sendSuccess(res, components);
    } catch (error) {
      return next(error);
    }
  }

  static async createComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const comp = await SalaryService.createComponent(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, comp, 'Salary component created');
    } catch (error) {
      return next(error);
    }
  }

  static async getEmployeeSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;

      // Regular employees can only view their own salary
      if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== employeeId) {
        throw new ForbiddenError('You can only view your own salary');
      }

      const salary = await SalaryService.getEmployeeSalaryAssignment(employeeId, req.user!.organizationId);
      return sendSuccess(res, salary);
    } catch (error) {
      return next(error);
    }
  }

  static async getSalaryHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;

      if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== employeeId) {
        throw new ForbiddenError('You can only view your own salary history');
      }

      const history = await SalaryService.getSalaryHistory(employeeId, req.user!.organizationId);
      return sendSuccess(res, history);
    } catch (error) {
      return next(error);
    }
  }

  static async assignSalary(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const assignment = await SalaryService.assignSalary(
        req.user!.organizationId,
        employeeId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, assignment, 'Salary assigned successfully');
    } catch (error) {
      return next(error);
    }
  }
}
