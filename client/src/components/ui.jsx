import { useEffect } from 'react';

export function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center py-10 ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
    </div>
  );
}

const BADGE_COLORS = {
  available: 'bg-emerald-100 text-emerald-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-100 text-slate-700',
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
  topup: 'bg-emerald-100 text-emerald-700',
  ride_payment: 'bg-blue-100 text-blue-700',
  overtime: 'bg-red-100 text-red-700',
  admin_adjust: 'bg-purple-100 text-purple-700',
};

export function Badge({ value, children }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[value] || 'bg-slate-100 text-slate-700'}`}>
      {children || String(value).replace('_', ' ')}
    </span>
  );
}

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">{children}</div>;
}
