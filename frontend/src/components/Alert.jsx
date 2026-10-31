import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Alert({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const configs = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: Info,
      iconColor: 'text-sky-600',
    },
  };

  const current = configs[type] || configs.info;
  const Icon = current.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium shadow-sm transition-all ${current.bg} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 text-sm">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
