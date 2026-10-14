import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { ShieldCheck, Search, Filter, Calendar, Eye, Terminal } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const AuditLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filters
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<any[]>('/audit-logs', { module, action });
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [module, action]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Enterprise Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable, append-only security logs of critical business, financial, and organizational actions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Modules</option>
          <option value="AUTH">Authentication</option>
          <option value="EMPLOYEES">Employees</option>
          <option value="ATTENDANCE">Attendance</option>
          <option value="LEAVE">Leave</option>
          <option value="SALARY">Salary</option>
          <option value="PAYROLL">Payroll</option>
          <option value="LOANS">Loans</option>
          <option value="ORGANIZATION">Organization</option>
        </select>

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="FINALIZE">FINALIZE</option>
          <option value="LOGIN">LOGIN</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Audit Trail</h3>
          <span className="text-xs text-slate-400">{logs.length} logged event(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Module</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Reason / Description</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No audit logs matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">{log.actorName}</p>
                      <span className="text-[10px] text-brand-600 font-medium">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{log.module}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.action === 'CREATE'
                            ? 'bg-blue-50 text-blue-700'
                            : log.action === 'FINALIZE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : log.action === 'DELETE'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-sm truncate" title={log.reason}>
                      {log.reason || 'Operation recorded'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-slate-500 hover:text-slate-800"
                        title="View Snapshot"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action} (${selectedLog.module})`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-lg border text-slate-700 space-y-1">
              <p>Actor: {selectedLog.actorName} ({selectedLog.actorRole})</p>
              <p>Timestamp: {new Date(selectedLog.createdAt).toISOString()}</p>
              <p>Reason: {selectedLog.reason || 'N/A'}</p>
            </div>

            {selectedLog.afterValuesJson && (
              <div>
                <p className="font-bold text-slate-700 mb-1">State Snapshot (Sanitized):</p>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px] max-h-60">
                  {JSON.stringify(JSON.parse(selectedLog.afterValuesJson), null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
