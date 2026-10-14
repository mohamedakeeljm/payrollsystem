import { Request, Response, NextFunction } from 'express';
import { LoanService } from './loan.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class LoanController {
  static async requestLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const employeeId = req.user!.employeeId;
      if (!employeeId) throw new BadRequestError('User is not associated with an employee profile');

      const loan = await LoanService.requestLoan(
        req.user!.organizationId,
        employeeId,
        req.body,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, loan, 'Loan or salary advance requested successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async reviewLoan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const updated = await LoanService.reviewLoan(
        id,
        req.user!.organizationId,
        decision,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role },
        remarks
      );
      return sendSuccess(res, updated, `Loan ${decision.toLowerCase()} successfully`);
    } catch (error) {
      return next(error);
    }
  }

  static async getLoans(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {
        employeeId: req.query.employeeId as string,
        status: req.query.status as string,
        loanType: req.query.loanType as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      if (req.user!.role === 'EMPLOYEE') {
        filters.employeeId = req.user!.employeeId;
      }

      const result = await LoanService.getLoans(req.user!.organizationId, filters);
      return sendSuccess(res, result.loans, undefined, 200, result.pagination);
    } catch (error) {
      return next(error);
    }
  }
}
