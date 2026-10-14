import { Request, Response, NextFunction } from 'express';
import { PayrollService } from './payroll.service';
import { sendSuccess, sendCreated } from '../../utils/response';

export class PayrollController {
  static async getPeriods(req: Request, res: Response, next: NextFunction) {
    try {
      const periods = await PayrollService.getPeriods(req.user!.organizationId);
      return sendSuccess(res, periods);
    } catch (error) {
      return next(error);
    }
  }

  static async createPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const period = await PayrollService.createPeriod(req.user!.organizationId, req.body);
      return sendCreated(res, period, 'Payroll period created');
    } catch (error) {
      return next(error);
    }
  }

  static async previewPayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodId } = req.params;
      const preview = await PayrollService.previewPayroll(req.user!.organizationId, periodId);
      return sendSuccess(res, preview);
    } catch (error) {
      return next(error);
    }
  }

  static async createPayrollRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodId, notes } = req.body;
      const run = await PayrollService.createPayrollRun(
        req.user!.organizationId,
        periodId,
        notes,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendCreated(res, run, 'Payroll run created as DRAFT');
    } catch (error) {
      return next(error);
    }
  }

  static async finalizePayrollRun(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const finalized = await PayrollService.finalizePayrollRun(
        id,
        req.user!.organizationId,
        { userId: req.user!.userId, name: req.user!.fullName, role: req.user!.role }
      );
      return sendSuccess(res, finalized, 'Payroll run successfully finalized and locked');
    } catch (error) {
      return next(error);
    }
  }

  static async getPayrollRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runs = await PayrollService.getPayrollRuns(req.user!.organizationId);
      return sendSuccess(res, runs);
    } catch (error) {
      return next(error);
    }
  }

  static async getPayrollRunById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const run = await PayrollService.getPayrollRunById(id, req.user!.organizationId);
      return sendSuccess(res, run);
    } catch (error) {
      return next(error);
    }
  }

  static async getStatutoryConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await PayrollService.getStatutoryRuleSet(req.user!.organizationId);
      return sendSuccess(res, config);
    } catch (error) {
      return next(error);
    }
  }
}
