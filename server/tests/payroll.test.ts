import { describe, it, expect } from 'vitest';
import { PayrollCalculator, StatutoryConfig, roundToCents } from '../src/modules/payroll/payroll.calculator';

describe('SmartHR Lanka Payroll Engine - Unit Tests', () => {
  const defaultConfig: StatutoryConfig = {
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

  it('correctly rounds values to cents', () => {
    expect(roundToCents(123.456)).toBe(123.46);
    expect(roundToCents(123.454)).toBe(123.45);
    expect(roundToCents(100)).toBe(100.0);
  });

  it('calculates APIT as 0 for income within tax-free relief allowance (<= 100,000 LKR)', () => {
    const tax = PayrollCalculator.calculateApit(95000, defaultConfig);
    expect(tax).toBe(0.0);

    const taxExact = PayrollCalculator.calculateApit(100000, defaultConfig);
    expect(taxExact).toBe(0.0);
  });

  it('calculates APIT accurately on first bracket (6%) above exemption threshold', () => {
    // 120,000 income -> 20,000 taxable above 100,000 at 6% = 1,200.00 LKR
    const tax = PayrollCalculator.calculateApit(120000, defaultConfig);
    expect(tax).toBe(1200.0);
  });

  it('calculates standard Sri Lankan EPF and ETF for an employee with basic salary', () => {
    const input = {
      employeeId: 'emp-1',
      employeeCode: 'EMP-001',
      employeeName: 'Kasun Perera',
      baseSalary: 100000,
      components: [
        {
          name: 'Fixed Transport Allowance',
          code: 'TRANS',
          type: 'EARNING' as const,
          amount: 20000,
          isTaxable: true,
          isEpfEligible: true, // Budgetary/fixed allowance included in EPF
        },
      ],
      noPayDays: 0,
      overtimeHoursNormal: 10,
      overtimeHoursHoliday: 0,
      loanDeduction: 5000,
    };

    const result = PayrollCalculator.calculateEmployeePayroll(input, defaultConfig);

    // Overtime: (100,000 / 200) * 1.5 * 10 = 500 * 1.5 * 10 = 7,500 LKR
    expect(result.overtimeEarnings).toBe(7500);

    // Gross: 100,000 (basic) + 20,000 (allowance) + 7,500 (OT) = 127,500 LKR
    expect(result.grossEarnings).toBe(127500);

    // EPF Eligible: 100,000 + 20,000 = 120,000 LKR
    expect(result.epfEligibleEarnings).toBe(120000);

    // Employee EPF 8%: 120,000 * 0.08 = 9,600 LKR
    expect(result.epfEmployeeAmount).toBe(9600);

    // Employer EPF 12%: 120,000 * 0.12 = 14,400 LKR
    expect(result.epfEmployerAmount).toBe(14400);

    // Employer ETF 3%: 120,000 * 0.03 = 3,600 LKR
    expect(result.etfEmployerAmount).toBe(3600);

    // Taxable earnings: 100,000 + 20,000 + 7,500 = 127,500 LKR
    // APIT: (127,500 - 100,000) * 0.06 = 27,500 * 0.06 = 1,650 LKR
    expect(result.apitTaxAmount).toBe(1650);

    // Total deductions: EPF (9,600) + APIT (1,650) + Loan (5,000) = 16,250 LKR
    expect(result.totalDeductions).toBe(16250);

    // Net salary: 127,500 - 16,250 = 111,250 LKR
    expect(result.netSalary).toBe(111250);

    // Employer total cost: Gross (127,500) + Employer EPF (14,400) + ETF (3,600) = 145,500 LKR
    expect(result.employerTotalCost).toBe(145500);
  });

  it('handles No-Pay days deductions correctly', () => {
    const input = {
      employeeId: 'emp-2',
      employeeCode: 'EMP-002',
      employeeName: 'Nimali Silva',
      baseSalary: 130000,
      components: [],
      noPayDays: 2, // 2 days no pay
      overtimeHoursNormal: 0,
      overtimeHoursHoliday: 0,
      loanDeduction: 0,
    };

    // Daily rate = 130,000 / 26 = 5,000
    // No-pay deduction = 5,000 * 2 = 10,000 LKR
    const result = PayrollCalculator.calculateEmployeePayroll(input, defaultConfig);

    expect(result.noPayDeductions).toBe(10000);
    // Basic after no-pay = 120,000 -> EPF 8% = 9,600
    expect(result.epfEligibleEarnings).toBe(120000);
    expect(result.epfEmployeeAmount).toBe(9600);
  });
});
