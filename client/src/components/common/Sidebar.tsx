import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  Coins,
  Calculator,
  FileText,
  BadgePercent,
  BarChart3,
  ShieldCheck,
  Settings,
  Building2,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Employees',
      path: '/employees',
      icon: Users,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Leave',
      path: '/leave',
      icon: CalendarOff,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Salary Structures',
      path: '/salary',
      icon: Coins,
      roles: ['SUPER_ADMIN', 'PAYROLL_MANAGER'],
    },
    {
      title: 'Payroll Processing',
      path: '/payroll',
      icon: Calculator,
      roles: ['SUPER_ADMIN', 'PAYROLL_MANAGER'],
    },
    {
      title: 'Payslips',
      path: '/payslips',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Loans & Advances',
      path: '/loans',
      icon: BadgePercent,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'DEPT_MANAGER', 'EMPLOYEE'],
    },
    {
      title: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER'],
    },
    {
      title: 'Audit Logs',
      path: '/audit',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['SUPER_ADMIN', 'HR_MANAGER'],
    },
  ];

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-950 text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-brand-900/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">SmartHR Lanka</span>
              <span className="block text-[10px] text-brand-300 font-medium">Enterprise Edition</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-900 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Organization Name Card */}
        <div className="px-4 py-3 border-b border-brand-900/40">
          <div className="rounded-lg bg-brand-900/40 p-2.5 border border-brand-800/40">
            <p className="text-[11px] font-semibold text-brand-300 uppercase tracking-wider">
              Organization
            </p>
            <p className="text-xs font-medium text-white truncate mt-0.5">
              {user?.organization?.name || 'Lanka Tech Solutions (Pvt) Ltd'}
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  if (isOpen) onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-brand-100 hover:bg-brand-900/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-300'}`} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-brand-900/60 p-4 text-[11px] text-brand-400">
          <p className="font-semibold text-brand-200">SmartHR Lanka v1.0.0</p>
          <p className="mt-0.5">Sri Lanka Compliant (EPF/ETF/APIT)</p>
        </div>
      </aside>
    </>
  );
};
