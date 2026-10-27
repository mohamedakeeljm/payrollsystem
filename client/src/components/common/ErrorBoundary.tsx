import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SmartHR ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              The application encountered a temporary display issue in this view.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-950 text-white text-xs font-semibold hover:bg-brand-900 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                <Home className="w-3.5 h-3.5" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
