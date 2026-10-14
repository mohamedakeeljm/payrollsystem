/**
 * SmartHR Lanka - Decimal-Safe Sri Lankan Payroll Calculation Engine
 * Currency: Sri Lankan Rupees (LKR)
 */

export interface StatutoryConfig {
  epfEmployeeRate: number; // e.g. 8.0
  epfEmployerRate: number; // e.g. 12.0
  etfEmployerRate: number; // e.g. 3.0
  apitTaxFreeAllowanceMonthly: number; // e.g. 100,000 LKR
  apitTaxSlabs: Array<{ limit: number; rate: number }>;
  standardMonthlyWorkDays: number; // e.g. 26
  standardMonthlyWorkHours: number; // e.g. 200
  overtimeNormalRate: number; // e.g. 1.5
  overtimeHolidayRate: number; // e.g. 2.0
}

export interface EmployeePayrollInput {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName?: string;
  designationName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  baseSalary: number;
  components: Array<{
    name: string;
    code: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
    isTaxable: boolean;
    isEpfEligible: boolean;
  }>;
  noPayDays: number;
  overtimeHoursNormal: number;
  overtimeHoursHoliday: number;
  loanDeduction: number;
}

export interface PayrollCalculationOutput {
  basicSalary: number;
  totalAllowances: number;
  totalBonuses: number;
  overtimeEarnings: number;
  noPayDeductions: number;
  grossEarnings: number;
  epfEligibleEarnings: number;
  epfEmployeeAmount: number; // 8%
  epfEmployerAmount: number; // 12%
  etfEmployerAmount: number; // 3%
  taxableEarnings: number;
  apitTaxAmount: number;     // APIT Paye Tax
  loanDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  employerTotalCost: number;
  itemizedEarnings: Array<{ name: string; code: string; amount: number; isTaxable: boolean; isEpfEligible: boolean }>;
  itemizedDeductions: Array<{ name: string; code: string; amount: number; deductionType: string }>;
  calculationSnapshotJson: string;
}

