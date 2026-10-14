import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { sendSuccess } from '../../utils/response';

export class ReportsController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await ReportsService.getDashboardMetrics(req.user!.organizationId, req.user);
      return sendSuccess(res, metrics);
    } catch (error) {
      return next(error);
    }
  }

  static async getPayrollReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await ReportsService.getPayrollSummaryReport(req.user!.organizationId);
      return sendSuccess(res, reports);
    } catch (error) {
      return next(error);
    }
  }
}
