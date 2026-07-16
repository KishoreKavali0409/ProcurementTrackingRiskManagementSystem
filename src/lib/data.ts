// src/lib/data.ts
// Central data types, sample data, and utility functions

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
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function futureDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

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

// ── Sample Data ───────────────────────────────────────────────
export const SAMPLE_CASES: ProcurementCase[] = [
  {
    id: 'PC-2025-001',
    title: 'Enterprise CRM Software License Renewal',
    category: 'IT & Software', department: 'Sales', requester: 'Arjun Mehta',
    assignedTo: 'Priya Sharma', priority: 'Critical', status: 'Commercial Negotiation',
    vendor: 'Salesforce Inc.', estimatedValue: 4800000, approvedBudget: 4500000, currency: 'INR',
    openedDate: daysAgo(28), expectedClosure: daysAgo(3), lastUpdated: daysAgo(9),
    description: 'Annual renewal of enterprise CRM licenses for 200 sales users. Multi-year deal negotiation.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': true, 'Approval Form': false, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': false },
    updates: [
      { date: daysAgo(28), text: 'Case opened. RFQ sent to Salesforce.', author: 'Arjun Mehta' },
      { date: daysAgo(20), text: 'Quotes received. Negotiation call scheduled.', author: 'Priya Sharma' },
      { date: daysAgo(9), text: 'Counter-proposal submitted. Awaiting vendor response.', author: 'Priya Sharma' },
    ],
    tags: ['renewal', 'SaaS', 'enterprise'],
    budgetCategory: 'high_value',
  },
  {
    id: 'PC-2025-002',
    title: 'HQ 3rd Floor Office Renovation',
    category: 'Facilities', department: 'Operations', requester: 'Sneha Kulkarni',
    assignedTo: 'Rajan Pillai', priority: 'High', status: 'Offers Received',
    vendor: 'Multiple Vendors', estimatedValue: 2200000, approvedBudget: 2000000, currency: 'INR',
    openedDate: daysAgo(15), expectedClosure: futureDate(10), lastUpdated: daysAgo(2),
    description: 'Renovation of 3rd floor including workstations, flooring, lighting, HVAC upgrades.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': false, 'Approval Form': true, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': false },
    updates: [
      { date: daysAgo(15), text: 'Renovation project initiated. SOW drafted.', author: 'Sneha Kulkarni' },
      { date: daysAgo(5), text: '3 of 5 quotes received. Analysis in progress.', author: 'Rajan Pillai' },
      { date: daysAgo(2), text: 'All quotes in. Comparative analysis underway.', author: 'Rajan Pillai' },
    ],
    tags: ['facilities', 'renovation', 'CAPEX'],
    budgetCategory: 'standard',
  },
  {
    id: 'PC-2025-003',
    title: 'Legal Advisory Services – M&A Due Diligence',
    category: 'Professional Services', department: 'Legal', requester: 'Kavitha Nair',
    assignedTo: 'Priya Sharma', priority: 'Critical', status: 'Approval Pending',
    vendor: 'AZB & Partners', estimatedValue: 1500000, approvedBudget: 1600000, currency: 'INR',
    openedDate: daysAgo(45), expectedClosure: futureDate(5), lastUpdated: daysAgo(1),
    description: 'Legal advisory engagement for M&A due diligence and contract review.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': true, 'Approval Form': true, 'Contract Draft': true, 'Final Contract': true, 'PO Copy': false },
    updates: [
      { date: daysAgo(45), text: 'Legal engagement initiated.', author: 'Kavitha Nair' },
      { date: daysAgo(1), text: 'PO being processed. Final steps remaining.', author: 'Priya Sharma' },
    ],
    tags: ['M&A', 'legal', 'advisory'],
    budgetCategory: 'standard',
  },
  {
    id: 'PC-2025-004',
    title: 'AWS Cloud Infrastructure Upgrade',
    category: 'IT & Software', department: 'Engineering', requester: 'Vikram Rao',
    assignedTo: 'Anand Kumar', priority: 'High', status: 'Technical Evaluation',
    vendor: 'Amazon Web Services', estimatedValue: 3600000, approvedBudget: 3600000, currency: 'INR',
    openedDate: daysAgo(8), expectedClosure: futureDate(15), lastUpdated: daysAgo(8),
    description: 'Upgrade AWS infrastructure to support 3x workload growth. Reserved Instances purchase.',
    documents: { RFQ: true, 'Vendor Quotes': false, 'Comparative Analysis': false, 'Approval Form': false, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': false },
    updates: [{ date: daysAgo(8), text: 'Requirements documented. Forwarded for review.', author: 'Vikram Rao' }],
    tags: ['cloud', 'AWS', 'infrastructure'],
    budgetCategory: 'standard',
  },
  {
    id: 'PC-2025-005',
    title: 'Annual Stationery & Office Consumables',
    category: 'Facilities', department: 'Operations', requester: 'Meera Iyer',
    assignedTo: 'Rajan Pillai', priority: 'Low', status: 'GRN / Closed',
    vendor: 'Classmate Supplies Pvt Ltd', estimatedValue: 280000, approvedBudget: 300000, currency: 'INR',
    openedDate: daysAgo(60), expectedClosure: daysAgo(30), lastUpdated: daysAgo(30),
    description: 'Annual procurement of stationery, toner cartridges, and consumables.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': true, 'Approval Form': true, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': true },
    updates: [
      { date: daysAgo(60), text: 'Annual requirement consolidation complete.', author: 'Meera Iyer' },
      { date: daysAgo(30), text: 'Delivery complete. Case closed.', author: 'Rajan Pillai' },
    ],
    tags: ['routine', 'consumables', 'annual'],
    budgetCategory: 'standard',
  },
  {
    id: 'PC-2025-006',
    title: 'HR E-Learning Platform Subscription – FY26',
    category: 'HR & Training', department: 'HR', requester: 'Deepa Srinivasan',
    assignedTo: 'Anand Kumar', priority: 'Medium', status: 'RFQ Draft',
    vendor: 'TBD', estimatedValue: 650000, approvedBudget: 700000, currency: 'INR',
    openedDate: daysAgo(3), expectedClosure: futureDate(25), lastUpdated: daysAgo(3),
    description: 'New e-learning platform for 500+ employees. Evaluating Coursera, LinkedIn Learning, Udemy.',
    documents: { RFQ: false, 'Vendor Quotes': false, 'Comparative Analysis': false, 'Approval Form': false, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': false },
    updates: [{ date: daysAgo(3), text: 'Requirement raised by L&D. Initial scoping in progress.', author: 'Deepa Srinivasan' }],
    tags: ['HR', 'training', 'e-learning'],
    budgetCategory: 'standard',
  },
  {
    id: 'PC-2025-007',
    title: 'Structural Steel Supply Agreement – Q3',
    category: 'Raw Materials', department: 'Operations', requester: 'Sanjay Gupta',
    assignedTo: 'Priya Sharma', priority: 'Critical', status: 'Commercial Negotiation',
    vendor: 'SAIL / Tata Steel', estimatedValue: 12000000, approvedBudget: 11000000, currency: 'INR',
    openedDate: daysAgo(35), expectedClosure: futureDate(7), lastUpdated: daysAgo(12),
    description: 'Quarterly supply agreement for structural steel. Q3 production is dependent on this contract.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': true, 'Approval Form': true, 'Contract Draft': true, 'Final Contract': false, 'PO Copy': false },
    updates: [
      { date: daysAgo(35), text: 'Supply requirement placed by production.', author: 'Sanjay Gupta' },
      { date: daysAgo(12), text: 'Contract negotiations ongoing. Price escalation flagged.', author: 'Priya Sharma' },
    ],
    tags: ['raw materials', 'steel', 'supply chain', 'critical'],
    budgetCategory: 'high_value',
  },
  {
    id: 'PC-2025-008',
    title: 'Marketing Agency Retainer – FY26',
    category: 'Marketing', department: 'Marketing', requester: 'Aisha Kapoor',
    assignedTo: 'Anand Kumar', priority: 'Medium', status: 'Offers Received',
    vendor: 'Multiple Agencies', estimatedValue: 1800000, approvedBudget: 2000000, currency: 'INR',
    openedDate: daysAgo(12), expectedClosure: futureDate(18), lastUpdated: daysAgo(4),
    description: 'Annual retainer for full-service marketing agency: digital, content, campaign management.',
    documents: { RFQ: true, 'Vendor Quotes': true, 'Comparative Analysis': false, 'Approval Form': false, 'Contract Draft': false, 'Final Contract': false, 'PO Copy': false },
    updates: [
      { date: daysAgo(12), text: 'Agency brief shared with 6 agencies.', author: 'Aisha Kapoor' },
      { date: daysAgo(4), text: 'Shortlisted to 2 agencies. Final pitch next week.', author: 'Anand Kumar' },
    ],
    tags: ['marketing', 'agency', 'retainer'],
  },
];

// ── LocalStorage persistence ─────────────────────────────────
const STORAGE_KEY = 'procuretrack_cases_v3';

export function loadCases(): ProcurementCase[] {
  if (typeof window === 'undefined') return SAMPLE_CASES;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* empty */ }
  saveCases(SAMPLE_CASES);
  return SAMPLE_CASES;
}

export function saveCases(cases: ProcurementCase[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function generateId(cases: ProcurementCase[]): string {
  const year = new Date().getFullYear();
  const nums = cases.map(c => parseInt(c.id.split('-')[2])).filter(n => !isNaN(n));
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

