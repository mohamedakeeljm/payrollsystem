import { prisma } from '../../config/prisma';

export class ReportsService {
  // --- Role-Aware Live Dashboard Metrics ---
  static async getDashboardMetrics(organizationId: string, user: any) {
    const today = new Date().toISOString().split('T')[0];

    // If regular Employee: Return Personal Self-Service Dashboard
    if (user.role === 'EMPLOYEE') {
      const employeeId = user.employeeId;
      if (!employeeId) return { type: 'EMPLOYEE', message: 'No employee linked' };

      const currentYear = new Date().getFullYear();

      const [balances, myAttendanceToday, recentAttendance, pendingLeaves, latestPayslip] =
        await Promise.all([
          prisma.leaveBalance.findMany({
            where: { employeeId, year: currentYear },
            include: { leaveType: true },
          }),
          prisma.attendanceRecord.findFirst({
            where: { employeeId, date: today },
            include: { shift: true },
          }),
          prisma.attendanceRecord.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' },
            take: 7,
          }),
          prisma.leaveRequest.findMany({
            where: { employeeId, status: 'PENDING' },
            include: { leaveType: true },
          }),
          prisma.payslip.findFirst({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      return {
        type: 'EMPLOYEE',
        leaveBalances: balances,
        todayAttendance: myAttendanceToday,
        recentAttendance,
        pendingLeaves,
        latestPayslip,
      };
    }

    // Organization-wide or Department-wide Dashboard for Managers/Admins
    const deptFilter =
      user.role === 'DEPT_MANAGER' && user.departmentId ? { departmentId: user.departmentId } : {};

    const [
      activeEmployees,
      todayRecords,
      pendingLeaves,
      pendingCorrections,
      departments,
      latestPayrollRun,
      recentRuns,
    ] = await Promise.all([
      prisma.employee.count({
        where: { organizationId, employmentStatus: 'ACTIVE', deletedAt: null, ...deptFilter },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          organizationId,
          date: today,
          employee: deptFilter.departmentId ? { departmentId: deptFilter.departmentId } : undefined,
        },
      }),
      prisma.leaveRequest.count({
        where: {
          organizationId,
          status: 'PENDING',
          employee: deptFilter.departmentId ? { departmentId: deptFilter.departmentId } : undefined,
        },
      }),
      prisma.attendanceCorrection.count({
        where: { organizationId, status: 'PENDING' },
      }),
      prisma.department.findMany({
        where: { organizationId },
        include: { _count: { select: { employees: true } } },
      }),
      prisma.payrollRun.findFirst({
        where: { organizationId, status: 'FINALIZED' },
        orderBy: { finalizedAt: 'desc' },
        include: { payrollPeriod: true },
      }),
      prisma.payrollRun.findMany({
        where: { organizationId, status: 'FINALIZED' },
        orderBy: { createdAt: 'asc' },
        take: 6,
        include: { payrollPeriod: true },
      }),
    ]);

    const presentToday = todayRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateToday = todayRecords.filter((r) => r.status === 'LATE').length;
    const onLeaveToday = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absentToday = Math.max(0, activeEmployees - presentToday - onLeaveToday);

    const departmentDistribution = departments.map((d) => ({
      name: d.name,
      employeeCount: d._count.employees,
    }));

    const payrollTrends = recentRuns.map((r) => ({
      period: r.payrollPeriod.name,
      periodCode: r.payrollPeriod.periodCode,
      grossPay: r.totalGrossPay,
      netPay: r.totalNetPay,
      employerCost: r.totalEmployerCost,
      employeeCount: r.employeeCount,
    }));

    return {
      type: user.role,
      summary: {
        activeEmployees,
        presentToday,
        absentToday,
        lateToday,
        onLeaveToday,
        pendingLeaves,
        pendingCorrections,
        currentMonthGross: latestPayrollRun ? latestPayrollRun.totalGrossPay : 0,
        currentMonthNet: latestPayrollRun ? latestPayrollRun.totalNetPay : 0,
        latestPayrollPeriod: latestPayrollRun?.payrollPeriod.name || 'None',
      },
      departmentDistribution,
      payrollTrends,
    };
  }

  // --- Reports Data ---
  static async getPayrollSummaryReport(organizationId: string) {
    return prisma.payrollRun.findMany({
      where: { organizationId },
      include: {
        payrollPeriod: true,
        payrollRunEmployees: {
          select: {
            employeeCode: true,
            employeeName: true,
            departmentName: true,
            basicSalary: true,
            grossEarnings: true,
            epfEmployeeAmount: true,
            epfEmployerAmount: true,
            etfEmployerAmount: true,
            apitTaxAmount: true,
            totalDeductions: true,
            netSalary: true,
            employerTotalCost: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
