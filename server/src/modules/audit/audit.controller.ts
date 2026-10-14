import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { sendSuccess } from '../../utils/response';

export class AuditController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        module: req.query.module as string,
        action: req.query.action as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 25,
      };

      const result = await AuditService.getLogs(req.user!.organizationId, filters);
      return sendSuccess(res, result.logs, undefined, 200, result.pagination);
    } catch (error) {
      return next(error);
    }
  }
}
