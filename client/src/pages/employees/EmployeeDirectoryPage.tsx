import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { Employee } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Archive,
  Mail,
  Phone,
  Building,
  CreditCard,
  Calendar,
} from 'lucide-react';

export const EmployeeDirectoryPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    workPhone: '',
    departmentId: '',
    designationId: '',
    employmentType: 'PERMANENT',
    joinDate: new Date().toISOString().split('T')[0],
    nicOrPassport: '',
    bankName: 'Commercial Bank of Ceylon',
    bankAccountNumber: '',
    epfNumber: '',
    createLoginAccount: true,
    initialPassword: 'Password@123',
    roleCode: 'EMPLOYEE',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<Employee[]>('/employees', {
        search,
        departmentId: selectedDept,
        employmentStatus: selectedStatus,
      });
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        ApiClient.get<any[]>('/organization/departments'),
        ApiClient.get<any[]>('/organization/designations'),
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (desigRes.success) setDesignations(desigRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedDept, selectedStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await ApiClient.post('/employees', formData);
      setIsAddOpen(false);
      fetchEmployees();
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        workEmail: '',
        workPhone: '',
        departmentId: '',
        designationId: '',
        employmentType: 'PERMANENT',
        joinDate: new Date().toISOString().split('T')[0],
        nicOrPassport: '',
        bankName: 'Commercial Bank of Ceylon',
        bankAccountNumber: '',
        epfNumber: '',
        createLoginAccount: true,
        initialPassword: 'Password@123',
        roleCode: 'EMPLOYEE',
      });
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive employee ${name}? Their historical records and payslips will be safely preserved.`)) {
      return;
    }

    try {
      await ApiClient.delete(`/employees/${id}`, { reason: 'Archived via HR Directory UI' });
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to archive employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization staff profiles, designations, and records
          </p>
        </div>

        {hasRole('SUPER_ADMIN', 'HR_MANAGER') && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="RESIGNED">Resigned</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Designation</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No employees matching your criteria.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs uppercase">
                          {(emp.firstName || 'E')[0]}
                          {(emp.lastName || 'M')[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {emp.employeeId || emp.id} • {emp.workEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {emp.department?.name || 'General'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {emp.designation?.title || 'Staff'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 capitalize">
                      {(emp.employmentType || 'PERMANENT').toLowerCase()}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={emp.employmentStatus || (emp as any).status || 'ACTIVE'} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedEmp(emp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole('SUPER_ADMIN', 'HR_MANAGER') && (
                          <button
                            onClick={() => handleArchive(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Archive Employee"
                          >
                            <Archive className="w-4 h-4" />
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

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New Employee"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Work Email *</label>
              <input
                type="email"
                required
                value={formData.workEmail}
                onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Phone Number</label>
              <input
                type="text"
                value={formData.workPhone}
                onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                placeholder="+94 77 123 4567"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Designation</label>
              <select
                value={formData.designationId}
                onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">NIC / Passport No</label>
              <input
                type="text"
                value={formData.nicOrPassport}
                onChange={(e) => setFormData({ ...formData, nicOrPassport: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">EPF Number</label>
              <input
                type="text"
                value={formData.epfNumber}
                onChange={(e) => setFormData({ ...formData, epfNumber: e.target.value })}
                placeholder="EPF-XXXX"
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 mb-1 block">Account Number</label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-brand-950 text-white rounded-xl text-xs font-semibold hover:bg-brand-900 disabled:opacity-60"
            >
              {submitting ? 'Registering...' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Detail Modal */}
      {selectedEmp && (
        <Modal
          isOpen={!!selectedEmp}
          onClose={() => setSelectedEmp(null)}
          title={`Employee Profile: ${selectedEmp.firstName} ${selectedEmp.lastName}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-brand-950 text-white flex items-center justify-center font-bold text-base">
                {(selectedEmp.firstName || 'E')[0]}
                {(selectedEmp.lastName || 'M')[0]}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">
                  {selectedEmp.firstName} {selectedEmp.lastName}
                </p>
                <p className="text-slate-500">{selectedEmp.designation?.title || 'Staff'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono bg-white px-2 py-0.5 rounded border text-[11px]">
                    {selectedEmp.employeeId || selectedEmp.id}
                  </span>
                  <StatusBadge status={selectedEmp.employmentStatus || (selectedEmp as any).status || 'ACTIVE'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Work Email</span>
                <span className="font-medium text-slate-800">{selectedEmp.workEmail}</span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Department</span>
                <span className="font-medium text-slate-800">{selectedEmp.department?.name || 'N/A'}</span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">EPF Number</span>
                <span className="font-medium text-slate-800">{selectedEmp.epfNumber || 'Not assigned'}</span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">NIC / Passport</span>
                <span className="font-medium text-slate-800">{selectedEmp.nicOrPassport || 'N/A'}</span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Bank Name</span>
                <span className="font-medium text-slate-800">{selectedEmp.bankName || 'N/A'}</span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 block text-[11px]">Bank Account</span>
                <span className="font-medium text-slate-800">
                  {selectedEmp.bankAccountNumber ? '•••• ' + selectedEmp.bankAccountNumber.slice(-4) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
