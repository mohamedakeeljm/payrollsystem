import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  CalendarCheck,
  Clock,
  LogIn,
  LogOut,
  Plus,
  AlertCircle,
  FileEdit,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Clock Actions
  const [clockMsg, setClockMsg] = useState<string | null>(null);
  const [clockLoading, setClockLoading] = useState(false);

  // Modals
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isOtOpen, setIsOtOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Correction Form State
  const [correctionForm, setCorrectionForm] = useState({
    proposedClockIn: '',
    proposedClockOut: '',
    reason: '',
  });

  // Overtime Form State
  const [otForm, setOtForm] = useState({
    date: new Date().toISOString().split('T')[0],
    hoursRequested: 2.0,
    otType: 'NORMAL_1_5X',
    reason: '',
  });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<AttendanceRecord[]>('/attendance', {
        startDate,
        endDate,
      });
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [startDate, endDate]);

  const handleClockIn = async () => {
    try {
      setClockLoading(true);
      const res = await ApiClient.post('/attendance/clock-in');
      setClockMsg(res.message || 'Clocked in successfully');
      fetchAttendance();
    } catch (err: any) {
      setClockMsg(err.message || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockLoading(true);
      const res = await ApiClient.post('/attendance/clock-out');
      setClockMsg(res.message || 'Clocked out successfully');
      fetchAttendance();
    } catch (err: any) {
      setClockMsg(err.message || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await ApiClient.post('/attendance/corrections', {
        attendanceRecordId: selectedRecord.id,
        ...correctionForm,
      });
      setIsCorrectionOpen(false);
      setClockMsg('Attendance correction request submitted for manager review');
      fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction');
    }
  };

  const handleOtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/attendance/overtime', otForm);
      setIsOtOpen(false);
      setClockMsg('Overtime approval request submitted');
      fetchAttendance();
    } catch (err: any) {
      alert(err.message || 'Failed to submit overtime');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance & Shifts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time daily tracking, shifts, overtime, and manual adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.employeeId && (
            <>
              <button
                onClick={handleClockIn}
                disabled={clockLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                Clock In
              </button>
              <button
                onClick={handleClockOut}
                disabled={clockLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm disabled:opacity-60"
              >
                <LogOut className="w-4 h-4" />
                Clock Out
              </button>
            </>
          )}

          <button
            onClick={() => setIsOtOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Request Overtime
          </button>
        </div>
      </div>

      {clockMsg && (
        <div className="p-3 rounded-xl bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200">
          {clockMsg}
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold text-slate-700">Filter Date Range:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-brand-600 hover:underline text-xs"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Clock In</th>
                <th className="px-6 py-3.5">Clock Out</th>
                <th className="px-6 py-3.5">Hours</th>
                <th className="px-6 py-3.5">Late / OT</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{rec.date}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-800">
                        {rec.employee?.firstName} {rec.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{rec.employee?.employeeId}</p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{rec.totalHours} hrs</td>
                    <td className="px-6 py-3.5 text-[11px]">
                      {rec.lateMinutes > 0 && (
                        <span className="text-orange-600 block">Late: {rec.lateMinutes}m</span>
                      )}
                      {rec.overtimeMinutes > 0 && (
                        <span className="text-emerald-600 block">OT: {rec.overtimeMinutes}m</span>
                      )}
                      {rec.lateMinutes === 0 && rec.overtimeMinutes === 0 && (
                        <span className="text-slate-400">On time</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={rec.status} />
                        {rec.isCorrected && (
                          <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-1.5 py-0.5 rounded">
                            Adjusted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsCorrectionOpen(true);
                        }}
                        className="text-slate-500 hover:text-brand-600 p-1 rounded"
                        title="Request Adjustment"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Adjustment Modal */}
      {selectedRecord && (
        <Modal
          isOpen={isCorrectionOpen}
          onClose={() => setIsCorrectionOpen(false)}
          title={`Request Attendance Correction (${selectedRecord.date})`}
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Proposed Clock-In</label>
              <input
                type="datetime-local"
                required
                value={correctionForm.proposedClockIn}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, proposedClockIn: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Proposed Clock-Out</label>
              <input
                type="datetime-local"
                value={correctionForm.proposedClockOut}
                onChange={(e) =>
                  setCorrectionForm({ ...correctionForm, proposedClockOut: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Reason for Correction *</label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Card reader error, client visit in the morning..."
                value={correctionForm.reason}
                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCorrectionOpen(false)}
                className="px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Overtime Request Modal */}
      <Modal
        isOpen={isOtOpen}
        onClose={() => setIsOtOpen(false)}
        title="Request Overtime Authorization"
      >
        <form onSubmit={handleOtSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Date *</label>
            <input
              type="date"
              required
              value={otForm.date}
              onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Hours Requested *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              required
              value={otForm.hoursRequested}
              onChange={(e) =>
                setOtForm({ ...otForm, hoursRequested: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Rate Type *</label>
            <select
              value={otForm.otType}
              onChange={(e) => setOtForm({ ...otForm, otType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="NORMAL_1_5X">Normal Overtime (1.5x Hourly Rate)</option>
              <option value="DOUBLE_2_0X">Holiday / Sunday Overtime (2.0x Hourly Rate)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Business Justification *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Critical release deployment, client audit support..."
              value={otForm.reason}
              onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOtOpen(false)}
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
