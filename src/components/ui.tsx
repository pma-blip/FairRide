import type { ReactNode } from 'react';

export function Card({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-4 shadow-lg backdrop-blur-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-100 uppercase">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  step = 'any',
  placeholder,
  hasError,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number | 'any';
  placeholder?: string;
  hasError?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-300">{label}</span>
      <div className="relative flex items-center">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : ''}
          placeholder={placeholder}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            onChange(Number.isNaN(n) ? 0 : Math.max(min, n));
          }}
          className={`w-full rounded-lg border bg-slate-900/80 px-3 py-2 text-slate-100 outline-none transition focus:ring-2 ${
            hasError
              ? 'border-rose-500 focus:ring-rose-500/40'
              : 'border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/40'
          } ${suffix ? 'pr-14' : ''}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-emerald-500 text-slate-900 hover:bg-emerald-400 focus:ring-emerald-500/50',
    secondary:
      'bg-slate-700 text-slate-100 hover:bg-slate-600 focus:ring-slate-500/50',
    danger:
      'bg-rose-600/90 text-white hover:bg-rose-500 focus:ring-rose-500/50',
    ghost:
      'bg-transparent text-slate-300 hover:bg-slate-700/60 focus:ring-slate-500/40',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
