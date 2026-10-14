import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class LoanService {
  static async requestLoan(organizationId: string, employeeId: string, data: any, actor: any) {
    const { loanType, principalAmount, totalInstallments, remarks } = data;

    const amount = Number(principalAmount);
    const installments = Math.max(1, parseInt(totalInstallments, 10));
    const monthlyInstallment = Math.round((amount / installments) * 100) / 100;

    const loan = await prisma.employeeLoan.create({
      data: {
        organizationId,
        employeeId,
        loanType: loanType || 'SALARY_ADVANCE',
        principalAmount: amount,
        totalAmount: amount,
        monthlyInstallment,
        totalInstallments: installments,
        remainingInstallments: installments,
        outstandingBalance: amount,
        status: 'PENDING',
        remarks,
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeId: true } },
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'LOANS',
      recordId: loan.id,
      afterValues: loan,
      reason: `Requested ${loan.loanType} of LKR ${amount} with ${installments} installment(s)`,
    });

    return loan;
  }

  static async reviewLoan(
    loanId: string,
    organizationId: string,
    decision: 'APPROVED' | 'REJECTED',
    actor: any,
    remarks?: string
  ) {
    const loan = await prisma.employeeLoan.findFirst({
      where: { id: loanId, organizationId },
    });
    if (!loan) throw new NotFoundError('Loan record not found');

    if (loan.status !== 'PENDING') {
      throw new BadRequestError(`Cannot review loan with status ${loan.status}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const newStatus = decision === 'APPROVED' ? 'ACTIVE' : 'REJECTED';

    const updated = await prisma.employeeLoan.update({
      where: { id: loanId },
      data: {
        status: newStatus,
        approvedById: actor.userId,
        disbursementDate: decision === 'APPROVED' ? today : null,
        remarks: remarks || loan.remarks,
      },
    });

    if (decision === 'APPROVED') {
      await prisma.loanTransaction.create({
        data: {
          loanId,
          transactionType: 'DISBURSEMENT',
          amount: loan.principalAmount,
          balanceAfter: loan.principalAmount,
          paymentDate: today,
          remarks: `Loan approved and disbursed by ${actor.name}`,
        },
      });
    }

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: decision === 'APPROVED' ? 'APPROVE' : 'REJECT',
      module: 'LOANS',
      recordId: loanId,
      afterValues: updated,
    });

    return updated;
  }

  static async getLoans(
    organizationId: string,
    filters: {
      employeeId?: string;
      status?: string;
      loanType?: string;
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
    if (filters.loanType) where.loanType = filters.loanType;

    const [total, loans] = await Promise.all([
      prisma.employeeLoan.count({ where }),
      prisma.employeeLoan.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: { select: { name: true } },
            },
          },
          transactions: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      loans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
