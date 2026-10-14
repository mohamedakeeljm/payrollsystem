import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { Layout } from './components/common/Layout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeeDirectoryPage } from './pages/employees/EmployeeDirectoryPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { LeavePage } from './pages/leave/LeavePage';
import { SalaryStructuresPage } from './pages/salary/SalaryStructuresPage';
import { PayrollProcessingPage } from './pages/payroll/PayrollProcessingPage';
import { PayslipsPage } from './pages/payslips/PayslipsPage';
import { LoansPage } from './pages/loans/LoansPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { OrganizationSettingsPage } from './pages/settings/OrganizationSettingsPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    if (window.location.pathname && window.location.pathname !== '/') {
      setCurrentPath(window.location.pathname);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Initializing SmartHR Lanka...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/employees':
        return <EmployeeDirectoryPage />;
      case '/attendance':
        return <AttendancePage />;
      case '/leave':
        return <LeavePage />;
      case '/salary':
        return <SalaryStructuresPage />;
      case '/payroll':
        return <PayrollProcessingPage />;
      case '/payslips':
        return <PayslipsPage />;
      case '/loans':
        return <LoansPage />;
      case '/reports':
        return <ReportsPage />;
      case '/audit':
        return <AuditLogsPage />;
      case '/settings':
        return <OrganizationSettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
};

export default App;
