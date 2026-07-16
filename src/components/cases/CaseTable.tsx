'use client';
// src/components/cases/CaseTable.tsx
// Salesforce-style list view table for cases

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { ProcurementCase, computeRisks, caseAge, formatCurrency, formatDate, Priority } from '@/lib/data';
import { StatusBadge, PriorityBadge, RiskBadge } from '@/components/ui/Badge';

type SortCol = 'id' | 'title' | 'status' | 'priority' | 'age' | 'expectedClosure' | 'estimatedValue' | 'assignedTo';

interface Props {
  cases: ProcurementCase[];
}

export function CaseTable({ cases }: Props) {
  const [sort, setSort] = useState<{ col: SortCol; dir: 'asc' | 'desc' }>({ col: 'age', dir: 'desc' });
  const PRIORITY_RANK: Record<Priority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

  function toggleSort(col: SortCol) {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  }

  const sorted = [...cases].sort((a, b) => {
    let va: string | number, vb: string | number;
    if (sort.col === 'age') { va = caseAge(a); vb = caseAge(b); }
    else if (sort.col === 'priority') { va = PRIORITY_RANK[a.priority] ?? 0; vb = PRIORITY_RANK[b.priority] ?? 0; }
    else if (sort.col === 'estimatedValue') { va = a.estimatedValue; vb = b.estimatedValue; }
    else { va = (a[sort.col as keyof ProcurementCase] ?? '') as string | number; vb = (b[sort.col as keyof ProcurementCase] ?? '') as string | number; }
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  function SortIcon({ col }: { col: SortCol }) {
    if (sort.col !== col) return <ChevronDown size={12} className="opacity-30" />;
    return sort.dir === 'asc'
      ? <ChevronUp size={12} className="text-brand" />
      : <ChevronDown size={12} className="text-brand" />;
  }

  function Th({ col, label, right }: { col: SortCol; label: string; right?: boolean }) {
    return (
      <th
        className={clsx(
          'px-3 py-2 text-left text-xs font-semibold text-enterprise-500 uppercase tracking-wide cursor-pointer select-none whitespace-nowrap border-b border-enterprise-200',
          'hover:bg-enterprise-50 transition-colors',
          right && 'text-right'
        )}
        onClick={() => toggleSort(col)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </th>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="py-16 text-center text-text-muted">
        <div className="text-3xl mb-2">📭</div>
        <div className="text-sm font-medium">No cases match your filter</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-enterprise-50">
          <tr>
            <Th col="id" label="Case ID" />
            <Th col="title" label="Title" />
            <Th col="status" label="Status" />
            <Th col="priority" label="Priority" />
            <th className="px-3 py-2 text-xs font-semibold text-enterprise-500 uppercase tracking-wide border-b border-enterprise-200 whitespace-nowrap">Category</th>
            <Th col="assignedTo" label="Assigned To" />
            <Th col="age" label="Age" />
            <Th col="expectedClosure" label="Expected Closure" />
            <Th col="estimatedValue" label="Value" right />
            <th className="px-3 py-2 text-xs font-semibold text-enterprise-500 uppercase tracking-wide border-b border-enterprise-200">Risk</th>
            <th className="px-3 py-2 border-b border-enterprise-200 w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const age = caseAge(c);
            const risks = computeRisks(c);
            const isOpen = !['Closed', 'Cancelled'].includes(c.status);
            const isOverdue = isOpen && c.expectedClosure && new Date(c.expectedClosure) < new Date();
            const topRisk = risks.find(r => r.severity === 'critical') || risks[0];
            const ageColor = age > 30 ? 'text-danger font-semibold' : age > 14 ? 'text-warning font-semibold' : 'text-text-secondary';

            return (
              <tr
                key={c.id}
                className={clsx(
                  'border-b border-enterprise-100 group hover:bg-brand-light/40 transition-colors cursor-pointer',
                  i % 2 === 0 ? 'bg-white' : 'bg-enterprise-50/50'
                )}
              >
                <td className="px-3 py-2.5">
                  <Link href={`/cases/${c.id}`} className="font-mono text-xs text-brand hover:underline font-medium">
                    {c.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5 max-w-[200px]">
                  <Link href={`/cases/${c.id}`} className="block hover:text-brand transition-colors">
                    <div className="font-medium text-text-primary truncate text-sm" title={c.title}>{c.title}</div>
                    <div className="text-xs text-text-muted truncate">{c.requester}</div>
                  </Link>
                </td>
                <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                <td className="px-3 py-2.5"><PriorityBadge priority={c.priority} /></td>
                <td className="px-3 py-2.5 text-xs text-text-secondary whitespace-nowrap">{c.category}</td>
                <td className="px-3 py-2.5 text-xs text-text-secondary whitespace-nowrap">{c.assignedTo || '—'}</td>
                <td className="px-3 py-2.5">
                  <span className={clsx('text-sm', isOpen ? ageColor : 'text-text-muted')}>
                    {isOpen ? `${age}d` : '—'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                  <span className={isOverdue ? 'text-danger font-semibold' : 'text-text-secondary'}>
                    {formatDate(c.expectedClosure)}
                    {isOverdue && ' ⚠'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-text-secondary text-right whitespace-nowrap font-medium">
                  {c.estimatedValue ? formatCurrency(c.estimatedValue) : '—'}
                </td>
                <td className="px-3 py-2.5">
                  {risks.length === 0
                    ? <RiskBadge severity="healthy" label="Healthy" />
                    : <RiskBadge severity={topRisk.severity} label={`${risks.length} Risk${risks.length > 1 ? 's' : ''}`} />
                  }
                </td>
                <td className="px-2 py-2.5">
                  <Link
                    href={`/cases/${c.id}`}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-6 h-6 rounded text-text-muted hover:text-brand hover:bg-brand-light transition-all"
                  >
                    <ExternalLink size={12} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