// Decimal-safe rounding to 2 decimal places
export const roundToCents = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export class PayrollCalculator {
  /**
   * Calculates progressive APIT (Advance Personal Income Tax) for Sri Lanka
   */
  static calculateApit(taxableIncome: number, config: StatutoryConfig): number {
    if (taxableIncome <= config.apitTaxFreeAllowanceMonthly) {
      return 0.0;
    }

    let remainingTaxable = taxableIncome - config.apitTaxFreeAllowanceMonthly;
    let totalTax = 0.0;

    for (const slab of config.apitTaxSlabs) {
      if (remainingTaxable <= 0) break;
      const slabAmount = Math.min(remainingTaxable, slab.limit);
      totalTax += slabAmount * slab.rate;
      remainingTaxable -= slabAmount;
    }

    return roundToCents(totalTax);
  }

  /**
   * Calculates monthly payroll breakdown for an employee
   */
  static calculateEmployeePayroll(
    input: EmployeePayrollInput,
    config: StatutoryConfig
  ): PayrollCalculationOutput {
    const basic = roundToCents(input.baseSalary);

    // 1. Calculate No-Pay Deduction
    const standardDays = config.standardMonthlyWorkDays || 26;
    const dailyRate = standardDays > 0 ? basic / standardDays : 0;
    const noPayDeductions = roundToCents(dailyRate * (input.noPayDays || 0));

    // Basic after no-pay for EPF calculation in Sri Lanka
    const basicAfterNoPay = Math.max(0, basic - noPayDeductions);

    // 2. Earnings and EPF Eligibility
    let totalAllowances = 0.0;
    let totalBonuses = 0.0;
    let epfEligibleAllowances = 0.0;
    let taxableAllowances = 0.0;

    const itemizedEarnings: Array<{
      name: string;
      code: string;
      amount: number;
      isTaxable: boolean;
      isEpfEligible: boolean;
    }> = [
      {
        name: 'Basic Salary',
        code: 'BASIC',
        amount: basic,
        isTaxable: true,
        isEpfEligible: true,
      },
    ];

    for (const comp of input.components) {
      if (comp.type === 'EARNING') {
        const amt = roundToCents(comp.amount);
        if (comp.code === 'BONUS' || comp.code === 'COMMISSION') {
          totalBonuses = roundToCents(totalBonuses + amt);
        } else {
          totalAllowances = roundToCents(totalAllowances + amt);
        }

        if (comp.isEpfEligible) {
          epfEligibleAllowances = roundToCents(epfEligibleAllowances + amt);
        }
        if (comp.isTaxable) {
          taxableAllowances = roundToCents(taxableAllowances + amt);
        }

        itemizedEarnings.push({
          name: comp.name,
          code: comp.code,
          amount: amt,
          isTaxable: comp.isTaxable,
          isEpfEligible: comp.isEpfEligible,
        });
      }
    }

    // 3. Overtime Earnings
    const standardHours = config.standardMonthlyWorkHours || 200;
    const hourlyRate = standardHours > 0 ? basic / standardHours : 0;
    const normalOtAmount = roundToCents(hourlyRate * config.overtimeNormalRate * (input.overtimeHoursNormal || 0));
    const holidayOtAmount = roundToCents(hourlyRate * config.overtimeHolidayRate * (input.overtimeHoursHoliday || 0));
    const overtimeEarnings = roundToCents(normalOtAmount + holidayOtAmount);

    if (overtimeEarnings > 0) {
      itemizedEarnings.push({
        name: `Overtime (${(input.overtimeHoursNormal || 0) + (input.overtimeHoursHoliday || 0)} hrs)`,
        code: 'OVERTIME',
        amount: overtimeEarnings,
        isTaxable: true,
        isEpfEligible: false,
      });
    }

    // 4. Gross Earnings
    const grossEarnings = roundToCents(
      basic + totalAllowances + totalBonuses + overtimeEarnings
    );

    // 5. EPF Eligible Earnings (Basic after no-pay + EPF-eligible fixed allowances)
    const epfEligibleEarnings = roundToCents(basicAfterNoPay + epfEligibleAllowances);

    // 6. Sri Lankan Statutory Contributions
    const epfEmployeeAmount = roundToCents(epfEligibleEarnings * (config.epfEmployeeRate / 100)); // 8%
    const epfEmployerAmount = roundToCents(epfEligibleEarnings * (config.epfEmployerRate / 100)); // 12%
    const etfEmployerAmount = roundToCents(epfEligibleEarnings * (config.etfEmployerRate / 100)); // 3%

    // 7. Sri Lankan APIT (PAYE) Tax
    const taxableEarnings = roundToCents(
      basicAfterNoPay + taxableAllowances + totalBonuses + overtimeEarnings
    );
    const apitTaxAmount = this.calculateApit(taxableEarnings, config);

    // 8. Deductions Itemization
    const itemizedDeductions: Array<{
      name: string;
      code: string;
      amount: number;
      deductionType: string;
    }> = [];

    // Statutory Employee EPF (8%)
    if (epfEmployeeAmount > 0) {
      itemizedDeductions.push({
        name: `EPF Employee (${config.epfEmployeeRate}%)`,
        code: 'EPF_EMP',
        amount: epfEmployeeAmount,
        deductionType: 'STATUTORY',
      });
    }

    // Statutory APIT
    if (apitTaxAmount > 0) {
      itemizedDeductions.push({
        name: 'APIT (PAYE) Tax',
        code: 'APIT_TAX',
        amount: apitTaxAmount,
        deductionType: 'STATUTORY',
      });
    }

    // No-Pay Deduction
    if (noPayDeductions > 0) {
      itemizedDeductions.push({
        name: `No-Pay Deduction (${input.noPayDays} days)`,
        code: 'NO_PAY',
        amount: noPayDeductions,
        deductionType: 'NO_PAY',
      });
    }

    // Salary Advance / Loan Installments
    const loanDeductions = roundToCents(input.loanDeduction || 0);
    if (loanDeductions > 0) {
      itemizedDeductions.push({
        name: 'Loan / Advance Repayment',
        code: 'LOAN_INSTALLMENT',
        amount: loanDeductions,
        deductionType: 'LOAN',
      });
    }

    // Other Custom Deductions from components
    let otherDeductions = 0.0;
    for (const comp of input.components) {
      if (comp.type === 'DEDUCTION') {
        const amt = roundToCents(comp.amount);
        otherDeductions = roundToCents(otherDeductions + amt);
        itemizedDeductions.push({
          name: comp.name,
          code: comp.code,
          amount: amt,
          deductionType: 'VOLUNTARY',
        });
      }
    }

    // 9. Total Employee Deductions & Net Salary
    const totalDeductions = roundToCents(
      epfEmployeeAmount + apitTaxAmount + noPayDeductions + loanDeductions + otherDeductions
    );

    const netSalary = roundToCents(grossEarnings - totalDeductions);

    // 10. Employer Total Cost (Gross + Employer EPF 12% + Employer ETF 3%)
    const employerTotalCost = roundToCents(
      grossEarnings + epfEmployerAmount + etfEmployerAmount
    );

    const calculationSnapshotJson = JSON.stringify({
      config,
      input,
      summary: {
        basicSalary: basic,
        noPayDeductions,
        totalAllowances,
        totalBonuses,
        overtimeEarnings,
        grossEarnings,
        epfEligibleEarnings,
        epfEmployeeAmount,
        epfEmployerAmount,
        etfEmployerAmount,
        taxableEarnings,
        apitTaxAmount,
        loanDeductions,
        otherDeductions,
        totalDeductions,
        netSalary,
        employerTotalCost,
      },
    });

    return {
      basicSalary: basic,
      totalAllowances,
      totalBonuses,
      overtimeEarnings,
      noPayDeductions,
      grossEarnings,
      epfEligibleEarnings,
      epfEmployeeAmount,
      epfEmployerAmount,
      etfEmployerAmount,
      taxableEarnings,
      apitTaxAmount,
      loanDeductions,
      otherDeductions,
      totalDeductions,
      netSalary,
      employerTotalCost,
      itemizedEarnings,
      itemizedDeductions,
      calculationSnapshotJson,
    };
  }
}
