import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import { Payslip } from '../../types';
import { FileText, Download, Eye, Calendar, User, Search } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const PayslipsPage: React.FC = () => {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<Payslip[]>('/payslips');
      if (res.success && res.data) {
        setPayslips(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleView = async (id: string) => {
    try {
      const res = await ApiClient.get<any>(`/payslips/${id}`);
      if (res.success && res.data) {
        setSelectedSlip(res.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load payslip');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payslips Repository</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Access and download verified monthly payslips with Sri Lankan statutory breakdown
        </p>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Finalized Payslips</h3>
          <span className="text-xs text-slate-400">{payslips.length} document(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Payslip No</th>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Period</th>
                <th className="px-6 py-3.5">Payment Date</th>
                <th className="px-6 py-3.5">Gross Pay</th>
                <th className="px-6 py-3.5">Deductions</th>
                <th className="px-6 py-3.5 font-bold text-slate-900">Net Salary (LKR)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading payslips...
                  </td>
                </tr>
              ) : payslips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No payslips generated yet. Payslips appear here once a payroll run is finalized.
                  </td>
                </tr>
              ) : (
                payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-semibold text-slate-800">
                      {ps.payslipNumber}
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {ps.employee?.firstName} {ps.employee?.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {ps.employee?.employeeId} • {ps.employee?.department?.name || 'General'}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {ps.periodName} ({ps.periodCode})
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{ps.paymentDate}</td>
                    <td className="px-6 py-3.5 text-slate-700">
                      LKR {ps.grossPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-rose-600">
                      LKR {ps.totalDeductions.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-700 text-sm">
                      LKR {ps.netPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(ps.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          title="View Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/v1/payslips/${ps.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-950 text-white text-[11px] font-semibold hover:bg-brand-900 transition"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Payslip: ${selectedSlip.payslipNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">
                  {selectedSlip.employee?.firstName} {selectedSlip.employee?.lastName}
                </p>
                <p className="text-slate-500">
                  {selectedSlip.employee?.employeeId} • {selectedSlip.employee?.designation?.title || 'Staff'}
                </p>
                <p className="text-slate-500">EPF No: {selectedSlip.employee?.epfNumber || 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Net Disbursed</span>
                <span className="text-lg font-bold text-emerald-600">
                  LKR {selectedSlip.netPay?.toLocaleString()}
                </span>
                <p className="text-slate-400 text-[10px] mt-0.5">Date: {selectedSlip.paymentDate}</p>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-3 bg-white">
                <p className="font-bold text-slate-800 border-b pb-1.5 mb-2">Earnings</p>
                <div className="space-y-1.5">
                  {selectedSlip.payrollRunEmployee?.earnings?.map((earn: any) => (
                    <div key={earn.id} className="flex justify-between">
                      <span className="text-slate-600">{earn.name}</span>
                      <span className="font-semibold text-slate-800">
                        {earn.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Gross</span>
                    <span>LKR {selectedSlip.grossPay?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl p-3 bg-white">
                <p className="font-bold text-slate-800 border-b pb-1.5 mb-2">Deductions</p>
                <div className="space-y-1.5">
                  {selectedSlip.payrollRunEmployee?.deductions?.map((ded: any) => (
                    <div key={ded.id} className="flex justify-between">
                      <span className="text-slate-600">{ded.name}</span>
                      <span className="font-semibold text-rose-600">
                        {ded.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Deductions</span>
                    <span className="text-rose-700">
                      LKR {selectedSlip.totalDeductions?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employer Contributions Box */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">
                Employer Statutory Contributions (Not deducted from salary)
              </span>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Employer EPF (12%): LKR {selectedSlip.payrollRunEmployee?.epfEmployerAmount?.toLocaleString()}</span>
                <span>Employer ETF (3%): LKR {selectedSlip.payrollRunEmployee?.etfEmployerAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`/api/v1/payslips/${selectedSlip.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-brand-950 text-white rounded-xl font-semibold"
              >
                <Download className="w-4 h-4" />
                Download Official PDF Payslip
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
