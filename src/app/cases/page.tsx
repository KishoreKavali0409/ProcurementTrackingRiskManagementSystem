'use client';
// src/app/cases/page.tsx — v2: CSV export, dept/category filters, inline actions

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { CaseTable } from '@/components/cases/CaseTable';
import { CaseFormModal } from '@/components/cases/CaseFormModal';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { ProcurementCase, STATUSES, CATEGORIES, DEPARTMENTS, CaseStatus, computeRisks } from '@/lib/data';
import { exportCasesToCSV } from '@/lib/export';
import { clsx } from 'clsx';
import { Plus, Search, RefreshCw, Download, Filter, X } from 'lucide-react';

export default function CasesPage() {
  const { cases, init, addCase, updateCase, deleteCase } = useStore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all' | 'at-risk'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCase, setEditCase] = useState<ProcurementCase | null>(null);

  const filtered = cases.filter(c => {
    if (statusFilter === 'at-risk' && computeRisks(c).length === 0) return false;
    if (statusFilter !== 'all' && statusFilter !== 'at-risk' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (deptFilter !== 'all' && c.department !== deptFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.vendor.toLowerCase().includes(q) ||
        c.requester.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.assignedTo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const hasAdvancedFilter = categoryFilter !== 'all' || deptFilter !== 'all' || priorityFilter !== 'all';

  function clearFilters() {
    setStatusFilter('all');
    setCategoryFilter('all');
    setDeptFilter('all');
    setPriorityFilter('all');
    setSearch('');
  }

  function handleSave(data: Partial<ProcurementCase>, isEdit: boolean) {
    if (isEdit && data.id) updateCase(data.id, data);
    else addCase(data as ProcurementCase);
    setModalOpen(false);
    setEditCase(null);
  }

  function handleDelete(id: string) {
    deleteCase(id);
    setModalOpen(false);
    setEditCase(null);
  }

  const STATUS_TABS: { label: string; value: CaseStatus | 'all' | 'at-risk' }[] = [
    { label: `All (${cases.length})`, value: 'all' },
    { label: `At Risk (${cases.filter(c => !['Closed','Cancelled'].includes(c.status) && computeRisks(c).length > 0).length})`, value: 'at-risk' },
    ...STATUSES
      .map(s => ({ label: `${s} (${cases.filter(c => c.status === s).length})`, value: s as CaseStatus }))
      .filter(f => cases.some(c => c.status === f.value)),
  ];

  return (
    <AppShell
      title="Case Registry"
      subtitle={`${filtered.length} of ${cases.length} cases`}
      breadcrumbs={[{ label: 'Case Registry' }]}
      actions={
        <>
          <Button icon={RefreshCw} size="sm" onClick={() => init()}>Refresh</Button>
          <Button icon={Download} size="sm" onClick={() => exportCasesToCSV(filtered)}>Export CSV</Button>
          <Button icon={Plus} variant="primary" size="sm" onClick={() => { setEditCase(null); setModalOpen(true); }}>
            New Case
          </Button>
        </>
      }
    >
      <Panel noPad>
        {/* Primary toolbar */}
        <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-enterprise-200 bg-enterprise-50">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cases, vendors, requesters…"
              className="w-full h-7 pl-7 pr-3 text-sm border border-enterprise-200 rounded bg-white placeholder-text-muted
                focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Advanced filter toggle */}
          <Button
            icon={Filter}
            size="sm"
            variant={hasAdvancedFilter ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {hasAdvancedFilter && `(${[categoryFilter !== 'all', deptFilter !== 'all', priorityFilter !== 'all'].filter(Boolean).length})`}
          </Button>

          {hasAdvancedFilter && (
            <Button size="sm" variant="ghost" icon={X} onClick={clearFilters}>Clear</Button>
          )}
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="flex gap-3 flex-wrap px-4 py-3 border-b border-enterprise-200 bg-white">
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-semibold text-enterprise-400 uppercase tracking-wide">Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="h-7 px-2 text-sm border border-enterprise-200 rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-semibold text-enterprise-400 uppercase tracking-wide">Department</label>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                className="h-7 px-2 text-sm border border-enterprise-200 rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                <option value="all">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-2xs font-semibold text-enterprise-400 uppercase tracking-wide">Priority</label>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                className="h-7 px-2 text-sm border border-enterprise-200 rounded bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                <option value="all">All Priorities</option>
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 border-b border-enterprise-200 bg-enterprise-50">
          {STATUS_TABS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={clsx(
                'px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap transition-all flex-shrink-0',
                statusFilter === f.value
                  ? f.value === 'at-risk'
                    ? 'bg-danger text-white'
                    : 'bg-brand text-white'
                  : 'bg-white border border-enterprise-200 text-text-secondary hover:border-enterprise-400 hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <CaseTable cases={filtered} />

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-enterprise-200 bg-enterprise-50 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== cases.length && ` (filtered from ${cases.length})`}
          </span>
          <Button icon={Download} size="xs" variant="ghost" onClick={() => exportCasesToCSV(filtered)}>
            Export {filtered.length} rows
          </Button>
        </div>
      </Panel>

      <CaseFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCase(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        editCase={editCase}
        existingCases={cases}
      />
    </AppShell>
  );
}
