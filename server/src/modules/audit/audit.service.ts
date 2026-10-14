import { prisma } from '../../config/prisma';

export interface AuditParams {
  organizationId: string;
  userId?: string;
  actorName: string;
  actorRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'FINALIZE' | 'LOGIN' | 'CANCEL';
  module: 'AUTH' | 'EMPLOYEES' | 'ORGANIZATION' | 'ATTENDANCE' | 'LEAVE' | 'SALARY' | 'PAYROLL' | 'LOANS' | 'SETTINGS';
  recordId?: string;
  beforeValues?: any;
  afterValues?: any;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'refreshToken',
  'token',
  'bankAccountNumber',
  'nicOrPassport',
];

const sanitizeValues = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeValues);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeValues(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export class AuditService {
  static async log(params: AuditParams): Promise<void> {
    try {
      const beforeSanitized = params.beforeValues
        ? JSON.stringify(sanitizeValues(params.beforeValues))
        : null;
      const afterSanitized = params.afterValues
        ? JSON.stringify(sanitizeValues(params.afterValues))
        : null;

      await prisma.auditLog.create({
        data: {
          organizationId: params.organizationId,
          userId: params.userId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          action: params.action,
          module: params.module,
          recordId: params.recordId,
          beforeValuesJson: beforeSanitized,
          afterValuesJson: afterSanitized,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          reason: params.reason,
        },
      });
    } catch (error) {
      console.error('[AuditService.log Error]: Failed to persist audit log', error);
      // Non-blocking for primary operations, but logged
    }
  }

  static async getLogs(
    organizationId: string,
    filters: {
      module?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.module) where.module = filters.module;
    if (filters.action) where.action = filters.action;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
