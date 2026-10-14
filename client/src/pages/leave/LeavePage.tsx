import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { LeaveRequest, LeaveBalance } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  CalendarOff,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  FileCheck,
} from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    totalDays: 1,
    isHalfDay: false,
    halfDayType: 'FIRST_HALF',
    reason: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      const [reqRes, typeRes] = await Promise.all([
        ApiClient.get<LeaveRequest[]>('/leave/requests'),
        ApiClient.get<any[]>('/leave/types'),
      ]);

      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (typeRes.success && typeRes.data) {
        setLeaveTypes(typeRes.data);
        if (typeRes.data[0]) {
          setApplyForm((prev) => ({ ...prev, leaveTypeId: typeRes.data[0].id }));
        }
      }

      // Fetch employee leave balances
      if (user?.employeeId) {
        const balRes = await ApiClient.get<LeaveBalance[]>('/leave/balances');
        if (balRes.success && balRes.data) setBalances(balRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await ApiClient.post('/leave/requests', applyForm);
      setIsApplyOpen(false);
      fetchLeaveData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const note = prompt(`Enter optional review note for ${decision.toLowerCase()}:`) || '';
    try {
      await ApiClient.put(`/leave/requests/${id}/review`, {
        decision,
        reviewNotes: note,
      });
      fetchLeaveData();
    } catch (err: any) {
      alert(err.message || 'Failed to review leave request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable leave policies, balances, and multi-tier approvals
          </p>
        </div>

        {user?.employeeId && (
          <button
            onClick={() => setIsApplyOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </button>
        )}
      </div>

      {/* Leave Balances Grid (if employee linked) */}
      {balances.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Your Annual Balances ({new Date().getFullYear()})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {balances.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-700">{b.leaveType.name}</span>
                  <span className="text-[10px] text-slate-400">Total: {b.allocatedDays}d</span>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-bold text-slate-900">{b.remainingDays}</span>
                  <span className="text-xs text-slate-400">days left</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Used: {b.usedDays}d</span>
                  <span>Pending: {b.pendingDays}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Leave Requests & Decisions</h3>
          <span className="text-xs text-slate-400">{requests.length} total request(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Days</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Loading leave requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {req.employee?.firstName} {req.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{req.employee?.employeeId}</p>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {req.leaveType?.name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {req.startDate} to {req.endDate}
                      {req.isHalfDay && <span className="block text-[10px] text-brand-600">Half Day</span>}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{req.totalDays}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {req.status === 'PENDING' && hasRole('SUPER_ADMIN', 'HR_MANAGER', 'DEPT_MANAGER') ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReview(req.id, 'APPROVED')}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                            title="Approve Leave"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'REJECTED')}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            title="Reject Leave"
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

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Submit Leave Application"
      >
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Leave Type *</label>
            <select
              value={applyForm.leaveTypeId}
              onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.isPaid ? 'Paid' : 'Unpaid'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Start Date *</label>
              <input
                type="date"
                required
                value={applyForm.startDate}
                onChange={(e) => {
                  setApplyForm({
                    ...applyForm,
                    startDate: e.target.value,
                    endDate: applyForm.endDate || e.target.value,
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">End Date *</label>
              <input
                type="date"
                required
                value={applyForm.endDate}
                onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyForm.isHalfDay}
                onChange={(e) =>
                  setApplyForm({
                    ...applyForm,
                    isHalfDay: e.target.checked,
                    totalDays: e.target.checked ? 0.5 : 1,
                  })
                }
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">Half Day Request</span>
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Total Days *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              value={applyForm.totalDays}
              onChange={(e) =>
                setApplyForm({ ...applyForm, totalDays: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Reason *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide context for your leave..."
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
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
              disabled={submitting}
              className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
