import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import bcrypt from 'bcryptjs';

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  designationId?: string;
  branchId?: string;
  employmentStatus?: string;
  employmentType?: string;
  page?: number;
  limit?: number;
}

export class EmployeeService {
  static async generateEmployeeId(organizationId: string): Promise<string> {
    const count = await prisma.employee.count({ where: { organizationId } });
    const nextNum = (count + 1).toString().padStart(4, '0');
    return `EMP-${nextNum}`;
  }

  static async getEmployees(organizationId: string, filters: EmployeeFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 15));
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
      deletedAt: null, // Soft delete filter
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { employeeId: { contains: filters.search } },
        { workEmail: { contains: filters.search } },
      ];
    }

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.designationId) where.designationId = filters.designationId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.employmentStatus) where.employmentStatus = filters.employmentStatus;
    if (filters.employmentType) where.employmentType = filters.employmentType;

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          designation: { select: { id: true, title: true, code: true } },
          branch: { select: { id: true, name: true } },
          reportingManager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getEmployeeById(id: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        branch: true,
        reportingManager: {
          select: { id: true, firstName: true, lastName: true, employeeId: true, workEmail: true },
        },
        user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
        salaryAssignments: {
          where: { isActive: true },
          include: {
            salaryStructure: true,
            components: { include: { salaryComponent: true } },
          },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        employmentHistories: { orderBy: { createdAt: 'desc' } },
        leaveBalances: {
          include: { leaveType: true },
        },
      },
    });

    if (!employee) throw new NotFoundError('Employee record not found');
    return employee;
  }

  static async createEmployee(organizationId: string, data: any, actor: any) {
    // Generate employee ID if not provided
    const employeeId = data.employeeId?.trim() || (await this.generateEmployeeId(organizationId));

    // Check duplicate employee ID or work email
    const existing = await prisma.employee.findFirst({
      where: {
        organizationId,
        OR: [{ employeeId }, { workEmail: data.workEmail.toLowerCase().trim() }],
      },
    });

    if (existing) {
      if (existing.employeeId === employeeId) {
        throw new BadRequestError(`Employee ID '${employeeId}' is already in use.`);
      }
      throw new BadRequestError(`Work email '${data.workEmail}' is already registered.`);
    }

    // Optional user account creation
    let createdUserId: string | undefined;
    if (data.createLoginAccount && data.workEmail && data.initialPassword) {
      const existingUser = await prisma.user.findFirst({
        where: { organizationId, email: data.workEmail.toLowerCase().trim() },
      });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash(data.initialPassword, 10);
        const user = await prisma.user.create({
          data: {
            organizationId,
            email: data.workEmail.toLowerCase().trim(),
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.workPhone || data.personalPhone,
          },
        });

        // Assign EMPLOYEE role by default
        const empRole = await prisma.role.findFirst({
          where: { organizationId, code: data.roleCode || 'EMPLOYEE' },
        });

        if (empRole) {
          await prisma.userRole.create({
            data: { userId: user.id, roleId: empRole.id },
          });
        }
        createdUserId = user.id;
      }
    }

    const { createLoginAccount, initialPassword, roleCode, ...employeeData } = data;

    const employee = await prisma.employee.create({
      data: {
        organizationId,
        employeeId,
        userId: createdUserId,
        ...employeeData,
        workEmail: data.workEmail.toLowerCase().trim(),
      },
      include: {
        department: true,
        designation: true,
      },
    });

    // Auto-initialize standard leave balances for the current year
    const currentYear = new Date().getFullYear();
    const leaveTypes = await prisma.leaveType.findMany({ where: { organizationId } });

    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          organizationId,
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          allocatedDays: lt.defaultDaysPerYear,
          remainingDays: lt.defaultDaysPerYear,
        },
      });
    }

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'EMPLOYEES',
      recordId: employee.id,
      afterValues: employee,
      reason: 'Created new employee profile and initialized leave balances',
    });

    return employee;
  }

  static async updateEmployee(id: string, organizationId: string, data: any, actor: any) {
    const before = await prisma.employee.findFirst({ where: { id, organizationId } });
    if (!before) throw new NotFoundError('Employee not found');

    // Track status or designation changes in employment history
    if (data.employmentStatus && data.employmentStatus !== before.employmentStatus) {
      await prisma.employmentHistory.create({
        data: {
          employeeId: id,
          eventType: 'STATUS_CHANGE',
          previousValue: before.employmentStatus,
          newValue: data.employmentStatus,
          effectiveDate: new Date().toISOString().split('T')[0],
          remarks: `Status updated by ${actor.name}`,
        },
      });
    }

    if (data.designationId && data.designationId !== before.designationId) {
      await prisma.employmentHistory.create({
        data: {
          employeeId: id,
          eventType: 'PROMOTION_TRANSFER',
          previousValue: before.designationId,
          newValue: data.designationId,
          effectiveDate: new Date().toISOString().split('T')[0],
          remarks: `Designation updated by ${actor.name}`,
        },
      });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        designation: true,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE',
      module: 'EMPLOYEES',
      recordId: id,
      beforeValues: before,
      afterValues: updated,
      reason: 'Updated employee details',
    });

    return updated;
  }

  static async archiveEmployee(id: string, organizationId: string, actor: any, reason?: string) {
    const before = await prisma.employee.findFirst({ where: { id, organizationId } });
    if (!before) throw new NotFoundError('Employee not found');

    // Check if employee has linked payroll runs
    const payrollCount = await prisma.payrollRunEmployee.count({ where: { employeeId: id } });

    // Safe archival: soft-delete
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        employmentStatus: 'TERMINATED',
      },
    });

    // Also deactivate linked user if any
    if (before.userId) {
      await prisma.user.update({
        where: { id: before.userId },
        data: { isActive: false },
      });
    }

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELETE',
      module: 'EMPLOYEES',
      recordId: id,
      beforeValues: before,
      afterValues: updated,
      reason: reason || `Archived employee profile (Preserved ${payrollCount} historical payroll records)`,
    });

    return { success: true, message: 'Employee archived safely without deleting financial history' };
  }

  // Employee Documents
  static async addDocument(organizationId: string, employeeId: string, data: any, actor: any) {
    return prisma.employeeDocument.create({
      data: {
        organizationId,
        employeeId,
        uploadedById: actor.userId,
        ...data,
      },
    });
  }

  static async getDocuments(organizationId: string, employeeId: string) {
    return prisma.employeeDocument.findMany({
      where: { organizationId, employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
