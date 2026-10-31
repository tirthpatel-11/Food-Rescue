import React from 'react';

const statusConfig = {
  // Common
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  Collected: 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  
  // Requests
  Open: 'bg-sky-50 text-sky-700 border-sky-200',
  Fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // Deliveries
  Assigned: 'bg-slate-100 text-slate-700 border-slate-300',
  'Picked Up': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Beneficiary verification
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',

  // Freshness
  'Within Shelf Life': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Delivered After Expiry': 'bg-red-50 text-red-700 border-red-200',
  'Pending Delivery': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function StatusBadge({ status, className = '' }) {
  const style = statusConfig[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 mr-1.5" />
      {status || 'Unknown'}
    </span>
  );
}
