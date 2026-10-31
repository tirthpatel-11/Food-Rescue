import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  badgeText
}) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      badge: 'bg-blue-100 text-blue-800',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'bg-amber-100 text-amber-800',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      badge: 'bg-purple-100 text-purple-800',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'bg-rose-100 text-rose-800',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${scheme.bg}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {value !== undefined && value !== null ? value : '—'}
        </span>
        {badgeText && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scheme.badge}`}>
            {badgeText}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
