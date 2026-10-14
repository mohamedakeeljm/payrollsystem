import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export class OrganizationController {
  static async getOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await OrganizationService.getOrganization(req.user!.organizationId);
      return sendSuccess(res, org);
    } catch (error) {
      return next(error);
    }
  }

  static async updateOrganization(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await OrganizationService.updateOrganization(
        req.user!.organizationId,
        req.body,
        {
          userId: req.user!.userId,
          name: req.user!.fullName,
          role: req.user!.role,
        }
      );
      return sendSuccess(res, updated, 'Organization updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Branches
  static async getBranches(req: Request, res: Response, next: NextFunction) {
    try {
      const branches = await OrganizationService.getBranches(req.user!.organizationId);
      return sendSuccess(res, branches);
    } catch (error) {
      return next(error);
    }
  }

  static async createBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const branch = await OrganizationService.createBranch(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, branch, 'Branch created successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Departments
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await OrganizationService.getDepartments(req.user!.organizationId);
      return sendSuccess(res, depts);
    } catch (error) {
      return next(error);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const dept = await OrganizationService.createDepartment(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, dept, 'Department created successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await OrganizationService.updateDepartment(
        req.params.id,
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, updated, 'Department updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      await OrganizationService.deleteDepartment(
        req.params.id,
        req.user!.organizationId,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, null, 'Department deleted successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Designations
  static async getDesignations(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const desigs = await OrganizationService.getDesignations(req.user!.organizationId, departmentId);
      return sendSuccess(res, desigs);
    } catch (error) {
      return next(error);
    }
  }

  static async createDesignation(req: Request, res: Response, next: NextFunction) {
    try {
      const desig = await OrganizationService.createDesignation(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, desig, 'Designation created successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Shifts
  static async getShifts(req: Request, res: Response, next: NextFunction) {
    try {
      const shifts = await OrganizationService.getShifts(req.user!.organizationId);
      return sendSuccess(res, shifts);
    } catch (error) {
      return next(error);
    }
  }

  static async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const shift = await OrganizationService.createShift(req.user!.organizationId, req.body);
      return sendCreated(res, shift, 'Shift created successfully');
    } catch (error) {
      return next(error);
    }
  }

  // Holidays
  static async getHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const holidays = await OrganizationService.getHolidays(req.user!.organizationId, year);
      return sendSuccess(res, holidays);
    } catch (error) {
      return next(error);
    }
  }

  static async createHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const holiday = await OrganizationService.createHoliday(req.user!.organizationId, req.body);
      return sendCreated(res, holiday, 'Holiday created successfully');
    } catch (error) {
      return next(error);
    }
  }
}
