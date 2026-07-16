// src/components/ui/Panel.tsx
// Enterprise-style card/panel — like SAP Fiori tiles
import { clsx } from 'clsx';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Panel({ children, className, noPad }: PanelProps) {
  return (
    <div className={clsx(
      'bg-white border border-enterprise-200 rounded shadow-sm',
      !noPad && 'p-5',
      className
    )}>
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, icon, actions, className }: PanelHeaderProps) {
  return (
    <div className={clsx(
      'flex items-center justify-between gap-2 mb-4',
      className
    )}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand">{icon}</span>}
        <span className="text-sm font-semibold text-text-primary">{title}</span>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// Field Group — like SAP Fiori record view sections
interface FieldGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
export function FieldGroup({ label, children, className }: FieldGroupProps) {
  return (
    <div className={clsx('mb-5', className)}>
      <div className="text-xs font-semibold text-enterprise-400 uppercase tracking-wide mb-2 pb-1 border-b border-enterprise-100">
        {label}
      </div>
      {children}
    </div>
  );
}

// Field — label + value pair
interface FieldProps {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}
export function Field({ label, children, inline }: FieldProps) {
  if (inline) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-enterprise-50 last:border-b-0">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-sm font-medium text-text-primary text-right">{children}</span>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <div className="text-xs text-text-secondary mb-0.5">{label}</div>
      <div className="text-sm font-medium text-text-primary">{children || <span className="text-text-muted">—</span>}</div>
    </div>
  );
}

// Section divider
export function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-enterprise-100" />
      {label && <span className="text-xs text-enterprise-400 font-medium">{label}</span>}
      <div className="flex-1 h-px bg-enterprise-100" />
    </div>
  );
}

// Toolbar — action bar above tables like Salesforce list view
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(
      'flex items-center gap-2 flex-wrap mb-3',
      className
    )}>
      {children}
    </div>
  );
}

// Progress bar
export function ProgressBar({ value, max, colorClass }: { value: number; max: number; colorClass?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-enterprise-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorClass || 'bg-brand')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary w-8 text-right">{pct}%</span>
    </div>
  );
}
