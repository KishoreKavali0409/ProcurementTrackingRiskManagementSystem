// src/lib/export.ts — CSV and data export utilities

import { ProcurementCase, computeRisks, caseAge } from './data';

export function exportCasesToCSV(cases: ProcurementCase[], filename = 'procuretrack-cases.csv') {
  const headers = [
    'Case ID', 'Title', 'Status', 'Priority', 'Category', 'Department',
    'Requester', 'Assigned To', 'Vendor', 'Approved Budget (INR)',
    'Estimated Value (INR)', 'Budget Variance (%)', 'Opened Date',
    'Expected Closure', 'Last Updated', 'Age (Days)', 'Risks Detected',
    'Documents Received', 'Description'
  ];

  const rows = cases.map(c => {
    const risks = computeRisks(c);
    const age = caseAge(c);
    const docsReceived = Object.values(c.documents).filter(Boolean).length;
    const docTotal = Object.keys(c.documents).length;
    const budgetVariance = c.approvedBudget > 0
      ? (((c.estimatedValue - c.approvedBudget) / c.approvedBudget) * 100).toFixed(1)
      : '0';

    return [
      c.id,
      `"${c.title.replace(/"/g, '""')}"`,
      c.status,
      c.priority,
      c.category,
      c.department,
      c.requester,
      c.assignedTo,
      `"${c.vendor}"`,
      c.approvedBudget,
      c.estimatedValue,
      budgetVariance,
      c.openedDate,
      c.expectedClosure || '',
      c.lastUpdated,
      !['Closed', 'Cancelled'].includes(c.status) ? age : '',
      risks.length > 0 ? `"${risks.map(r => r.type).join(', ')}"` : 'None',
      `${docsReceived}/${docTotal}`,
      `"${(c.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRiskReportCSV(cases: ProcurementCase[]) {
  const open = cases.filter(c => !['Closed', 'Cancelled'].includes(c.status));
  const atRisk = open.filter(c => computeRisks(c).length > 0);

  const headers = ['Case ID', 'Title', 'Priority', 'Status', 'Assigned To', 'Age (Days)', 'Value', 'Risk Type', 'Severity', 'Risk Message'];
  const rows: string[] = [];

  atRisk.forEach(c => {
    const risks = computeRisks(c);
    const age = caseAge(c);
    risks.forEach(r => {
      rows.push([
        c.id,
        `"${c.title.replace(/"/g, '""')}"`,
        c.priority,
        c.status,
        c.assignedTo,
        age,
        c.estimatedValue,
        r.type,
        r.severity.toUpperCase(),
        `"${r.msg}"`
      ].join(','));
    });
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `procuretrack-risk-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
