import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class LeaveService {
  // --- Leave Types ---
  static async getLeaveTypes(organizationId: string) {
    return prisma.leaveType.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  static async createLeaveType(organizationId: string, data: any) {
    return prisma.leaveType.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  // --- Leave Balances ---
  static async getLeaveBalances(organizationId: string, employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();
    return prisma.leaveBalance.findMany({
      where: {
        organizationId,
        employeeId,
        year: targetYear,
      },
      include: {
        leaveType: true,
      },
    });
  }

  // --- Apply for Leave ---
  static async applyLeave(organizationId: string, employeeId: string, data: any, actor: any) {
    const { leaveTypeId, startDate, endDate, totalDays, isHalfDay, halfDayType, reason, attachmentUrl } = data;

    // Check overlapping requests
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestError(`You already have a leave request from ${overlap.startDate} to ${overlap.endDate} (${overlap.status}).`);
    }

    // Verify leave balance if not No-Pay
    const currentYear = new Date(startDate).getFullYear();
    const leaveType = await prisma.leaveType.findFirst({
      where: { id: leaveTypeId, organizationId },
    });
    if (!leaveType) throw new NotFoundError('Leave type not found');

    if (leaveType.code !== 'NO_PAY') {
      const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId, leaveTypeId, year: currentYear },
      });

      if (!balance || balance.remainingDays < totalDays) {
        throw new BadRequestError(
          `Insufficient leave balance. You requested ${totalDays} day(s), but only have ${balance?.remainingDays || 0} day(s) remaining.`
        );
      }

      // Mark pending days
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: balance.pendingDays + totalDays,
          remainingDays: balance.remainingDays - totalDays,
        },
      });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        organizationId,
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        totalDays,
        isHalfDay: !!isHalfDay,
        halfDayType,
        reason,
        attachmentUrl,
        status: 'PENDING',
      },
      include: {
        leaveType: true,
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'LEAVE',
      recordId: leaveRequest.id,
      afterValues: leaveRequest,
      reason: `Applied for ${totalDays} day(s) ${leaveType.name} from ${startDate} to ${endDate}`,
    });

    return leaveRequest;
  }

  // --- Review Leave Request ---
  static async reviewLeave(
    requestId: string,
    organizationId: string,
    decision: 'APPROVED' | 'REJECTED',
    reviewNotes: string | undefined,
    actor: any
  ) {
    const leaveReq = await prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
      include: { leaveType: true, employee: true },
    });

    if (!leaveReq) throw new NotFoundError('Leave request not found');

    if (leaveReq.status !== 'PENDING') {
      throw new BadRequestError(`Cannot review a request that is already ${leaveReq.status.toLowerCase()}`);
    }

    const year = new Date(leaveReq.startDate).getFullYear();

    // Use Prisma transaction for atomic balance and ledger updates
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          reviewedById: actor.userId,
          reviewNotes,
          reviewedAt: new Date(),
        },
      });

      await tx.leaveApproval.create({
        data: {
          leaveRequestId: requestId,
          approverId: actor.userId,
          decision,
          comments: reviewNotes,
        },
      });

      if (leaveReq.leaveType.code !== 'NO_PAY') {
        const balance = await tx.leaveBalance.findFirst({
          where: { employeeId: leaveReq.employeeId, leaveTypeId: leaveReq.leaveTypeId, year },
        });

        if (balance) {
          if (decision === 'APPROVED') {
            const newUsed = balance.usedDays + leaveReq.totalDays;
            const newPending = Math.max(0, balance.pendingDays - leaveReq.totalDays);

            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: {
                usedDays: newUsed,
                pendingDays: newPending,
              },
            });

            // Write to Leave Ledger
            await tx.leaveLedger.create({
              data: {
                organizationId,
                employeeId: leaveReq.employeeId,
                leaveTypeId: leaveReq.leaveTypeId,
                transactionType: 'DEDUCTION',
                days: leaveReq.totalDays,
                balanceAfter: balance.remainingDays,
                referenceId: requestId,
                remarks: `Approved leave: ${leaveReq.startDate} to ${leaveReq.endDate}`,
              },
            });
          } else {
            // Restore balance upon rejection
            await tx.leaveBalance.update({
              where: { id: balance.id },
              data: {
                pendingDays: Math.max(0, balance.pendingDays - leaveReq.totalDays),
                remainingDays: balance.remainingDays + leaveReq.totalDays,
              },
            });

            await tx.leaveLedger.create({
              data: {
                organizationId,
                employeeId: leaveReq.employeeId,
                leaveTypeId: leaveReq.leaveTypeId,
                transactionType: 'REVERSAL',
                days: leaveReq.totalDays,
                balanceAfter: balance.remainingDays + leaveReq.totalDays,
                referenceId: requestId,
                remarks: `Leave request rejected by ${actor.name}. Restored balance.`,
              },
            });
          }
        }
      }

      return updated;
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'LEAVE',
      recordId: requestId,
      reason: reviewNotes || `Leave request ${decision.toLowerCase()}`,
    });

    return result;
  }

  // --- Get Requests ---
  static async getLeaveRequests(
    organizationId: string,
    filters: {
      employeeId?: string;
      departmentId?: string;
      status?: string;
      leaveTypeId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { organizationId };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.status) where.status = filters.status;
    if (filters.leaveTypeId) where.leaveTypeId = filters.leaveTypeId;
    if (filters.departmentId) {
      where.employee = { departmentId: filters.departmentId };
    }

    const [total, requests] = await Promise.all([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        include: {
          leaveType: true,
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
