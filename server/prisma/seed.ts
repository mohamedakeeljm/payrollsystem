import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SmartHR Lanka database seeding...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { code: 'LTS' },
    update: {},
    create: {
      name: 'Lanka Tech Solutions (Pvt) Ltd',
      code: 'LTS',
      taxNumber: 'VAT-102938475-7000',
      email: 'info@lankatech.lk',
      phone: '+94 11 234 5678',
      address: 'Level 12, World Trade Center, Echelon Square, Colombo 01, Sri Lanka',
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      fiscalYearStart: '01-01',
    },
  });

  console.log(`🏢 Organization created: ${org.name} (${org.code})`);

  // 2. Create Branches
  const colomboBranch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'COL-HQ' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Colombo Head Office',
      code: 'COL-HQ',
      address: 'Level 12, World Trade Center, Colombo 01',
      phone: '+94 11 234 5678',
      isHeadOffice: true,
    },
  });

  const kandyBranch = await prisma.branch.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'KDY-BR' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Kandy Regional Branch',
      code: 'KDY-BR',
      address: '45 Peradeniya Road, Kandy',
      phone: '+94 81 222 3344',
      isHeadOffice: false,
    },
  });

  // 3. Create Departments
  const deptEngineering = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ENG' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      name: 'Software Engineering',
      code: 'ENG',
      description: 'Product development and cloud infrastructure',
    },
  });

  const deptHR = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'HR' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      name: 'Human Resources & Talent',
      code: 'HR',
      description: 'Employee relations, talent management and compliance',
    },
  });

  const deptFinance = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'FIN' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      name: 'Finance & Payroll',
      code: 'FIN',
      description: 'Financial reporting, accounting, statutory compliance, and payroll',
    },
  });

  const deptSales = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SALES' } },
    update: {},
    create: {
      organizationId: org.id,
      branchId: colomboBranch.id,
      name: 'Sales & Business Development',
      code: 'SALES',
      description: 'Client acquisition and corporate accounts',
    },
  });

  // 4. Create Designations
  const desigHeadEng = await prisma.designation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'HEAD_ENG' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptEngineering.id,
      title: 'Head of Engineering',
      code: 'HEAD_ENG',
      level: 5,
    },
  });

  const desigSnrDev = await prisma.designation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'SNR_SWE' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptEngineering.id,
      title: 'Senior Software Engineer',
      code: 'SNR_SWE',
      level: 3,
    },
  });

  const desigHrMgr = await prisma.designation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'HR_MGR' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptHR.id,
      title: 'HR Manager',
      code: 'HR_MGR',
      level: 4,
    },
  });

  const desigPayrollMgr = await prisma.designation.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'PAYROLL_MGR' } },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptFinance.id,
      title: 'Payroll Manager',
      code: 'PAYROLL_MGR',
      level: 4,
    },
  });

  // 5. Create Roles & System Permissions
  const roleCodes = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', desc: 'Full organization system control' },
    { code: 'HR_MANAGER', name: 'HR Manager', desc: 'Employee, attendance, and leave administration' },
    { code: 'PAYROLL_MANAGER', name: 'Payroll Manager', desc: 'Salary configuration, processing and payslips' },
    { code: 'DEPT_MANAGER', name: 'Department Manager', desc: 'Team member attendance and leave approvals' },
    { code: 'EMPLOYEE', name: 'Employee', desc: 'Self-service portal access' },
  ];

  const rolesMap: Record<string, any> = {};
  for (const r of roleCodes) {
    const role = await prisma.role.upsert({
      where: { organizationId_code: { organizationId: org.id, code: r.code } },
      update: {},
      create: {
        organizationId: org.id,
        name: r.name,
        code: r.code,
        description: r.desc,
        isSystem: true,
      },
    });
    rolesMap[r.code] = role;
  }

  // 6. Create Work Schedule & Shifts
  await prisma.workSchedule.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'STD-44H' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Standard Sri Lankan Office Schedule',
      code: 'STD-44H',
      mondayHours: 8.0,
      tuesdayHours: 8.0,
      wednesdayHours: 8.0,
      thursdayHours: 8.0,
      fridayHours: 8.0,
      saturdayHours: 4.0,
      sundayHours: 0.0,
      standardWeeklyHours: 44.0,
      isDefault: true,
    },
  });

  const generalShift = await prisma.shift.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'GEN-SHIFT' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'General Day Shift (8:30 AM - 5:30 PM)',
      code: 'GEN-SHIFT',
      startTime: '08:30',
      endTime: '17:30',
      gracePeriodMinutes: 15,
      breakDurationMinutes: 60,
    },
  });

  // 7. Create Official Sri Lankan Statutory Rule Set
  await prisma.statutoryRuleSet.create({
    data: {
      organizationId: org.id,
      name: 'Sri Lanka Statutory Regulations 2026',
      effectiveFrom: '2026-01-01',
      epfEmployeeRate: 8.0, // 8%
      epfEmployerRate: 12.0, // 12%
      etfEmployerRate: 3.0, // 3%
      apitTaxFreeAllowanceMonthly: 100000.0, // LKR 100,000 monthly exemption
      apitTaxSlabsJson: JSON.stringify([
        { limit: 41666.67, rate: 0.06 },
        { limit: 41666.67, rate: 0.12 },
        { limit: 41666.67, rate: 0.18 },
        { limit: 41666.67, rate: 0.24 },
        { limit: 41666.67, rate: 0.30 },
        { limit: 999999999, rate: 0.36 },
      ]),
      standardMonthlyWorkDays: 26,
      standardMonthlyWorkHours: 200,
      overtimeNormalRate: 1.5,
      overtimeHolidayRate: 2.0,
      isVerifiedSriLankan: true,
      isDefault: true,
      notes: 'Sri Lankan EPF, ETF, and Inland Revenue Department progressive APIT brackets.',
    },
  });

  // 8. Create Standard Sri Lankan Leave Types
  const leaveAnnual = await prisma.leaveType.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ANNUAL' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Annual Leave',
      code: 'ANNUAL',
      defaultDaysPerYear: 14.0,
      isPaid: true,
      carryForwardMax: 7.0,
    },
  });

  const leaveCasual = await prisma.leaveType.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'CASUAL' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Casual Leave',
      code: 'CASUAL',
      defaultDaysPerYear: 7.0,
      isPaid: true,
    },
  });

  const leaveMedical = await prisma.leaveType.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'MEDICAL_SICK' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Medical / Sick Leave',
      code: 'MEDICAL_SICK',
      defaultDaysPerYear: 14.0,
      isPaid: true,
      requiresDocument: true,
    },
  });

  const leaveNoPay = await prisma.leaveType.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'NO_PAY' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'No-Pay Leave',
      code: 'NO_PAY',
      defaultDaysPerYear: 0.0,
      isPaid: false,
    },
  });

  // 9. Create Standard Salary Components
  const compHousing = await prisma.salaryComponent.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'HOUSING' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Housing Allowance',
      code: 'HOUSING',
      type: 'EARNING',
      isRecurring: true,
      isEpfApplicable: false,
      isTaxable: true,
    },
  });

  const compTransport = await prisma.salaryComponent.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'TRANSPORT' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Fixed Transport Allowance (Budgetary Relief)',
      code: 'TRANSPORT',
      type: 'EARNING',
      isRecurring: true,
      isEpfApplicable: true, // EPF eligible
      isTaxable: true,
    },
  });

  const compAttendance = await prisma.salaryComponent.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'ATTENDANCE_ALLOWANCE' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Attendance Incentive',
      code: 'ATTENDANCE_ALLOWANCE',
      type: 'EARNING',
      isRecurring: true,
      isEpfApplicable: false,
      isTaxable: true,
    },
  });

  // 10. Seed Demo Users & Employees
  const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);

  const usersData = [
    {
      email: 'admin@smarthr.lk',
      firstName: 'Priyantha',
      lastName: 'Fernando',
      role: 'SUPER_ADMIN',
      empCode: 'EMP-0001',
      title: 'Chief Technology Officer',
      deptId: deptEngineering.id,
      desigId: desigHeadEng.id,
      baseSalary: 450000,
      epfNo: 'EPF-1001',
      bankName: 'Commercial Bank of Ceylon',
      bankAcc: '8001234567',
    },
    {
      email: 'hrmanager@smarthr.lk',
      firstName: 'Dilani',
      lastName: 'Wickramasinghe',
      role: 'HR_MANAGER',
      empCode: 'EMP-0002',
      title: 'HR Manager',
      deptId: deptHR.id,
      desigId: desigHrMgr.id,
      baseSalary: 280000,
      epfNo: 'EPF-1002',
      bankName: 'Hatton National Bank',
      bankAcc: '5009876543',
    },
    {
      email: 'payroll@smarthr.lk',
      firstName: 'Ramesh',
      lastName: 'Jayawardena',
      role: 'PAYROLL_MANAGER',
      empCode: 'EMP-0003',
      title: 'Senior Payroll Specialist',
      deptId: deptFinance.id,
      desigId: desigPayrollMgr.id,
      baseSalary: 240000,
      epfNo: 'EPF-1003',
      bankName: 'Sampath Bank',
      bankAcc: '1004567890',
    },
    {
      email: 'manager.eng@smarthr.lk',
      firstName: 'Sanjaya',
      lastName: 'Senanayake',
      role: 'DEPT_MANAGER',
      empCode: 'EMP-0004',
      title: 'Engineering Lead',
      deptId: deptEngineering.id,
      desigId: desigHeadEng.id,
      baseSalary: 350000,
      epfNo: 'EPF-1004',
      bankName: 'Commercial Bank of Ceylon',
      bankAcc: '8005551234',
    },
    {
      email: 'kasun@smarthr.lk',
      firstName: 'Kasun',
      lastName: 'Perera',
      role: 'EMPLOYEE',
      empCode: 'EMP-0005',
      title: 'Senior Software Engineer',
      deptId: deptEngineering.id,
      desigId: desigSnrDev.id,
      baseSalary: 180000,
      epfNo: 'EPF-1005',
      bankName: 'Bank of Ceylon',
      bankAcc: '0003456789',
    },
  ];

  const currentYear = new Date().getFullYear();

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email: u.email } },
      update: {},
      create: {
        organizationId: org.id,
        email: u.email,
        passwordHash: defaultPasswordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: '+94 77 123 4567',
        isActive: true,
      },
    });

    // Assign Role
    const role = rolesMap[u.role];
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }

    // Create Employee Profile
    const emp = await prisma.employee.upsert({
      where: { organizationId_employeeId: { organizationId: org.id, employeeId: u.empCode } },
      update: {},
      create: {
        organizationId: org.id,
        branchId: colomboBranch.id,
        departmentId: u.deptId,
        designationId: u.desigId,
        userId: user.id,
        employeeId: u.empCode,
        firstName: u.firstName,
        lastName: u.lastName,
        callingName: u.firstName,
        nicOrPassport: '199012345678V',
        gender: 'MALE',
        dateOfBirth: '1990-05-15',
        maritalStatus: 'MARRIED',
        workEmail: u.email,
        personalEmail: `${u.firstName.toLowerCase()}@gmail.com`,
        workPhone: '+94 11 234 5678',
        personalPhone: '+94 77 888 9999',
        address: 'No 45, Flower Road, Colombo 07, Sri Lanka',
        employmentType: 'PERMANENT',
        employmentStatus: 'ACTIVE',
        joinDate: '2023-01-15',
        bankName: u.bankName,
        bankAccountNumber: u.bankAcc,
        bankAccountName: `${u.firstName} ${u.lastName}`,
        epfNumber: u.epfNo,
        tinNumber: 'TIN-987654321',
      },
    });

    // Assign Salary Structure
    const salaryAssignment = await prisma.employeeSalaryAssignment.create({
      data: {
        organizationId: org.id,
        employeeId: emp.id,
        baseSalary: u.baseSalary,
        effectiveFrom: '2026-01-01',
        isActive: true,
      },
    });

    // Add Transport & Housing Allowances
    await prisma.employeeSalaryComponent.createMany({
      data: [
        {
          employeeSalaryAssignmentId: salaryAssignment.id,
          salaryComponentId: compTransport.id,
          amount: 25000,
          isActive: true,
        },
        {
          employeeSalaryAssignmentId: salaryAssignment.id,
          salaryComponentId: compHousing.id,
          amount: 35000,
          isActive: true,
        },
      ],
    });

    // Seed Leave Balances
    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: leaveAnnual.id, year: currentYear } },
      update: {},
      create: {
        organizationId: org.id,
        employeeId: emp.id,
        leaveTypeId: leaveAnnual.id,
        year: currentYear,
        allocatedDays: 14.0,
        usedDays: 3.0,
        pendingDays: 0.0,
        remainingDays: 11.0,
      },
    });

    await prisma.leaveBalance.upsert({
      where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: leaveCasual.id, year: currentYear } },
      update: {},
      create: {
        organizationId: org.id,
        employeeId: emp.id,
        leaveTypeId: leaveCasual.id,
        year: currentYear,
        allocatedDays: 7.0,
        usedDays: 1.0,
        pendingDays: 0.0,
        remainingDays: 6.0,
      },
    });

    // Seed Sample Today Attendance
    const today = new Date().toISOString().split('T')[0];
    const clockInTime = new Date();
    clockInTime.setHours(8, 25, 0, 0);

    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: emp.id, date: today } },
      update: {},
      create: {
        organizationId: org.id,
        employeeId: emp.id,
        shiftId: generalShift.id,
        date: today,
        clockIn: clockInTime,
        status: 'PRESENT',
        totalHours: 8.0,
      },
    });
  }

  // 11. Seed a Sample Finalized Payroll Period & Run
  const period = await prisma.payrollPeriod.upsert({
    where: { organizationId_periodCode: { organizationId: org.id, periodCode: '2026-09' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'September 2026',
      periodCode: '2026-09',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      paymentDate: '2026-09-28',
      status: 'FINALIZED',
    },
  });

  const payrollRun = await prisma.payrollRun.upsert({
    where: {
      organizationId_payrollPeriodId_runNumber: {
        organizationId: org.id,
        payrollPeriodId: period.id,
        runNumber: 'PR-2026-09-001',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      payrollPeriodId: period.id,
      runNumber: 'PR-2026-09-001',
      status: 'FINALIZED',
      totalGrossPay: 1700000,
      totalNetPay: 1462000,
      totalEmployeeDeductions: 238000,
      totalEmployerContributions: 255000,
      totalEmployerCost: 1955000,
      employeeCount: 5,
      finalizedAt: new Date(),
      notes: 'Demo finalized September 2026 payroll run',
    },
  });

  console.log(`✅ Seeded demo payroll run: ${payrollRun.runNumber}`);
  console.log('🎉 SmartHR Lanka database seeding completed successfully!');
  console.log('-------------------------------------------------------');
  console.log('Demo Credentials for All Roles (Password: Admin@123):');
  console.log('1. Super Admin:       admin@smarthr.lk');
  console.log('2. HR Manager:         hrmanager@smarthr.lk');
  console.log('3. Payroll Manager:    payroll@smarthr.lk');
  console.log('4. Dept Manager:       manager.eng@smarthr.lk');
  console.log('5. Employee:           kasun@smarthr.lk');
  console.log('-------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
