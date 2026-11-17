import React from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';
import { ToastAlert } from '../types/moviradar';

interface ToastContainerProps {
  toasts: ToastAlert[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto sm:w-80 z-[9999] pointer-events-none flex flex-col gap-2">
      {toasts.map((toast) => {
        let borderColor = 'border-cyan-500/40';
        let bgColor = 'bg-slate-900/95';
        let icon = <Info className="w-4 h-4 text-cyan-400 shrink-0" />;

        if (toast.type === 'success') {
          borderColor = 'border-emerald-500/40';
          icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'warning') {
          borderColor = 'border-amber-500/40';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
        } else if (toast.type === 'error') {
          borderColor = 'border-red-500/40';
          icon = <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border ${borderColor} ${bgColor} shadow-2xl backdrop-blur-md animate-slide-down text-slate-100 transition`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 text-xs">
              {toast.title && <h5 className="font-bold text-slate-100 mb-0.5">{toast.title}</h5>}
              <p className="text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-100 p-0.5 -mr-1 -mt-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
