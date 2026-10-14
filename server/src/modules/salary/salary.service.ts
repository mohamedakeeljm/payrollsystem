import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';

export class SalaryService {
  // --- Salary Structures ---
  static async getStructures(organizationId: string) {
    return prisma.salaryStructure.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createStructure(organizationId: string, data: any, actor: any) {
    const struct = await prisma.salaryStructure.create({
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
      module: 'SALARY',
      recordId: struct.id,
      afterValues: struct,
    });

    return struct;
  }

  // --- Salary Components ---
  static async getComponents(organizationId: string) {
    return prisma.salaryComponent.findMany({
      where: { organizationId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  static async createComponent(organizationId: string, data: any, actor: any) {
    const comp = await prisma.salaryComponent.create({
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
      module: 'SALARY',
      recordId: comp.id,
      afterValues: comp,
    });

    return comp;
  }

  // --- Effective-Dated Employee Salary Assignments ---
  static async getEmployeeSalaryAssignment(employeeId: string, organizationId: string) {
    return prisma.employeeSalaryAssignment.findFirst({
      where: {
        employeeId,
        organizationId,
        isActive: true,
      },
      include: {
        salaryStructure: true,
        components: {
          include: { salaryComponent: true },
        },
      },
    });
  }

  static async getSalaryHistory(employeeId: string, organizationId: string) {
    return prisma.employeeSalaryAssignment.findMany({
      where: { employeeId, organizationId },
      include: {
        salaryStructure: true,
        components: { include: { salaryComponent: true } },
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  static async assignSalary(organizationId: string, employeeId: string, data: any, actor: any) {
    const { baseSalary, salaryStructureId, effectiveFrom, components } = data;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
    });
    if (!employee) throw new NotFoundError('Employee not found');

    // Deactivate previous active assignment and set effectiveTo
    const previousAssignment = await prisma.employeeSalaryAssignment.findFirst({
      where: { employeeId, organizationId, isActive: true },
    });

    if (previousAssignment) {
      await prisma.employeeSalaryAssignment.update({
        where: { id: previousAssignment.id },
        data: {
          isActive: false,
          effectiveTo: effectiveFrom,
        },
      });

      // Record in EmploymentHistory
      await prisma.employmentHistory.create({
        data: {
          employeeId,
          eventType: 'SALARY_REVISION',
          previousValue: `LKR ${previousAssignment.baseSalary}`,
          newValue: `LKR ${baseSalary}`,
          effectiveDate: effectiveFrom,
          remarks: `Salary revision effective from ${effectiveFrom} by ${actor.name}`,
        },
      });
    }

    const assignment = await prisma.employeeSalaryAssignment.create({
      data: {
        organizationId,
        employeeId,
        salaryStructureId,
        baseSalary: Number(baseSalary),
        effectiveFrom,
        isActive: true,
      },
    });

    // Create itemized components if provided
    if (components && Array.isArray(components)) {
      for (const comp of components) {
        await prisma.employeeSalaryComponent.create({
          data: {
            employeeSalaryAssignmentId: assignment.id,
            salaryComponentId: comp.salaryComponentId,
            amount: Number(comp.amount || 0),
            customPercentage: comp.customPercentage ? Number(comp.customPercentage) : null,
            isActive: true,
          },
        });
      }
    }

    const fullAssignment = await prisma.employeeSalaryAssignment.findUnique({
      where: { id: assignment.id },
      include: {
        components: { include: { salaryComponent: true } },
      },
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'SALARY',
      recordId: assignment.id,
      beforeValues: previousAssignment,
      afterValues: fullAssignment,
      reason: `Assigned new effective salary structure (Base: LKR ${baseSalary})`,
    });

    return fullAssignment;
  }
}
