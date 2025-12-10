import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 max-w-md w-full backdrop-blur-xl">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
        <p className="text-slate-400 mb-6 text-sm">
          CoachFlow encountered an unexpected error. Our team has been notified.
        </p>
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-left mb-6 overflow-auto max-h-32">
          <code className="text-xs text-red-400 font-mono">{error.message}</code>
        </div>
        <button 
          onClick={resetErrorBoundary}
          className="w-full bg-white text-slate-950 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw size={18} /> Try Again
        </button>
      </div>
    </div>
  );
};

export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default AppErrorBoundary;