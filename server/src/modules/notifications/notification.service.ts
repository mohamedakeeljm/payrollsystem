import { prisma } from '../../config/prisma';

export class NotificationService {
  static async getUserNotifications(organizationId: string, userId: string, employeeId?: string) {
    return prisma.notification.findMany({
      where: {
        organizationId,
        OR: [
          { userId },
          ...(employeeId ? [{ employeeId }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  static async markAsRead(id: string, organizationId: string) {
    return prisma.notification.updateMany({
      where: { id, organizationId },
      data: { isRead: true },
    });
  }

  static async createNotification(data: {
    organizationId: string;
    userId?: string;
    employeeId?: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        ...data,
        type: data.type || 'SYSTEM',
      },
    });
  }
}
