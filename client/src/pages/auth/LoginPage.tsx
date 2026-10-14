import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-950 text-white shadow-xl mb-4">
            <Building2 className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SmartHR Lanka</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise HR & Payroll Management System</p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3.5 h-3.5" />
            <span>Sri Lanka Statutory Compliant (EPF/ETF/APIT)</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your credentials to access the system</p>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.lk"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Account Login
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Super Admin</div>
                <div className="text-[10px] text-slate-500">Full System Control</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('hrmanager@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">HR Manager</div>
                <div className="text-[10px] text-slate-500">HR & Leaves</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('payroll@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Payroll Manager</div>
                <div className="text-[10px] text-slate-500">Salary & EPF/ETF</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('manager.eng@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Dept Manager</div>
                <div className="text-[10px] text-slate-500">Team Approvals</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('kasun@smarthr.lk')}
                className="p-2 col-span-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Employee (Kasun Perera)</div>
                <div className="text-[10px] text-slate-500">Self-Service Portal, Leaves & Payslips</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Default password for all accounts is: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Admin@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
