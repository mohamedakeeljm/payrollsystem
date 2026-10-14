import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarOff,
  Coins,
  FileCheck,
  FileText,
  TrendingUp,
  AlertTriangle,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<any>('/reports/dashboard');
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const res = await ApiClient.post('/attendance/clock-in');
      setMsg(res.message || 'Clocked in successfully');
      fetchDashboard();
    } catch (err: any) {
      setMsg(err.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const res = await ApiClient.post('/attendance/clock-out');
      setMsg(res.message || 'Clocked out successfully');
      fetchDashboard();
    } catch (err: any) {
      setMsg(err.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          Loading live dashboard data...
        </div>
      </div>
    );
  }

  // --- EMPLOYEE SELF-SERVICE DASHBOARD ---
  if (user?.role === 'EMPLOYEE') {
    const isClockedIn = !!metrics?.todayAttendance?.clockIn;
    const isClockedOut = !!metrics?.todayAttendance?.clockOut;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SmartHR Employee Self-Service Portal • Colombo, Sri Lanka
          </p>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200">
            {msg}
          </div>
        )}

        {/* Quick Clock In / Out Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Attendance
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xl font-bold text-slate-900">
                {isClockedOut
                  ? 'Completed for today'
                  : isClockedIn
                  ? 'Currently Clocked In'
                  : 'Not Clocked In Yet'}
              </span>
              {metrics?.todayAttendance && (
                <StatusBadge status={metrics.todayAttendance.status} />
              )}
            </div>
            {isClockedIn && (
              <p className="text-xs text-slate-500 mt-1">
                In: {new Date(metrics.todayAttendance.clockIn).toLocaleTimeString()}
                {isClockedOut &&
                  ` | Out: ${new Date(metrics.todayAttendance.clockOut).toLocaleTimeString()}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isClockedIn && (
              <button
                onClick={handleClockIn}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                Clock In
              </button>
            )}
            {isClockedIn && !isClockedOut && (
              <button
                onClick={handleClockOut}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm disabled:opacity-60"
              >
                <LogOut className="w-4 h-4" />
                Clock Out
              </button>
            )}
          </div>
        </div>

        {/* Leave Balances Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Annual Leave Entitlements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics?.leaveBalances?.map((lb: any) => (
              <div
                key={lb.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <p className="text-xs font-semibold text-slate-500">{lb.leaveType.name}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-slate-900">{lb.remainingDays}</span>
                  <span className="text-xs text-slate-400">/ {lb.allocatedDays} days remaining</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div
                    className="bg-brand-600 h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (lb.usedDays / (lb.allocatedDays || 1)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance & Latest Payslip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Attendance</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {metrics?.recentAttendance?.map((rec: any) => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{rec.date}</span>
                  <span className="text-slate-500">{rec.totalHours} hrs</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-600 mb-2">
                <FileText className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Latest Payslip</span>
              </div>
              {metrics?.latestPayslip ? (
                <div className="mt-4 space-y-2">
                  <p className="text-lg font-bold text-slate-900">
                    LKR {metrics.latestPayslip.netPay?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Period: {metrics.latestPayslip.periodName}</p>
                  <p className="text-xs text-slate-500">Date: {metrics.latestPayslip.paymentDate}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-4">No finalized payslips available yet.</p>
              )}
            </div>
            {metrics?.latestPayslip && (
              <a
                href={`/api/v1/payslips/${metrics.latestPayslip.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 block text-center py-2 px-4 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition"
              >
                Download Payslip PDF
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN & MANAGER DASHBOARD ---
  const COLORS = ['#0c8ee9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const summary = metrics?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Executive Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live Organizational Metrics • {user?.organization?.name}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Employees"
          value={summary.activeEmployees || 0}
          subtitle="Total verified staff"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Present Today"
          value={summary.presentToday || 0}
          subtitle={`${summary.lateToday || 0} marked late`}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="On Leave Today"
          value={summary.onLeaveToday || 0}
          subtitle={`${summary.pendingLeaves || 0} pending approvals`}
          icon={CalendarOff}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Current Payroll (Net)"
          value={`LKR ${(summary.currentMonthNet || 0).toLocaleString()}`}
          subtitle={`Period: ${summary.latestPayrollPeriod}`}
          icon={Coins}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Headcount Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Department Distribution</h2>
              <p className="text-xs text-slate-400">Headcount across active business units</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.departmentDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} staff`, 'Headcount']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="employeeCount" fill="#0270c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount Breakdown Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Staff Allocation</h2>
            <p className="text-xs text-slate-400 mb-4">Department proportion</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.departmentDistribution || []}
                    dataKey="employeeCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {(metrics?.departmentDistribution || []).map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 text-xs space-y-1">
            {(metrics?.departmentDistribution || []).map((d: any, idx: number) => (
              <div key={d.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></span>
                  {d.name}
                </span>
                <span className="font-semibold">{d.employeeCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
