import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuditService } from '../audit/audit.service';
import { PayrollCalculator, StatutoryConfig, roundToCents } from './payroll.calculator';

export class PayrollService {
  // --- Statutory Rule Sets ---
  static async getStatutoryRuleSet(organizationId: string): Promise<StatutoryConfig> {
    const ruleSet = await prisma.statutoryRuleSet.findFirst({
      where: { organizationId, isDefault: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!ruleSet) {
      // Default official Sri Lankan parameters
      return {
        epfEmployeeRate: 8.0,
        epfEmployerRate: 12.0,
        etfEmployerRate: 3.0,
        apitTaxFreeAllowanceMonthly: 100000.0,
        apitTaxSlabs: [
          { limit: 41666.67, rate: 0.06 },
          { limit: 41666.67, rate: 0.12 },
          { limit: 41666.67, rate: 0.18 },
          { limit: 41666.67, rate: 0.24 },
          { limit: 41666.67, rate: 0.30 },
          { limit: 999999999, rate: 0.36 },
        ],
        standardMonthlyWorkDays: 26,
        standardMonthlyWorkHours: 200,
        overtimeNormalRate: 1.5,
        overtimeHolidayRate: 2.0,
      };
    }

    let slabs: any[] = [];
    try {
      slabs = JSON.parse(ruleSet.apitTaxSlabsJson);
    } catch {
      slabs = [{ limit: 999999999, rate: 0.06 }];
    }

    return {
      epfEmployeeRate: ruleSet.epfEmployeeRate,
      epfEmployerRate: ruleSet.epfEmployerRate,
      etfEmployerRate: ruleSet.etfEmployerRate,
      apitTaxFreeAllowanceMonthly: ruleSet.apitTaxFreeAllowanceMonthly,
      apitTaxSlabs: slabs,
      standardMonthlyWorkDays: ruleSet.standardMonthlyWorkDays,
      standardMonthlyWorkHours: ruleSet.standardMonthlyWorkHours,
      overtimeNormalRate: ruleSet.overtimeNormalRate,
      overtimeHolidayRate: ruleSet.overtimeHolidayRate,
    };
  }

  // --- Payroll Periods ---
  static async getPeriods(organizationId: string) {
    return prisma.payrollPeriod.findMany({
      where: { organizationId },
      include: {
        payrollRuns: {
          select: {
            id: true,
            runNumber: true,
            status: true,
            totalGrossPay: true,
            totalNetPay: true,
            employeeCount: true,
            finalizedAt: true,
          },
        },
      },
      orderBy: { periodCode: 'desc' },
    });
  }

  static async createPeriod(organizationId: string, data: any) {
    const existing = await prisma.payrollPeriod.findFirst({
      where: { organizationId, periodCode: data.periodCode },
    });
    if (existing) {
      throw new BadRequestError(`Payroll period ${data.periodCode} already exists.`);
    }

    return prisma.payrollPeriod.create({
      data: {
        organizationId,
        ...data,
      },
    });
  }

  // --- Generate Payroll Preview ---
  static async previewPayroll(organizationId: string, periodId: string) {
    const period = await prisma.payrollPeriod.findFirst({
      where: { id: periodId, organizationId },
    });
    if (!period) throw new NotFoundError('Payroll period not found');

    const config = await this.getStatutoryRuleSet(organizationId);

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { organizationId, employmentStatus: 'ACTIVE', deletedAt: null },
      include: {
        department: true,
        designation: true,
        salaryAssignments: {
          where: { isActive: true },
          include: {
            components: {
              where: { isActive: true },
              include: { salaryComponent: true },
            },
          },
        },
        employeeLoans: {
          where: { status: 'ACTIVE' },
        },
        overtimeRequests: {
          where: {
            status: 'APPROVED',
            date: { gte: period.startDate, lte: period.endDate },
          },
        },
        leaveRequests: {
          where: {
            status: 'APPROVED',
            startDate: { gte: period.startDate },
            endDate: { lte: period.endDate },
          },
          include: { leaveType: true },
        },
      },
    });

    const warnings: string[] = [];
    const calculatedEmployees: any[] = [];

    let totalGross = 0;
    let totalNet = 0;
    let totalEmployeeDeductions = 0;
    let totalEmployerContributions = 0;
    let totalEmployerCost = 0;

    for (const emp of employees) {
      const activeSalary = emp.salaryAssignments[0];
      if (!activeSalary) {
        warnings.push(`Employee ${emp.firstName} ${emp.lastName} (${emp.employeeId}) has no active salary structure assigned. Skipped from preview.`);
        continue;
      }

      // Sum active loans monthly installments
      const monthlyLoanDeduction = emp.employeeLoans.reduce(
        (sum, l) => sum + Math.min(l.monthlyInstallment, l.outstandingBalance),
        0
      );

      // Sum approved overtime hours
      let otNormal = 0;
      let otHoliday = 0;
      for (const ot of emp.overtimeRequests) {
        if (ot.otType === 'DOUBLE_2_0X') {
          otHoliday += ot.hoursRequested;
        } else {
          otNormal += ot.hoursRequested;
        }
      }

      // Sum approved No-Pay days
      let noPayDays = 0;
      for (const lv of emp.leaveRequests) {
        if (lv.leaveType.code === 'NO_PAY') {
          noPayDays += lv.totalDays;
        }
      }

      // Format components
      const components = activeSalary.components.map((c) => ({
        name: c.salaryComponent.name,
        code: c.salaryComponent.code,
        type: c.salaryComponent.type as 'EARNING' | 'DEDUCTION',
        amount: c.amount,
        isTaxable: c.salaryComponent.isTaxable,
        isEpfEligible: c.salaryComponent.isEpfApplicable,
      }));

      const calc = PayrollCalculator.calculateEmployeePayroll(
        {
          employeeId: emp.id,
          employeeCode: emp.employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          departmentName: emp.department?.name,
          designationName: emp.designation?.title,
          bankAccountNumber: emp.bankAccountNumber || undefined,
          bankName: emp.bankName || undefined,
          baseSalary: activeSalary.baseSalary,
          components,
          noPayDays,
          overtimeHoursNormal: otNormal,
          overtimeHoursHoliday: otHoliday,
          loanDeduction: monthlyLoanDeduction,
        },
        config
      );

      totalGross = roundToCents(totalGross + calc.grossEarnings);
      totalNet = roundToCents(totalNet + calc.netSalary);
      totalEmployeeDeductions = roundToCents(totalEmployeeDeductions + calc.totalDeductions);
      totalEmployerContributions = roundToCents(
        totalEmployerContributions + calc.epfEmployerAmount + calc.etfEmployerAmount
      );
      totalEmployerCost = roundToCents(totalEmployerCost + calc.employerTotalCost);

      calculatedEmployees.push({
        employeeId: emp.id,
        employeeCode: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.name,
        designation: emp.designation?.title,
        bankAccountNumber: emp.bankAccountNumber,
        bankName: emp.bankName,
        noPayDays,
        overtimeHours: otNormal + otHoliday,
        ...calc,
      });
    }

    return {
      period,
      summary: {
        employeeCount: calculatedEmployees.length,
        totalGrossPay: totalGross,
        totalNetPay: totalNet,
        totalEmployeeDeductions,
        totalEmployerContributions,
        totalEmployerCost,
      },
      warnings,
      employees: calculatedEmployees,
    };
  }

