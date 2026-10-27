import {
  DEMO_USERS,
  MOCK_DASHBOARD,
  MOCK_EMPLOYEES,
  MOCK_PAYROLL_PERIODS,
  MOCK_PAYROLL_RUNS,
  MOCK_PAYSLIPS,
  MOCK_LEAVE_REQUESTS,
  MOCK_LEAVE_BALANCES,
  MOCK_ATTENDANCE,
  MOCK_AUDIT_LOGS,
} from './mockData';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api/v1';

export class ApiClient {
  private static getToken(): string | null {
    return localStorage.getItem('smarthr_token');
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data: T; message?: string; meta?: any }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check if response is actually JSON and not an HTML 404/error page from Vercel
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const json = await response.json();
        return json;
      }

      // If server returned 401 on an authenticated endpoint and we had a token
      if (response.status === 401 && !endpoint.includes('/auth/login') && !token?.startsWith('demo_')) {
        localStorage.removeItem('smarthr_token');
        localStorage.removeItem('smarthr_user');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      // If backend is not running (e.g. Vercel pure frontend live demo or 404/500/HTML)
      return this.handleMockFallback<T>(endpoint, options);
    } catch {
      // Network failure / server offline -> Seamless fallback to offline Demo Mode for Vercel
      return this.handleMockFallback<T>(endpoint, options);
    }
  }

  private static handleMockFallback<T>(
    endpoint: string,
    options: RequestInit = {}
  ): { success: boolean; data: T; message?: string; meta?: any } {
    const cleanEndpoint = endpoint.split('?')[0];

    // Auth Login
    if (cleanEndpoint.includes('/auth/login')) {
      let email = 'admin@smarthr.lk';
      try {
        if (options.body) {
          const parsed = JSON.parse(String(options.body));
          if (parsed.email) email = parsed.email.toLowerCase().trim();
        }
      } catch {
        // use default admin
      }

      const user = DEMO_USERS[email] || DEMO_USERS['admin@smarthr.lk'];
      const demoToken = 'demo_token_' + user.role.toLowerCase() + '_' + Date.now();
      localStorage.setItem('smarthr_token', demoToken);
      localStorage.setItem('smarthr_user', JSON.stringify(user));

      return {
        success: true,
        message: 'Live Demo Login Successful',
        data: {
          tokens: { accessToken: demoToken, refreshToken: 'demo_refresh' },
          user,
        } as unknown as T,
      };
    }

    // Auth Me
    if (cleanEndpoint.includes('/auth/me')) {
      const savedUser = localStorage.getItem('smarthr_user');
      const user = savedUser ? JSON.parse(savedUser) : DEMO_USERS['admin@smarthr.lk'];
      return {
        success: true,
        data: user as unknown as T,
      };
    }

    // Auth Logout
    if (cleanEndpoint.includes('/auth/logout')) {
      localStorage.removeItem('smarthr_token');
      localStorage.removeItem('smarthr_user');
      return { success: true, message: 'Logged out successfully', data: {} as T };
    }

    // Reports / Dashboard
    if (cleanEndpoint.includes('/reports/dashboard')) {
      return { success: true, data: MOCK_DASHBOARD as unknown as T };
    }
    if (cleanEndpoint.includes('/reports/payroll')) {
      return { success: true, data: MOCK_PAYROLL_RUNS as unknown as T };
    }

    // Employees
    if (cleanEndpoint === '/employees') {
      return { success: true, data: MOCK_EMPLOYEES as unknown as T };
    }

    // Attendance
    if (cleanEndpoint === '/attendance') {
      return { success: true, data: MOCK_ATTENDANCE as unknown as T };
    }
    if (cleanEndpoint.includes('/attendance/clock-in')) {
      return { success: true, message: 'Clocked in at 08:30 AM (Demo Mode)', data: {} as T };
    }
    if (cleanEndpoint.includes('/attendance/clock-out')) {
      return { success: true, message: 'Clocked out at 05:30 PM (Demo Mode)', data: {} as T };
    }

    // Leaves
    if (cleanEndpoint.includes('/leave/requests')) {
      return { success: true, data: MOCK_LEAVE_REQUESTS as unknown as T };
    }
    if (cleanEndpoint.includes('/leave/balances')) {
      return { success: true, data: MOCK_LEAVE_BALANCES as unknown as T };
    }
    if (cleanEndpoint.includes('/leave/types')) {
      return {
        success: true,
        data: [
          { id: '1', name: 'Annual Leave' },
          { id: '2', name: 'Casual Leave' },
          { id: '3', name: 'Medical Leave' },
        ] as unknown as T,
      };
    }

    // Payroll
    if (cleanEndpoint.includes('/payroll/periods')) {
      return { success: true, data: MOCK_PAYROLL_PERIODS as unknown as T };
    }
    if (cleanEndpoint.includes('/payroll/runs')) {
      return { success: true, data: MOCK_PAYROLL_RUNS as unknown as T };
    }
    if (cleanEndpoint.includes('/payroll/preview')) {
      return { success: true, data: MOCK_PAYROLL_RUNS[0] as unknown as T };
    }

    // Payslips
    if (cleanEndpoint.includes('/payslips')) {
      return { success: true, data: MOCK_PAYSLIPS as unknown as T };
    }

    // Loans
    if (cleanEndpoint.includes('/loans')) {
      return { success: true, data: [] as unknown as T };
    }

    // Audit logs
    if (cleanEndpoint.includes('/audit-logs')) {
      return { success: true, data: MOCK_AUDIT_LOGS as unknown as T };
    }

    // Organization
    if (cleanEndpoint === '/organization') {
      return { success: true, data: DEMO_USERS['admin@smarthr.lk'].organization as unknown as T };
    }
    if (cleanEndpoint.includes('/organization/departments')) {
      return {
        success: true,
        data: [
          { id: 'dept-1', name: 'Engineering', code: 'ENG' },
          { id: 'dept-2', name: 'Human Resources', code: 'HR' },
          { id: 'dept-3', name: 'Finance & Accounts', code: 'FIN' },
          { id: 'dept-4', name: 'Operations', code: 'OPS' },
        ] as unknown as T,
      };
    }
    if (cleanEndpoint.includes('/organization/designations')) {
      return {
        success: true,
        data: [
          { id: 'des-1', title: 'Lead Software Architect' },
          { id: 'des-2', title: 'Senior Fullstack Engineer' },
          { id: 'des-3', title: 'Head of People & HR' },
          { id: 'des-4', title: 'Senior Payroll Manager' },
        ] as unknown as T,
      };
    }
    if (cleanEndpoint.includes('/organization/branches')) {
      return {
        success: true,
        data: [
          { id: 'br-1', name: 'Colombo Head Office', code: 'COL-HQ' },
          { id: 'br-2', name: 'Kandy Regional Branch', code: 'KDY-BR' },
        ] as unknown as T,
      };
    }
    if (cleanEndpoint.includes('/organization/shifts')) {
      return {
        success: true,
        data: [
          { id: 'sh-1', name: 'Standard General Shift (08:30 - 17:00)' },
        ] as unknown as T,
      };
    }
    if (cleanEndpoint.includes('/organization/holidays')) {
      return {
        success: true,
        data: MOCK_DASHBOARD.upcomingHolidays as unknown as T,
      };
    }

    // Default safe fallback
    return {
      success: true,
      message: 'Operation completed in Live Demo mode',
      data: [] as unknown as T,
    };
  }

  static get<T = any>(endpoint: string, params?: Record<string, any>) {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          search.append(k, String(v));
        }
      }
      const qs = search.toString();
      if (qs) url += `?${qs}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  static post<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
