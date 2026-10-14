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
                <div className="font-bold text-slate-800">Mohamed Akeel</div>
                <div className="text-[10px] text-slate-500">Super Admin (Founder & CTO)</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('hrmanager@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Fathima Farhana</div>
                <div className="text-[10px] text-slate-500">HR Manager</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('payroll@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Mohamed Rizwan</div>
                <div className="text-[10px] text-slate-500">Payroll Manager</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('manager.eng@smarthr.lk')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Mohamed Aslam</div>
                <div className="text-[10px] text-slate-500">Engineering Lead</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount('kasun@smarthr.lk')}
                className="p-2 col-span-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-300 text-left transition-colors"
              >
                <div className="font-bold text-slate-800">Mohamed Nafees</div>
                <div className="text-[10px] text-slate-500">Employee Self-Service (Leaves, Attendance, Payslips)</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              Default password for all accounts is: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Admin@123</code>
            </p>
          </div>
        </div>

        {/* Developer Contact Footer with Logos */}
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Developed & Engineered by Mohamed Akeel
          </p>
          <div className="flex items-center justify-center gap-3">
            {/* Portfolio */}
            <a
              href="https://mohamedakeel.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-600 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Portfolio</span>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/itzakeeljm"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] text-xs font-semibold border border-[#1877F2]/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>itzakeeljm</span>
            </a>

            {/* Email */}
            <a
              href="mailto:mohamedakeeljm@gmail.com"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span>Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
