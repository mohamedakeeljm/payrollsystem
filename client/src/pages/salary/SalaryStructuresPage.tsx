import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import {
  Coins,
  Plus,
  ShieldCheck,
  Check,
  UserCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const SalaryStructuresPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [components, setComponents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Component Form State
  const [compForm, setCompForm] = useState({
    name: '',
    code: '',
    type: 'EARNING',
    calculationType: 'FIXED',
    isEpfApplicable: false,
    isEtfApplicable: false,
    isTaxable: true,
  });

  // Assign Salary Form State
  const [assignForm, setAssignForm] = useState({
    employeeId: '',
    baseSalary: 100000,
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, structRes, empRes] = await Promise.all([
        ApiClient.get<any[]>('/salary/components'),
        ApiClient.get<any[]>('/salary/structures'),
        ApiClient.get<any>('/employees'),
      ]);

      if (compRes.success && compRes.data) setComponents(compRes.data);
      if (structRes.success && structRes.data) setStructures(structRes.data);
      if (empRes.success && empRes.data) {
        setEmployees(empRes.data.employees || empRes.data || []);
        if (empRes.data[0]) {
          setAssignForm((prev) => ({ ...prev, employeeId: empRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/salary/components', compForm);
      setIsCompModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create component');
    }
  };

  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post(`/salary/employees/${assignForm.employeeId}/assign`, {
        baseSalary: assignForm.baseSalary,
        effectiveFrom: assignForm.effectiveFrom,
      });
      setIsAssignModalOpen(false);
      alert('Salary revision assigned successfully with effective dating!');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign salary');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Effective-dated structures, Sri Lankan EPF/ETF rules, and components
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'PAYROLL_MANAGER') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCompModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Plus className="w-4 h-4" />
              New Component
            </button>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              Assign / Revise Salary
            </button>
          </div>
        )}
      </div>

      {/* Sri Lankan Statutory Rules Banner */}
      <div className="bg-gradient-to-r from-brand-950 to-brand-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Official Sri Lankan Statutory Parameters Active</h3>
          </div>
          <p className="text-xs text-brand-200 mt-1 max-w-xl">
            Calculated automatically on EPF-eligible earnings: Employee EPF (8%), Employer EPF (12%), Employer ETF (3%), and Progressive Inland Revenue APIT Brackets.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-white/10 px-4 py-2.5 rounded-xl backdrop-blur-sm">
          <div>
            <span className="block text-brand-300 font-medium">EPF Employee</span>
            <span className="font-bold text-white text-sm">8.0%</span>
          </div>
          <div className="border-l border-white/20 pl-3">
            <span className="block text-brand-300 font-medium">EPF Employer</span>
            <span className="font-bold text-white text-sm">12.0%</span>
          </div>
          <div className="border-l border-white/20 pl-3">
            <span className="block text-brand-300 font-medium">ETF Employer</span>
            <span className="font-bold text-white text-sm">3.0%</span>
          </div>
        </div>
      </div>

      {/* Salary Components Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Configured Earnings & Deductions</h3>
          <span className="text-xs text-slate-400">{components.length} component(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Component Name</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">EPF Eligible (Sri Lanka)</th>
                <th className="px-6 py-3.5">Taxable (APIT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading components...
                  </td>
                </tr>
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No components found.
                  </td>
                </tr>
              ) : (
                components.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">{c.code}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.type === 'EARNING'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {c.isEpfApplicable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Yes (Includes EPF/ETF)
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {c.isTaxable ? (
                        <span className="text-slate-700 font-medium">Yes</span>
                      ) : (
                        <span className="text-slate-400">Exempt</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Component Modal */}
      <Modal
        isOpen={isCompModalOpen}
        onClose={() => setIsCompModalOpen(false)}
        title="Add Salary Component"
      >
        <form onSubmit={handleCreateComponent} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Component Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Special Project Allowance"
              value={compForm.name}
              onChange={(e) =>
                setCompForm({
                  ...compForm,
                  name: e.target.value,
                  code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Component Code *</label>
            <input
              type="text"
              required
              value={compForm.code}
              onChange={(e) => setCompForm({ ...compForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Type *</label>
            <select
              value={compForm.type}
              onChange={(e) => setCompForm({ ...compForm, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="EARNING">Earning (Allowance / Incentive)</option>
              <option value="DEDUCTION">Deduction (Voluntary / Insurance)</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compForm.isEpfApplicable}
                onChange={(e) =>
                  setCompForm({
                    ...compForm,
                    isEpfApplicable: e.target.checked,
                    isEtfApplicable: e.target.checked,
                  })
                }
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">
                Subject to Sri Lankan EPF (8% & 12%) and ETF (3%)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compForm.isTaxable}
                onChange={(e) => setCompForm({ ...compForm, isTaxable: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="font-semibold text-slate-700">Taxable for Inland Revenue APIT</span>
            </label>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCompModalOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
            >
              Save Component
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Salary Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign or Revise Employee Salary Structure"
      >
        <form onSubmit={handleAssignSalary} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Employee *</label>
            <select
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">
              Base Monthly Salary (LKR) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={assignForm.baseSalary}
              onChange={(e) =>
                setAssignForm({ ...assignForm, baseSalary: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">
              Effective Revision Date *
            </label>
            <input
              type="date"
              required
              value={assignForm.effectiveFrom}
              onChange={(e) => setAssignForm({ ...assignForm, effectiveFrom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Historical payroll runs prior to this date will remain locked with their historical rates.
            </p>
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
            >
              Confirm Salary Revision
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
