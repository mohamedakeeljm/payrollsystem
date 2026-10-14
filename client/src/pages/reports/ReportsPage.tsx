import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { BarChart3, Download, TrendingUp, Users, Calendar, Coins } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [repRes, dashRes] = await Promise.all([
          ApiClient.get<any[]>('/reports/payroll'),
          ApiClient.get<any>('/reports/dashboard'),
        ]);

        if (repRes.success && repRes.data) setReportsData(repRes.data);
        if (dashRes.success && dashRes.data) setDashboardMetrics(dashRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const exportPayrollCsv = () => {
    if (!reportsData.length) return;
    const rows = [
      ['Period', 'Run Code', 'Staff Count', 'Gross Pay (LKR)', 'Employee Deductions (LKR)', 'Net Disbursed (LKR)', 'Employer Cost (LKR)', 'Status'],
    ];

    for (const r of reportsData) {
      rows.push([
        r.payrollPeriod?.name || '',
        r.runNumber,
        String(r.employeeCount),
        String(r.totalGrossPay),
        String(r.totalEmployeeDeductions),
        String(r.totalNetPay),
        String(r.totalEmployerCost),
        r.status,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartHR_Payroll_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = (dashboardMetrics?.payrollTrends || []).map((t: any) => ({
    name: t.period,
    gross: t.grossPay,
    net: t.netPay,
    cost: t.employerCost,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportable organization-wide HR, Attendance, and Payroll summaries
          </p>
        </div>

        <button
          onClick={exportPayrollCsv}
          disabled={reportsData.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export Payroll Summary (CSV)
        </button>
      </div>

      {/* Visual Chart Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Monthly Payroll Cost Trajectory</h2>
        <p className="text-xs text-slate-400 mb-4">
          Gross earnings vs Net Disbursed vs Total Employer Cost (LKR)
        </p>

        <div className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No historical trend data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8ee9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0c8ee9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`LKR ${Number(val).toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="gross"
                  name="Gross Payroll"
                  stroke="#0c8ee9"
                  fillOpacity={1}
                  fill="url(#colorGross)"
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Net Salary"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorNet)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historical Payroll Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Finalized Payroll Run Summaries</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5">Run Code</th>
                <th className="px-6 py-3.5">Staff Count</th>
                <th className="px-6 py-3.5">Gross Pay</th>
                <th className="px-6 py-3.5">Deductions</th>
                <th className="px-6 py-3.5 font-bold text-slate-900">Net Disbursable</th>
                <th className="px-6 py-3.5">Employer Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading reports...
                  </td>
                </tr>
              ) : reportsData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No finalized payroll runs to report.
                  </td>
                </tr>
              ) : (
                reportsData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {r.payrollPeriod?.name}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">{r.runNumber}</td>
                    <td className="px-6 py-3.5 text-slate-600">{r.employeeCount} staff</td>
                    <td className="px-6 py-3.5 text-slate-800">LKR {r.totalGrossPay.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-rose-600 font-medium">
                      LKR {r.totalEmployeeDeductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-700 text-sm">
                      LKR {r.totalNetPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-800 font-semibold">
                      LKR {r.totalEmployerCost.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
