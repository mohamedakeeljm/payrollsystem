import { Request, Response, NextFunction } from 'express';
import { PayslipService } from './payslip.service';
import { sendSuccess } from '../../utils/response';

export class PayslipController {
  static async getPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: any = {
        periodCode: req.query.periodCode as string,
      };

      // Restrict employees to only their own payslips
      if (req.user!.role === 'EMPLOYEE') {
        filters.employeeId = req.user!.employeeId;
      } else if (req.query.employeeId) {
        filters.employeeId = req.query.employeeId as string;
      }

      const slips = await PayslipService.getPayslips(req.user!.organizationId, filters);
      return sendSuccess(res, slips);
    } catch (error) {
      return next(error);
    }
  }

  static async getPayslipById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeId = req.user!.role === 'EMPLOYEE' ? req.user!.employeeId : undefined;
      const slip = await PayslipService.getPayslipById(id, req.user!.organizationId, employeeId);
      return sendSuccess(res, slip);
    } catch (error) {
      return next(error);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const employeeId = req.user!.role === 'EMPLOYEE' ? req.user!.employeeId : undefined;
      const pdfBuffer = await PayslipService.generatePayslipPdf(id, req.user!.organizationId, employeeId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payslip-${id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  }
}
