import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl shadow-black/50 animate-slide-in-right min-w-[300px] border backdrop-blur-md ${
            toast.type === 'success' ? 'bg-slate-900/90 border-green-500/30 text-white' :
            toast.type === 'error' ? 'bg-slate-900/90 border-red-500/30 text-white' :
            'bg-slate-900/90 border-blue-500/30 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={20} className="text-red-500 shrink-0" />}
          {toast.type === 'info' && <Info size={20} className="text-blue-500 shrink-0" />}
          
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};