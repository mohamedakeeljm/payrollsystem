import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { ForbiddenError } from '../../utils/errors';

export class EmployeeController {
  static async getEmployees(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        search: req.query.search as string,
        departmentId: req.query.departmentId as string,
        designationId: req.query.designationId as string,
        branchId: req.query.branchId as string,
        employmentStatus: req.query.employmentStatus as string,
        employmentType: req.query.employmentType as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 15,
      };

      // If user is DEPT_MANAGER, scope only to their department
      if (req.user!.role === 'DEPT_MANAGER' && req.user!.departmentId) {
        filters.departmentId = req.user!.departmentId;
      }

      // If user is EMPLOYEE, restrict to self unless HR or Admin
      if (req.user!.role === 'EMPLOYEE') {
        if (!req.user!.employeeId) {
          return sendSuccess(res, { employees: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
        }
        const selfEmployee = await EmployeeService.getEmployeeById(req.user!.employeeId, req.user!.organizationId);
        return sendSuccess(res, {
          employees: [selfEmployee],
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
        });
      }

      const result = await EmployeeService.getEmployees(req.user!.organizationId, filters);
      return sendSuccess(res, result.employees, undefined, 200, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  static async getEmployeeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Access checks: Employees can only view themselves
      if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== id) {
        throw new ForbiddenError('You can only view your own profile');
      }

      const employee = await EmployeeService.getEmployeeById(id, req.user!.organizationId);

      // Dept managers can only view within their department
      if (req.user!.role === 'DEPT_MANAGER' && employee.departmentId !== req.user!.departmentId) {
        throw new ForbiddenError('You can only view employees in your department');
      }

      return sendSuccess(res, employee);
    } catch (error) {
      return next(error);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await EmployeeService.createEmployee(
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, employee, 'Employee created successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Restrict employees from updating unauthorized fields
      if (req.user!.role === 'EMPLOYEE') {
        if (req.user!.employeeId !== id) {
          throw new ForbiddenError('You can only update your own profile');
        }
        // Filter out salary, role, department changes for regular employee self-service
        const allowedSelfFields = ['personalPhone', 'personalEmail', 'address', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'];
        const sanitizedBody: any = {};
        for (const f of allowedSelfFields) {
          if (req.body[f] !== undefined) sanitizedBody[f] = req.body[f];
        }
        const updated = await EmployeeService.updateEmployee(
          id,
          req.user!.organizationId,
          sanitizedBody,
          { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
        );
        return sendSuccess(res, updated, 'Profile updated successfully');
      }

      const updated = await EmployeeService.updateEmployee(
        id,
        req.user!.organizationId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, updated, 'Employee updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async archiveEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await EmployeeService.archiveEmployee(
        id,
        req.user!.organizationId,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role },
        reason
      );
      return sendSuccess(res, result, 'Employee archived successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async addDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const doc = await EmployeeService.addDocument(
        req.user!.organizationId,
        id,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, doc, 'Document added successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (req.user!.role === 'EMPLOYEE' && req.user!.employeeId !== id) {
        throw new ForbiddenError('Unauthorized to view documents for this employee');
      }
      const docs = await EmployeeService.getDocuments(req.user!.organizationId, id);
      return sendSuccess(res, docs);
    } catch (error) {
      return next(error);
    }
  }
}
