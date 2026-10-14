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

        {/* Developer Contact Card */}
        <div className="border-t border-brand-900/60 p-3.5 bg-brand-900/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
            Lead Developer & Architect
          </p>
          <p className="text-xs font-bold text-white mt-0.5">Mohamed Akeel</p>

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-brand-800/60">
            {/* Portfolio Link */}
            <a
              href="https://mohamedakeel.vercel.app"
              target="_blank"
              rel="noreferrer"
              title="Portfolio: https://mohamedakeel.vercel.app"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-800/80 hover:bg-brand-700 text-brand-200 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>

            {/* Facebook Link */}
            <a
              href="https://facebook.com/itzakeeljm"
              target="_blank"
              rel="noreferrer"
              title="Facebook: itzakeeljm"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2] text-[#1877F2] hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Email Link */}
            <a
              href="mailto:mohamedakeeljm@gmail.com"
              title="Email: mohamedakeeljm@gmail.com"
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-brand-900/60 px-4 py-2 text-[10px] text-brand-400">
          <p className="font-semibold text-brand-200">SmartHR Lanka v1.0.0</p>
        </div>
      </aside>
    </>
  );
};
