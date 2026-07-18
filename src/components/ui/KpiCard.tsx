// src/components/ui/KpiCard.tsx
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'brand';
  trend?: 'up' | 'down' | 'neutral';
}

const VARIANT_MAP = {
  default: { icon: 'bg-enterprise-100 text-enterprise-500', border: 'border-enterprise-200', top: '' },
  brand:   { icon: 'bg-brand-light text-brand',             border: 'border-brand/20',       top: 'border-t-2 border-t-brand' },
  danger:  { icon: 'bg-danger-bg text-danger',              border: 'border-danger/20',      top: 'border-t-2 border-t-danger' },
  warning: { icon: 'bg-warning-bg text-warning',            border: 'border-warning/20',     top: 'border-t-2 border-t-warning' },
  success: { icon: 'bg-success-bg text-success',            border: 'border-success/20',     top: 'border-t-2 border-t-success' },
};

export function KpiCard({ label, value, sub, icon: Icon, variant = 'default', trend }: Props) {
  const v = VARIANT_MAP[variant];
  return (
    <div className={clsx(
      'bg-surface rounded border shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-shadow',
      v.border, v.top
    )}>
      <div className={clsx('w-9 h-9 rounded flex items-center justify-center flex-shrink-0', v.icon)}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-0.5">{label}</div>
        <div className="text-2xl font-bold text-text-primary leading-tight">{value}</div>
        {sub && (
          <div className={clsx(
            'text-xs mt-1',
            trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-text-muted'
          )}>
            {trend === 'up' && '↑ '}{trend === 'down' && '↓ '}{sub}
          </div>
        )}
      </div>
    </div>
  );
}
