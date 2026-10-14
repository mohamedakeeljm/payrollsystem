export interface JwtUserPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  permissions: string[];
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
  fullName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type RoleCode =
  | 'SUPER_ADMIN'
  | 'HR_MANAGER'
  | 'PAYROLL_MANAGER'
  | 'DEPT_MANAGER'
  | 'EMPLOYEE';
