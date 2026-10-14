export type RoleCode =
  | 'SUPER_ADMIN'
  | 'HR_MANAGER'
  | 'PAYROLL_MANAGER'
  | 'DEPT_MANAGER'
  | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: RoleCode;
  roles?: string[];
  permissions: string[];
  employeeId?: string;
  employeeCode?: string;
  organization: {
    id: string;
    name: string;
    code: string;
    currency: string;
    timezone: string;
  };
}

export interface Employee {
  id: string;
  organizationId: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  callingName?: string;
  nicOrPassport?: string;
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  workEmail: string;
  personalEmail?: string;
  workPhone?: string;
  personalPhone?: string;
  address?: string;
  employmentType: string;
  employmentStatus: string;
  joinDate: string;
  bankName?: string;
  bankAccountNumber?: string;
  epfNumber?: string;
  tinNumber?: string;
  department?: { id: string; name: string; code: string };
  designation?: { id: string; title: string; code: string };
  branch?: { id: string; name: string };
  reportingManager?: { id: string; firstName: string; lastName: string; employeeId: string };
  salaryAssignments?: any[];
  documents?: any[];
  leaveBalances?: any[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
  status: string;
  missingClockOut: boolean;
  isCorrected: boolean;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
  };
}

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  leaveType: {
    id: string;
    name: string;
    code: string;
    isPaid: boolean;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedAt?: string;
  reviewNotes?: string;
  leaveType: { name: string; code: string; isPaid: boolean };
  employee: { id: string; employeeId: string; firstName: string; lastName: string; department?: { name: string } };
}

export interface PayrollPeriod {
  id: string;
  name: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: string;
}

export interface PayrollRun {
  id: string;
  runNumber: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'FINALIZED';
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  totalEmployerCost: number;
  employeeCount: number;
  finalizedAt?: string;
  notes?: string;
  payrollPeriod: PayrollPeriod;
  payrollRunEmployees?: any[];
}

export interface Payslip {
  id: string;
  payslipNumber: string;
  periodName: string;
  periodCode: string;
  paymentDate: string;
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  accessKey: string;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department?: { name: string };
    designation?: { title: string };
  };
}