  // --- Create / Finalize Payroll Run ---
  static async createPayrollRun(
    organizationId: string,
    periodId: string,
    notes: string | undefined,
    actor: any
  ) {
    const period = await prisma.payrollPeriod.findFirst({
      where: { id: periodId, organizationId },
    });
    if (!period) throw new NotFoundError('Payroll period not found');

    // Prevent duplicate active or finalized runs for the same period
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        organizationId,
        payrollPeriodId: periodId,
        status: { in: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'FINALIZED'] },
      },
    });

    if (existingRun && existingRun.status === 'FINALIZED') {
      throw new BadRequestError(
        `Payroll for period ${period.periodCode} is already FINALIZED and locked. Corrections require an administrative reversal workflow.`
      );
    }

    const preview = await this.previewPayroll(organizationId, periodId);
    if (preview.employees.length === 0) {
      throw new BadRequestError('Cannot process payroll: no eligible employees found with active salary structures.');
    }

    const runCount = await prisma.payrollRun.count({ where: { organizationId } });
    const runNumber = `PR-${period.periodCode}-${(runCount + 1).toString().padStart(3, '0')}`;

    // Create Draft Payroll Run with all employee calculations
    const payrollRun = await prisma.$transaction(async (tx) => {
      const run = await tx.payrollRun.create({
        data: {
          organizationId,
          payrollPeriodId: periodId,
          runNumber,
          status: 'DRAFT',
          totalGrossPay: preview.summary.totalGrossPay,
          totalNetPay: preview.summary.totalNetPay,
          totalEmployeeDeductions: preview.summary.totalEmployeeDeductions,
          totalEmployerContributions: preview.summary.totalEmployerContributions,
          totalEmployerCost: preview.summary.totalEmployerCost,
          employeeCount: preview.summary.employeeCount,
          processedById: actor.userId,
          notes,
        },
      });

      for (const emp of preview.employees) {
        const runEmp = await tx.payrollRunEmployee.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            employeeName: emp.employeeName,
            departmentName: emp.department,
            designationName: emp.designation,
            bankAccountNumber: emp.bankAccountNumber,
            bankName: emp.bankName,
            basicSalary: emp.basicSalary,
            totalAllowances: emp.totalAllowances,
            totalBonuses: emp.totalBonuses,
            overtimeEarnings: emp.overtimeEarnings,
            noPayDeductions: emp.noPayDeductions,
            noPayDays: emp.noPayDays,
            grossEarnings: emp.grossEarnings,
            epfEligibleEarnings: emp.epfEligibleEarnings,
            epfEmployeeAmount: emp.epfEmployeeAmount,
            epfEmployerAmount: emp.epfEmployerAmount,
            etfEmployerAmount: emp.etfEmployerAmount,
            apitTaxAmount: emp.apitTaxAmount,
            loanDeductions: emp.loanDeductions,
            otherDeductions: emp.otherDeductions,
            totalDeductions: emp.totalDeductions,
            netSalary: emp.netSalary,
            employerTotalCost: emp.employerTotalCost,
            status: 'DRAFT',
            calculationSnapshotJson: emp.calculationSnapshotJson,
          },
        });

        // Insert itemized earnings
        for (const earn of emp.itemizedEarnings) {
          await tx.payrollEarning.create({
            data: {
              payrollRunEmployeeId: runEmp.id,
              name: earn.name,
              code: earn.code,
              amount: earn.amount,
              isTaxable: earn.isTaxable,
              isEpfEligible: earn.isEpfEligible,
            },
          });
        }

        // Insert itemized deductions
        for (const ded of emp.itemizedDeductions) {
          await tx.payrollDeduction.create({
            data: {
              payrollRunEmployeeId: runEmp.id,
              name: ded.name,
              code: ded.code,
              amount: ded.amount,
              deductionType: ded.deductionType,
            },
          });
        }
      }

      return run;
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CREATE',
      module: 'PAYROLL',
      recordId: payrollRun.id,
      afterValues: payrollRun,
      reason: `Generated Draft Payroll Run ${runNumber} for ${preview.summary.employeeCount} employees`,
    });

    return payrollRun;
  }

  // --- Finalize Payroll Run (Atomic Lock & Payslip Generation) ---
  static async finalizePayrollRun(runId: string, organizationId: string, actor: any) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, organizationId },
      include: {
        payrollPeriod: true,
        payrollRunEmployees: {
          include: {
            employee: true,
            earnings: true,
            deductions: true,
          },
        },
      },
    });

    if (!run) throw new NotFoundError('Payroll run not found');
    if (run.status === 'FINALIZED') {
      throw new BadRequestError('This payroll run is already FINALIZED and locked.');
    }

    const now = new Date();

    const finalizedRun = await prisma.$transaction(async (tx) => {
      // 1. Lock the Payroll Run
      const updatedRun = await tx.payrollRun.update({
        where: { id: runId },
        data: {
          status: 'FINALIZED',
          finalizedById: actor.userId,
          finalizedAt: now,
        },
      });

      // 2. Mark period as FINALIZED
      await tx.payrollPeriod.update({
        where: { id: run.payrollPeriodId },
        data: { status: 'FINALIZED' },
      });

      // 3. For each employee, generate payslip and update loan balances
      for (const runEmp of run.payrollRunEmployees) {
        // Mark employee record approved
        await tx.payrollRunEmployee.update({
          where: { id: runEmp.id },
          data: { status: 'APPROVED' },
        });

        // Deduct active loan if employee had loan deduction
        if (runEmp.loanDeductions > 0) {
          const activeLoan = await tx.employeeLoan.findFirst({
            where: { employeeId: runEmp.employeeId, status: 'ACTIVE' },
          });

          if (activeLoan) {
            const newBal = Math.max(0, activeLoan.outstandingBalance - runEmp.loanDeductions);
            const remainingInst = Math.max(0, activeLoan.remainingInstallments - 1);

            await tx.employeeLoan.update({
              where: { id: activeLoan.id },
              data: {
                outstandingBalance: newBal,
                remainingInstallments: remainingInst,
                status: newBal <= 0 ? 'PAID_OFF' : 'ACTIVE',
              },
            });

            await tx.loanTransaction.create({
              data: {
                loanId: activeLoan.id,
                payrollRunEmployeeId: runEmp.id,
                transactionType: 'PAYROLL_DEDUCTION',
                amount: runEmp.loanDeductions,
                balanceAfter: newBal,
                paymentDate: run.payrollPeriod.paymentDate,
                remarks: `Automated deduction via Payroll ${run.runNumber}`,
              },
            });
          }
        }

        // Generate Payslip record with unique secure accessKey
        const payslipNumber = `PS-${run.payrollPeriod.periodCode}-${runEmp.employeeCode}`;
        const accessKey = `${runEmp.id}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

        const existingSlip = await tx.payslip.findFirst({
          where: { payslipNumber },
        });

        if (!existingSlip) {
          await tx.payslip.create({
            data: {
              organizationId,
              payrollRunEmployeeId: runEmp.id,
              employeeId: runEmp.employeeId,
              payslipNumber,
              periodName: run.payrollPeriod.name,
              periodCode: run.payrollPeriod.periodCode,
              paymentDate: run.payrollPeriod.paymentDate,
              grossPay: runEmp.grossEarnings,
              netPay: runEmp.netSalary,
              totalDeductions: runEmp.totalDeductions,
              accessKey,
            },
          });
        }
      }

      return updatedRun;
    });

    await AuditService.log({
      organizationId,
      userId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'FINALIZE',
      module: 'PAYROLL',
      recordId: runId,
      afterValues: finalizedRun,
      reason: `Finalized and locked payroll run ${run.runNumber}. Generated payslips for ${run.payrollRunEmployees.length} employees.`,
    });

    return finalizedRun;
  }

  static async getPayrollRuns(organizationId: string) {
    return prisma.payrollRun.findMany({
      where: { organizationId },
      include: {
        payrollPeriod: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getPayrollRunById(runId: string, organizationId: string) {
    const run = await prisma.payrollRun.findFirst({
      where: { id: runId, organizationId },
      include: {
        payrollPeriod: true,
        payrollRunEmployees: {
          include: {
            earnings: true,
            deductions: true,
            payslips: true,
          },
        },
      },
    });

    if (!run) throw new NotFoundError('Payroll run not found');
    return run;
  }
}
