// src/components/ui/Badge.tsx
import { clsx } from 'clsx';
import { CaseStatus, Priority, RiskSeverity } from '@/lib/data';

// ── Status Badge ──────────────────────────────────────────────
const STATUS_MAP: Record<CaseStatus, { label: string; cls: string }> = {
  'RFQ Draft':              { label: 'RFQ Draft',              cls: 'bg-enterprise-100 text-enterprise-500 border-enterprise-300' },
  'Bidders Defined':        { label: 'Bidders Defined',        cls: 'bg-[#f0f8ff] text-[#0070d2] border-[#0070d2]/30' },
  'RFQ Shared':             { label: 'RFQ Shared',             cls: 'bg-info-bg text-info border-info/30' },
  'Offers Received':        { label: 'Offers Received',        cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  'Technical Evaluation':   { label: 'Technical Evaluation',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Commercial Negotiation': { label: 'Commercial Negotiation', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Approval Pending':       { label: 'Approval Pending',       cls: 'bg-warning-bg text-warning border-warning/30' },
  'PO Released':            { label: 'PO Released',            cls: 'bg-[#eaf5ea] text-[#2e844a] border-[#2e844a]/30' },
  'Legal / NDA':            { label: 'Legal / NDA',            cls: 'bg-[#fcf8e3] text-[#8a6d3b] border-[#faebcc]' },
  'GRN / Closed':           { label: 'GRN / Closed',           cls: 'bg-[#e8f4ff] text-[#1b5e85] border-[#1b5e85]/30' },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, cls } = STATUS_MAP[status] || STATUS_MAP['RFQ Draft'];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded border whitespace-nowrap',
      cls
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

// ── Priority Badge ────────────────────────────────────────────
const PRIORITY_MAP: Record<Priority, string> = {
  Low:      'bg-enterprise-100 text-enterprise-500',
  Medium:   'bg-info-bg text-info',
  High:     'bg-warning-bg text-warning',
  Critical: 'bg-danger-bg text-danger font-bold',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded uppercase tracking-wide',
      PRIORITY_MAP[priority]
    )}>
      {priority}
    </span>
  );
}

// ── Risk Badge ────────────────────────────────────────────────
export function RiskBadge({ severity, label }: { severity: RiskSeverity; label: string }) {
  const cls = {
    critical: 'bg-danger-bg text-danger border-danger/20',
    warning:  'bg-warning-bg text-warning border-warning/20',
    healthy:  'bg-success-bg text-success border-success/20',
  }[severity];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border', cls)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ── Generic Tag ───────────────────────────────────────────────
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs bg-enterprise-100 text-enterprise-500 rounded border border-enterprise-200">
      {children}
    </span>
  );
}
