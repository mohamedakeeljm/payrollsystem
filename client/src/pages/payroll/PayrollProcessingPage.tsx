import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { PayrollPeriod, PayrollRun } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Calculator,
  Lock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Coins,
  ShieldCheck,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const PayrollProcessingPage: React.FC = () => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedRunDetails, setSelectedRunDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchPeriodsAndRuns = async () => {
    try {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        ApiClient.get<PayrollPeriod[]>('/payroll/periods'),
        ApiClient.get<PayrollRun[]>('/payroll/runs'),
      ]);

      if (pRes.success && pRes.data) {
        setPeriods(pRes.data);
        if (pRes.data[0] && !selectedPeriodId) {
          setSelectedPeriodId(pRes.data[0].id);
        }
      }
      if (rRes.success && rRes.data) {
        setRuns(rRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodsAndRuns();
  }, []);

  const handleGeneratePreview = async () => {
    if (!selectedPeriodId) return;
    try {
      setPreviewLoading(true);
      setMsg(null);
      const res = await ApiClient.get<any>(`/payroll/preview/${selectedPeriodId}`);
      if (res.success && res.data) {
        setPreviewData(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedPeriodId) return;
    try {
      setActionLoading(true);
      const res = await ApiClient.post<PayrollRun>('/payroll/runs', {
        periodId: selectedPeriodId,
        notes: 'Monthly payroll run processed via SmartHR Lanka',
      });
      setMsg(`Draft Payroll Run ${res.data.runNumber} created successfully! You can now review and finalize it.`);
      fetchPeriodsAndRuns();
    } catch (err: any) {
      alert(err.message || 'Failed to create payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async (runId: string, runNumber: string) => {
    if (!window.confirm(`Are you sure you want to FINALIZE and LOCK ${runNumber}? This action is irreversible, creates permanent employee payslips, updates loan repayments, and establishes an immutable financial snapshot.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await ApiClient.post(`/payroll/runs/${runId}/finalize`);
      setMsg(`Payroll Run ${runNumber} has been FINALIZED and locked. All individual payslips are now available for employee download.`);
      fetchPeriodsAndRuns();
    } catch (err: any) {
      alert(err.message || 'Failed to finalize payroll run');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRunDetails = async (runId: string) => {
    try {
      const res = await ApiClient.get<any>(`/payroll/runs/${runId}`);
      if (res.success && res.data) {
        setSelectedRunDetails(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load run details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payroll Processing Engine</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Execute decimal-safe Sri Lankan payroll runs with automated EPF (8%/12%), ETF (3%), APIT progressive tax, and payslips
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Period Selection & Run Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          1. Select Payroll Period
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Period *</label>
            <select
              value={selectedPeriodId}
              onChange={(e) => {
                setSelectedPeriodId(e.target.value);
                setPreviewData(null);
              }}
              className="w-full px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.periodCode}) — Status: {p.status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              onClick={handleGeneratePreview}
              disabled={previewLoading || !selectedPeriodId}
              className="px-5 py-2.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              {previewLoading ? 'Calculating...' : 'Generate Live Preview'}
            </button>

            {previewData && (
              <button
                onClick={handleCreateDraft}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Create Draft Payroll Run'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Calculation Table */}
      {previewData && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Gross Payroll</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                LKR {previewData.summary.totalGrossPay?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Net Disbursable</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                LKR {previewData.summary.totalNetPay?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Employee Deductions</span>
              <p className="text-xl font-bold text-rose-600 mt-1">
                LKR {previewData.summary.totalEmployeeDeductions?.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Employer Cost (EPF+ETF)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                LKR {previewData.summary.totalEmployerCost?.toLocaleString()}
              </p>
            </div>
          </div>

          {previewData.warnings?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Exceptions & Warnings ({previewData.warnings.length}):</span>
              </div>
              {previewData.warnings.map((w: string, idx: number) => (
                <p key={idx} className="pl-6">• {w}</p>
              ))}
            </div>
          )}

          {/* Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Calculated Employee Breakdown ({previewData.employees.length} eligible staff)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Base Salary</th>
                    <th className="px-5 py-3">Allowances</th>
                    <th className="px-5 py-3">Gross Earnings</th>
                    <th className="px-5 py-3">EPF 8%</th>
                    <th className="px-5 py-3">APIT Tax</th>
                    <th className="px-5 py-3">Total Deductions</th>
                    <th className="px-5 py-3 font-bold text-slate-900">Net Pay (LKR)</th>
                    <th className="px-5 py-3">Employer EPF/ETF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.employees.map((e: any) => (
                    <tr key={e.employeeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{e.employeeName}</p>
                        <p className="text-[10px] text-slate-400">{e.employeeCode}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{e.basicSalary.toLocaleString()}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {(e.totalAllowances + e.overtimeEarnings).toLocaleString()}
                        {e.overtimeEarnings > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            +{e.overtimeEarnings} OT
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {e.grossEarnings.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-rose-600 font-medium">
                        {e.epfEmployeeAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-rose-600 font-medium">
                        {e.apitTaxAmount > 0 ? e.apitTaxAmount.toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-3 text-rose-700 font-semibold">
                        {e.totalDeductions.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-bold text-emerald-700 text-sm">
                        {e.netSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-[11px] text-slate-500">
                        EPF: {e.epfEmployerAmount.toLocaleString()}
                        <br />
                        ETF: {e.etfEmployerAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historical Payroll Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Payroll Runs History & Finalization</h3>
          <span className="text-xs text-slate-400">{runs.length} run(s) recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Run Code</th>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5">Employees</th>
                <th className="px-6 py-3.5">Total Gross</th>
                <th className="px-6 py-3.5">Total Net Disbursable</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No payroll runs recorded yet. Select a period above to start.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-900">
                      {r.runNumber}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {r.payrollPeriod?.name || 'Period'} ({r.payrollPeriod?.periodCode})
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{r.employeeCount} staff</td>
                    <td className="px-6 py-3.5 text-slate-800 font-medium">
                      LKR {r.totalGrossPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-emerald-700 font-bold">
                      LKR {r.totalNetPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewRunDetails(r.id)}
                          className="px-2.5 py-1 rounded-lg border text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"
                        >
                          View Details
                        </button>
                        {r.status === 'DRAFT' && (
                          <button
                            onClick={() => handleFinalize(r.id, r.runNumber)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <Lock className="w-3 h-3" />
                            Finalize & Lock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Details Modal */}
      {selectedRunDetails && (
        <Modal
          isOpen={!!selectedRunDetails}
          onClose={() => setSelectedRunDetails(null)}
          title={`Payroll Run Summary: ${selectedRunDetails.runNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Period</span>
                <span className="font-bold text-slate-900">{selectedRunDetails.payrollPeriod?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Total Net</span>
                <span className="font-bold text-emerald-600">
                  LKR {selectedRunDetails.totalNetPay?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Staff Count</span>
                <span className="font-bold text-slate-900">{selectedRunDetails.employeeCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status</span>
                <StatusBadge status={selectedRunDetails.status} />
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Staff</th>
                    <th className="px-4 py-2">Basic</th>
                    <th className="px-4 py-2">Gross</th>
                    <th className="px-4 py-2">EPF 8%</th>
                    <th className="px-4 py-2">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedRunDetails.payrollRunEmployees?.map((re: any) => (
                    <tr key={re.id}>
                      <td className="px-4 py-2 font-medium">{re.employeeName}</td>
                      <td className="px-4 py-2">{re.basicSalary?.toLocaleString()}</td>
                      <td className="px-4 py-2">{re.grossEarnings?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-rose-600">{re.epfEmployeeAmount?.toLocaleString()}</td>
                      <td className="px-4 py-2 font-bold text-emerald-600">{re.netSalary?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
