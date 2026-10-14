import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  BadgePercent,
  Plus,
  CheckCircle,
  XCircle,
  DollarSign,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';

export const LoansPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const [form, setForm] = useState({
    loanType: 'SALARY_ADVANCE',
    principalAmount: 25000,
    totalInstallments: 1,
    remarks: '',
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<any[]>('/loans');
      if (res.success && res.data) {
        setLoans(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/loans/request', form);
      setIsApplyOpen(false);
      fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Failed to submit loan request');
    }
  };

  const handleReview = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const remarks = prompt(`Enter optional remarks for ${decision.toLowerCase()}:`) || '';
    try {
      await ApiClient.put(`/loans/${id}/review`, { decision, remarks });
      fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Failed to review loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Salary Advances & Loans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Employee financial support, monthly installment schedules, and payroll deductions
          </p>
        </div>

        {user?.employeeId && (
          <button
            onClick={() => setIsApplyOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Request Advance / Loan
          </button>
        )}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Advance & Loan Records</h3>
          <span className="text-xs text-slate-400">{loans.length} record(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Principal</th>
                <th className="px-6 py-3.5">Monthly Deduction</th>
                <th className="px-6 py-3.5">Installments Left</th>
                <th className="px-6 py-3.5">Outstanding Balance</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading loan records...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No active loan or salary advance requests.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {loan.employee?.firstName} {loan.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{loan.employee?.employeeId}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {loan.loanType.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      LKR {loan.principalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-rose-600 font-semibold">
                      LKR {loan.monthlyInstallment.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {loan.remainingInstallments} / {loan.totalInstallments}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      LKR {loan.outstandingBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {loan.status === 'PENDING' && hasRole('SUPER_ADMIN', 'PAYROLL_MANAGER') ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(loan.id, 'APPROVED')}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            title="Approve & Disburse"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReview(loan.id, 'REJECTED')}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Loan Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Request Salary Advance or Loan"
      >
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Request Type *</label>
            <select
              value={form.loanType}
              onChange={(e) => setForm({ ...form, loanType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="SALARY_ADVANCE">Monthly Salary Advance</option>
              <option value="COMPANY_LOAN">Company Loan</option>
              <option value="DISTRESS_LOAN">Emergency Distress Loan</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Amount (LKR) *</label>
            <input
              type="number"
              step="1000"
              min="5000"
              required
              value={form.principalAmount}
              onChange={(e) =>
                setForm({ ...form, principalAmount: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">
              Repayment Installments (Months) *
            </label>
            <input
              type="number"
              min="1"
              max="24"
              required
              value={form.totalInstallments}
              onChange={(e) =>
                setForm({ ...form, totalInstallments: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Estimated Monthly Deduction: LKR{' '}
              {Math.round(form.principalAmount / (form.totalInstallments || 1)).toLocaleString()}
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Reason / Purpose</label>
            <textarea
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApplyOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
