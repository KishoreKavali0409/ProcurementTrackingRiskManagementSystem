'use client';
// src/app/cases/[id]/page.tsx — Case Detail Page (SAP Fiori record view style)

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Panel, PanelHeader, Field, FieldGroup, ProgressBar } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CaseFormModal } from '@/components/cases/CaseFormModal';
import { useStore } from '@/lib/store';
import {
  ProcurementCase, computeRisks, getNextActions,
  caseAge, formatCurrency, formatDate, DOCUMENT_TYPES
} from '@/lib/data';
import {
  Edit2, Plus, ArrowLeft, CheckCircle, XCircle, Clock,
  TrendingUp, FileText, AlertTriangle, Zap
} from 'lucide-react';

const STATUS_FLOW = ['Draft', 'Under Review', 'Sourcing', 'Negotiation', 'Approved', 'Closed'];

// ── Shell: loads store, finds case, shows not-found if missing ────────────
export default function CaseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { cases, init } = useStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { init(); }, []);

  const c = cases.find(x => x.id === id);

  if (!c) {
    return (
      <AppShell title="Case Not Found">
        <div className="text-center py-20 text-text-muted">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm mb-4">
            Case <code className="font-mono bg-enterprise-100 px-1 rounded">{id}</code> not found.
          </p>
          <Link href="/cases">
            <Button variant="primary" size="sm" icon={ArrowLeft}>Back to Case Registry</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Once c is confirmed non-null, delegate to inner component
  return <CaseDetailInner caseData={c} />;
}

// ── Inner: receives guaranteed non-null case ─────────────────────────────
function CaseDetailInner({ caseData: c }: { caseData: ProcurementCase }) {
  const router = useRouter();
  const { cases, updateCase, deleteCase, addUpdate } = useStore();

  const [editOpen, setEditOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [updateAuthor, setUpdateAuthor] = useState('Priya Sharma');

  // Computed values — all safe since c is non-null here
  const risks = computeRisks(c);
  const actions = getNextActions(c, risks);
  const age = caseAge(c);
  const isOpen = !['Closed', 'Cancelled'].includes(c.status);
  const docsReceived = Object.values(c.documents).filter(Boolean).length;
  const docTotal = DOCUMENT_TYPES.length;
  const closure = c.expectedClosure ? new Date(c.expectedClosure) : null;
  const daysToClose = closure ? Math.ceil((closure.getTime() - Date.now()) / 86400000) : null;
  const budgetOverrun = c.estimatedValue > c.approvedBudget
    ? ((c.estimatedValue - c.approvedBudget) / c.approvedBudget * 100) : 0;
  const statusFlowIdx = STATUS_FLOW.indexOf(c.status);

  function handleSave(data: Partial<ProcurementCase>, isEdit: boolean) {
    if (isEdit && data.id) updateCase(data.id, data);
    setEditOpen(false);
  }

  function handleDelete(deletedId: string) {
    deleteCase(deletedId);
    router.push('/cases');
  }

  function handleAddUpdate() {
    if (!updateText.trim()) return;
    addUpdate(c.id, updateText.trim(), updateAuthor.trim() || 'User');
    setUpdateText('');
    setUpdateOpen(false);
  }

  function quickStatusChange(newStatus: string) {
    updateCase(c.id, { status: newStatus as ProcurementCase['status'] });
  }

  return (
    <AppShell
      title={c.title}
      subtitle={`${c.id}  ·  ${c.category}  ·  ${c.department}`}
      breadcrumbs={[{ label: 'Case Registry', href: '/cases' }, { label: c.id }]}
      actions={
        <>
          <Button icon={Plus} size="sm" onClick={() => setUpdateOpen(true)}>Add Update</Button>
          <Button icon={Edit2} variant="primary" size="sm" onClick={() => setEditOpen(true)}>Edit Case</Button>
        </>
      }
    >
      {/* Status Process Flow Bar (SAP Fiori style) */}
      <Panel className="mb-4" noPad>
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-0">
            {STATUS_FLOW.map((s, i) => {
              const isDone = statusFlowIdx > i;
              const isCurrent = statusFlowIdx === i;
              return (
                <div key={s} className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => {
                      if (!isCurrent && window.confirm(`Change status to "${s}"?`)) {
                        quickStatusChange(s);
                      }
                    }}
                    className={[
                      'flex flex-col items-center gap-1 px-3 py-1.5 rounded transition-all',
                      isCurrent
                        ? 'bg-brand text-white shadow-sm'
                        : isDone
                          ? 'text-success cursor-pointer hover:bg-success-bg'
                          : 'text-text-muted cursor-pointer hover:bg-enterprise-100',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold',
                      isCurrent
                        ? 'border-white bg-white text-brand'
                        : isDone
                          ? 'border-success bg-success text-white'
                          : 'border-enterprise-300',
                    ].join(' ')}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className="text-[10px] font-medium whitespace-nowrap">{s}</span>
                  </button>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`w-8 h-0.5 flex-shrink-0 ${isDone ? 'bg-success' : 'bg-enterprise-200'}`} />
                  )}
                </div>
              );
            })}
            {c.status === 'Cancelled' && (
              <div className="ml-4 px-3 py-1.5 rounded bg-danger-bg">
                <span className="text-xs font-semibold text-danger">Cancelled</span>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* Case Info */}
          <Panel>
            <PanelHeader title="Case Information" icon={<FileText size={15} />} />
            <FieldGroup label="Description">
              <p className="text-sm text-text-secondary leading-relaxed">
                {c.description || 'No description provided.'}
              </p>
              {c.tags && c.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {c.tags.map(t => <Tag key={t}>#{t}</Tag>)}
                </div>
              )}
            </FieldGroup>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
              <Field label="Vendor">{c.vendor}</Field>
              <Field label="Requester">{c.requester}</Field>
              <Field label="Assigned To">{c.assignedTo}</Field>
              <Field label="Department">{c.department}</Field>
              <Field label="Category">{c.category}</Field>
              <Field label="Currency">{c.currency || 'INR'}</Field>
              <Field label="Opened Date">{formatDate(c.openedDate)}</Field>
              <Field label="Expected Closure">{formatDate(c.expectedClosure)}</Field>
              <Field label="Last Updated">{formatDate(c.lastUpdated)}</Field>
            </div>
          </Panel>

          {/* Financial Summary */}
          <Panel>
            <PanelHeader title="Financial Summary" icon={<TrendingUp size={15} />} />
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded border border-enterprise-100 bg-enterprise-50">
                <div className="text-xs text-text-muted mb-1">Approved Budget</div>
                <div className="text-xl font-bold text-text-primary">{formatCurrency(c.approvedBudget)}</div>
              </div>
              <div className={`p-3 rounded border ${budgetOverrun > 0 ? 'border-warning/30 bg-warning-bg' : 'border-enterprise-100 bg-enterprise-50'}`}>
                <div className="text-xs text-text-muted mb-1">Estimated Value</div>
                <div className={`text-xl font-bold ${budgetOverrun > 0 ? 'text-warning' : 'text-text-primary'}`}>
                  {formatCurrency(c.estimatedValue)}
                </div>
              </div>
              <div className={`p-3 rounded border ${budgetOverrun > 10 ? 'border-danger/30 bg-danger-bg' : budgetOverrun > 0 ? 'border-warning/30 bg-warning-bg' : 'border-success/30 bg-success-bg'}`}>
                <div className="text-xs text-text-muted mb-1">Budget Variance</div>
                <div className={`text-xl font-bold ${budgetOverrun > 10 ? 'text-danger' : budgetOverrun > 0 ? 'text-warning' : 'text-success'}`}>
                  {budgetOverrun > 0 ? `+${budgetOverrun.toFixed(1)}%` : '✓ Within'}
                </div>
              </div>
            </div>
            {budgetOverrun > 0 && (
              <div className={`p-3 rounded border text-xs ${budgetOverrun > 10 ? 'border-danger/20 bg-danger-bg text-danger' : 'border-warning/20 bg-warning-bg text-warning'}`}>
                ⚠ Estimated value exceeds approved budget by {formatCurrency(c.estimatedValue - c.approvedBudget)} ({budgetOverrun.toFixed(1)}%).
                {budgetOverrun > 10 && ' Budget revision approval is recommended.'}
              </div>
            )}
          </Panel>

          {/* Document Checklist */}
          <Panel>
            <PanelHeader
              title="Document Checklist"
              icon={<FileText size={15} />}
              actions={<span className="text-xs text-text-muted">{docsReceived}/{docTotal} received</span>}
            />
            <ProgressBar
              value={docsReceived} max={docTotal}
              colorClass={docsReceived === docTotal ? 'bg-success' : docsReceived > docTotal / 2 ? 'bg-warning' : 'bg-danger'}
            />
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map(doc => (
                <div key={doc} className={`flex items-center gap-2.5 p-2 rounded border text-sm ${c.documents[doc] ? 'border-success/20 bg-success-bg' : 'border-enterprise-100 bg-enterprise-50'}`}>
                  {c.documents[doc]
                    ? <CheckCircle size={14} className="text-success flex-shrink-0" />
                    : <XCircle size={14} className="text-enterprise-300 flex-shrink-0" />}
                  <span className={c.documents[doc] ? 'text-success font-medium' : 'text-text-muted'}>{doc}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Activity Timeline */}
          <Panel>
            <PanelHeader
              title="Activity Timeline"
              icon={<Clock size={15} />}
              actions={<Button icon={Plus} size="xs" onClick={() => setUpdateOpen(true)}>Add Note</Button>}
            />

            {updateOpen && (
              <div className="mb-4 p-3 rounded border border-brand/20 bg-brand-light/30">
                <input
                  value={updateAuthor}
                  onChange={e => setUpdateAuthor(e.target.value)}
                  className="w-full h-7 px-2.5 mb-2 text-sm border border-enterprise-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="Author name"
                />
                <textarea
                  value={updateText}
                  onChange={e => setUpdateText(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-enterprise-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
                  rows={3}
                  placeholder="What happened? What are the next steps?"
                />
                <div className="flex gap-2 mt-2">
                  <Button size="xs" variant="primary" onClick={handleAddUpdate}>Save Note</Button>
                  <Button size="xs" onClick={() => { setUpdateOpen(false); setUpdateText(''); }}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="relative pl-5">
              <div className="absolute left-[7px] top-0 bottom-0 w-px bg-enterprise-100" />
              {[...(c.updates || [])].reverse().map((u, i) => (
                <div key={i} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-brand border-2 border-white shadow-sm" />
                  <div className="text-xs text-text-muted mb-0.5">{formatDate(u.date)} · {u.author}</div>
                  <div className="text-sm text-text-secondary">{u.text}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT: 4 cols sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">

          {/* Quick Metrics */}
          <Panel>
            <PanelHeader title="Case Metrics" />
            <div className="space-y-3">
              <Field label="Case Age" inline>
                <span className={age > 30 ? 'text-danger font-bold' : age > 14 ? 'text-warning font-bold' : 'text-text-primary'}>
                  {isOpen ? `${age} days` : '—'}
                </span>
              </Field>
              <ProgressBar
                value={Math.min(age, 60)} max={60}
                colorClass={age > 30 ? 'bg-danger' : age > 14 ? 'bg-warning' : 'bg-success'}
              />
              <Field label="Closure" inline>
                <span className={
                  daysToClose !== null && daysToClose < 0
                    ? 'text-danger font-bold'
                    : daysToClose !== null && daysToClose <= 3
                      ? 'text-warning font-bold'
                      : 'text-text-primary'
                }>
                  {daysToClose === null ? '—'
                    : daysToClose < 0 ? `${Math.abs(daysToClose)}d overdue`
                      : `${daysToClose}d remaining`}
                </span>
              </Field>
              <Field label="Documents" inline>
                <span className={docsReceived === docTotal ? 'text-success font-bold' : docsReceived > docTotal / 2 ? 'text-warning' : 'text-danger'}>
                  {docsReceived}/{docTotal} received
                </span>
              </Field>
              <Field label="Budget Variance" inline>
                <span className={budgetOverrun > 10 ? 'text-danger font-bold' : budgetOverrun > 0 ? 'text-warning' : 'text-success'}>
                  {budgetOverrun > 0 ? `+${budgetOverrun.toFixed(1)}%` : '✓ Within budget'}
                </span>
              </Field>
            </div>
          </Panel>

          {/* Risk Flags */}
          <Panel className={risks.length > 0 ? 'border-danger/20' : 'border-success/20'}>
            <PanelHeader
              title="Risk Flags"
              icon={<AlertTriangle size={15} className={risks.length > 0 ? 'text-danger' : 'text-success'} />}
            />
            {risks.length === 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded bg-success-bg text-success text-sm">
                <CheckCircle size={14} />
                <span className="font-medium">No active risks detected</span>
              </div>
            ) : (
              <div className="space-y-2">
                {risks.map((r, i) => (
                  <div key={i} className={`p-2.5 rounded border ${r.severity === 'critical' ? 'border-danger/20 bg-danger-bg' : 'border-warning/20 bg-warning-bg'}`}>
                    <div className={`text-xs font-bold mb-0.5 ${r.severity === 'critical' ? 'text-danger' : 'text-warning'}`}>
                      ● {r.type}
                    </div>
                    <div className={`text-xs ${r.severity === 'critical' ? 'text-danger/80' : 'text-warning/80'}`}>{r.msg}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Recommended Actions */}
          <Panel className="border-brand/20">
            <PanelHeader title="Recommended Actions" icon={<Zap size={15} className="text-brand" />} />
            <ol className="space-y-2">
              {actions.map((a, i) => (
                <li key={i} className="flex gap-2.5 p-2.5 rounded bg-enterprise-50 border border-enterprise-100 text-xs text-text-secondary">
                  <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <CaseFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        editCase={c}
        existingCases={cases}
      />
    </AppShell>
  );
}
