import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getUserNotifications(
        req.user!.organizationId,
        req.user!.userId,
        req.user!.employeeId
      );
      return sendSuccess(res, notifications);
    } catch (error) {
      return next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await NotificationService.markAsRead(id, req.user!.organizationId);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (error) {
      return next(error);
    }
  }
}
