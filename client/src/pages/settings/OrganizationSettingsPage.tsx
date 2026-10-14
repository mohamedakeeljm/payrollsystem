import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { Building2, MapPin, Users, Briefcase, Plus, Calendar } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const OrganizationSettingsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [deptModal, setDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [oRes, bRes, dRes, desRes, sRes, hRes] = await Promise.all([
        ApiClient.get('/organization'),
        ApiClient.get('/organization/branches'),
        ApiClient.get('/organization/departments'),
        ApiClient.get('/organization/designations'),
        ApiClient.get('/organization/shifts'),
        ApiClient.get('/organization/holidays'),
      ]);

      if (oRes.success) setOrg(oRes.data);
      if (bRes.success) setBranches(bRes.data);
      if (dRes.success) setDepartments(dRes.data);
      if (desRes.success) setDesignations(desRes.data);
      if (sRes.success) setShifts(sRes.data);
      if (hRes.success) setHolidays(hRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/organization/departments', deptForm);
      setDeptModal(false);
      setDeptForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Organization Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Branches, departmental hierarchy, designations, shifts, and statutory policies
        </p>
      </div>

      {/* Organization Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-600" />
          Company Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Organization Name</span>
            <span className="font-semibold text-slate-800">{org?.name}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Company Code</span>
            <span className="font-semibold font-mono text-slate-800">{org?.code}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Tax / VAT Number</span>
            <span className="font-semibold font-mono text-slate-800">
              {org?.taxNumber || 'VAT-102938475-7000'}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Default Currency</span>
            <span className="font-semibold text-emerald-700">{org?.currency} (Sri Lankan Rupee)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Timezone</span>
            <span className="font-semibold text-slate-800">{org?.timezone} (UTC+05:30)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border">
            <span className="text-slate-400 block text-[11px]">Registered Address</span>
            <span className="font-semibold text-slate-800 truncate block">{org?.address}</span>
          </div>
        </div>
      </div>

      {/* Departments & Branches Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Departments ({departments.length})
            </h2>
            {hasRole('SUPER_ADMIN', 'HR_MANAGER') && (
              <button
                onClick={() => setDeptModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-950 text-white text-[11px] font-semibold hover:bg-brand-900 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {departments.map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{d.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{d.code}</p>
                </div>
                <span className="text-slate-500 font-medium">{d._count?.employees || 0} staff</span>
              </div>
            ))}
          </div>
        </div>

        {/* Branches */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Branches & Locations ({branches.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {branches.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {b.name} {b.isHeadOffice && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">HQ</span>}
                  </p>
                  <p className="text-[11px] text-slate-400">{b.address}</p>
                </div>
                <span className="font-mono text-slate-500">{b.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      <Modal isOpen={deptModal} onClose={() => setDeptModal(false)} title="Create Department">
        <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Quality Assurance"
              value={deptForm.name}
              onChange={(e) =>
                setDeptForm({
                  ...deptForm,
                  name: e.target.value,
                  code: e.target.value.substring(0, 4).toUpperCase(),
                })
              }
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Code *</label>
            <input
              type="text"
              required
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 mb-1 block">Description</label>
            <textarea
              rows={2}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeptModal(false)}
              className="px-4 py-2 border rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
