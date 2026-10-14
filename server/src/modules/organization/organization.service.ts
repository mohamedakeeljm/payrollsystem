import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class OrganizationService {
  // --- Organization Settings ---
  static async getOrganization(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        branches: true,
        departments: true,
        designations: true,
        workSchedules: true,
        shifts: true,
      },
    });
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  static async updateOrganization(id: string, data: any, actor: { userId: string; name: string; role: string }) {
    const before = await prisma.organization.findUnique({ where: { id } });
    if (!before) throw new NotFoundError('Organization not found');

    const updated = await prisma.organization.update({
      where: { id },
      data,
    });

    await AuditService.log({
      organizationId: id,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE',
      module: 'ORGANIZATION',
      recordId: id,
      beforeValues: before,
      afterValues: updated,
      reason: 'Updated organization profile and configuration',
    });

    return updated;
  }

  // --- Branches ---
  static async getBranches(organizationId: string) {
    return prisma.branch.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createBranch(organizationId: string, data: any, actor: any) {
    const branch = await prisma.branch.create({
      data: {
        organizationId,
        ...data,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'ORGANIZATION',
      recordId: branch.id,
      afterValues: branch,
    });

    return branch;
  }

  // --- Departments ---
  static async getDepartments(organizationId: string) {
    return prisma.department.findMany({
      where: { organizationId },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employees: true, designations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createDepartment(organizationId: string, data: any, actor: any) {
    const dept = await prisma.department.create({
      data: {
        organizationId,
        ...data,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'ORGANIZATION',
      recordId: dept.id,
      afterValues: dept,
    });

    return dept;
  }

  static async updateDepartment(id: string, organizationId: string, data: any, actor: any) {
    const before = await prisma.department.findFirst({ where: { id, organizationId } });
    if (!before) throw new NotFoundError('Department not found');

    const updated = await prisma.department.update({
      where: { id },
      data,
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UPDATE',
      module: 'ORGANIZATION',
      recordId: id,
      beforeValues: before,
      afterValues: updated,
    });

    return updated;
  }

  static async deleteDepartment(id: string, organizationId: string, actor: any) {
    const empCount = await prisma.employee.count({ where: { departmentId: id } });
    if (empCount > 0) {
      throw new BadRequestError(`Cannot delete department because ${empCount} employees are currently assigned to it.`);
    }

    const before = await prisma.department.findFirst({ where: { id, organizationId } });
    await prisma.department.delete({ where: { id } });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'DELETE',
      module: 'ORGANIZATION',
      recordId: id,
      beforeValues: before,
    });
  }

  // --- Designations ---
  static async getDesignations(organizationId: string, departmentId?: string) {
    const where: any = { organizationId };
    if (departmentId) where.departmentId = departmentId;

    return prisma.designation.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { level: 'asc' },
    });
  }

  static async createDesignation(organizationId: string, data: any, actor: any) {
    const desig = await prisma.designation.create({
      data: {
        organizationId,
        ...data,
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'ORGANIZATION',
      recordId: desig.id,
      afterValues: desig,
    });

    return desig;
  }

  // --- Shifts & Work Schedules ---
  static async getShifts(organizationId: string) {
    return prisma.shift.findMany({
      where: { organizationId },
      orderBy: { startTime: 'asc' },
    });
  }

  static async createShift(organizationId: string, data: any) {
    return prisma.shift.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  static async getHolidays(organizationId: string, year?: number) {
    const where: any = { organizationId };
    if (year) {
      where.date = { startsWith: `${year}` };
    }
    return prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  static async createHoliday(organizationId: string, data: any) {
    return prisma.holiday.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }
}
