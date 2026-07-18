// src/lib/data.ts
// Central data types, validation structures, and utility functions

export type CaseStatus =
  | 'RFQ Draft'
  | 'Bidders Defined'
  | 'RFQ Shared'
  | 'Offers Received'
  | 'Technical Evaluation'
  | 'Commercial Negotiation'
  | 'Approval Pending'
  | 'PO Released'
  | 'Legal / NDA'
  | 'GRN / Closed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskSeverity = 'critical' | 'warning' | 'healthy';

export interface CaseUpdate {
  date: string;
  text: string;
  author: string;
}

export interface ProcurementCase {
  id: string;
  title: string;
  category: string;
  department: string;
  requester: string;
  assignedTo: string;
  priority: Priority;
  status: CaseStatus;
  vendor: string;
  estimatedValue: number;
  approvedBudget: number;
  currency: string;
  openedDate: string;
  expectedClosure: string;
  lastUpdated: string;
  description: string;
  documents: Record<string, boolean>;
  updates: CaseUpdate[];
  tags: string[];
  budgetCategory?: 'standard' | 'high_value';
}

export interface RiskFlag {
  type: string;
  severity: RiskSeverity;
  msg: string;
  icon: string;
}

export const STATUSES: CaseStatus[] = [
  'RFQ Draft', 'Bidders Defined', 'RFQ Shared', 'Offers Received',
  'Technical Evaluation', 'Commercial Negotiation', 'Approval Pending',
  'PO Released', 'Legal / NDA', 'GRN / Closed',
];

export const CATEGORIES = [
  'IT & Software', 'Facilities', 'Professional Services', 'Raw Materials',
  'Logistics', 'Marketing', 'HR & Training', 'Capital Equipment',
];

export const DEPARTMENTS = [
  'Engineering', 'Operations', 'Finance', 'HR', 'Marketing',
  'Procurement', 'Legal', 'Sales',
];

export const DOCUMENT_TYPES = [
  'RFQ', 'Vendor Quotes', 'Comparative Analysis', 'Approval Form',
  'Contract Draft', 'Final Contract', 'PO Copy',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

// ── Helpers ──────────────────────────────────────────────────
export function caseAge(c: ProcurementCase): number {
  return Math.floor((Date.now() - new Date(c.openedDate).getTime()) / 86400000);
}

export function formatCurrency(val: number): string {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export function formatDate(s?: string): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Risk Engine ───────────────────────────────────────────────
export function computeRisks(c: ProcurementCase): RiskFlag[] {
  const risks: RiskFlag[] = [];
  const today = new Date();
  const opened = new Date(c.openedDate);
  const expected = new Date(c.expectedClosure);
  const lastUpdate = new Date(c.lastUpdated);

  const agedays = Math.floor((today.getTime() - opened.getTime()) / 86400000);
  const daysToClose = Math.ceil((expected.getTime() - today.getTime()) / 86400000);
  const daysSinceUpdate = Math.floor((today.getTime() - lastUpdate.getTime()) / 86400000);
  const budgetOverrun = c.estimatedValue > c.approvedBudget
    ? ((c.estimatedValue - c.approvedBudget) / c.approvedBudget) * 100 : 0;

  if (c.status !== 'GRN / Closed') {
    if (daysToClose < 0) {
      risks.push({ type: 'Overdue', severity: 'critical', msg: `Past closure by ${Math.abs(daysToClose)}d`, icon: '●' });
    } else if (daysToClose <= 3) {
      risks.push({ type: 'Due Soon', severity: 'warning', msg: `Closes in ${daysToClose}d`, icon: '●' });
    }
    if (daysSinceUpdate >= 10) {
      risks.push({ type: 'Stale', severity: 'critical', msg: `${daysSinceUpdate}d since last update`, icon: '●' });
    } else if (daysSinceUpdate >= 7) {
      risks.push({ type: 'Stale', severity: 'warning', msg: `${daysSinceUpdate}d since last update`, icon: '●' });
    }
    if (budgetOverrun > 10) {
      risks.push({ type: 'Budget Overrun', severity: 'critical', msg: `+${budgetOverrun.toFixed(1)}% over budget`, icon: '●' });
    } else if (budgetOverrun > 0) {
      risks.push({ type: 'Budget Escalation', severity: 'warning', msg: `+${budgetOverrun.toFixed(1)}% over budget`, icon: '●' });
    }
    const requiredMissing = ['RFQ', 'Vendor Quotes', 'Approval Form'].filter(d => !c.documents[d]);
    if (requiredMissing.length > 0 && agedays > 7) {
      risks.push({ type: 'Missing Docs', severity: 'warning', msg: requiredMissing.join(', '), icon: '●' });
    }
    if (agedays > 30 && c.priority === 'Critical') {
      risks.push({ type: 'Long-Running Critical', severity: 'critical', msg: `${agedays}d open`, icon: '●' });
    }
  }
  return risks;
}

export function getNextActions(c: ProcurementCase, risks: RiskFlag[]): string[] {
  const actions: string[] = [];
  risks.forEach(r => {
    if (r.type === 'Overdue') actions.push('Escalate to procurement manager — past expected closure date.');
    if (r.type === 'Stale') actions.push(`Follow up with ${c.assignedTo} for an immediate status update.`);
    if (r.type === 'Budget Overrun') actions.push('Initiate budget revision approval with finance team.');
    if (r.type === 'Budget Escalation') actions.push('Review scope or renegotiate pricing to stay within budget.');
    if (r.type === 'Missing Docs') actions.push(`Request missing documents: ${r.msg}`);
    if (r.type === 'Long-Running Critical') actions.push('Schedule senior leadership review for this case.');
    if (r.type === 'Due Soon') actions.push('Prioritize closure — deadline within 3 days.');
  });
  if (!actions.length) actions.push(`On track. Continue regular follow-up with ${c.assignedTo}.`);
  return actions;
}

export function generateId(cases: ProcurementCase[]): string {
  const year = new Date().getFullYear();
  const nums = cases.map(c => {
    const parts = c.id.split('-');
    return parts.length >= 3 ? parseInt(parts[2]) : NaN;
  }).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `PC-${year}-${String(next).padStart(3, '0')}`;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  city: string;
  rating: number;
  createdAt: string;
}

export interface Quotation {
  id: string;
  caseId: string;
  supplierId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  notes: string;
  submittedAt: string;
  supplier?: Supplier;
}

export interface Notification {
  id: string;
  userId?: string | null;
  caseId?: string | null;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
}
