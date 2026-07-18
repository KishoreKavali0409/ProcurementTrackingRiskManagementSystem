'use client';
// src/app/cases/[id]/page.tsx — Case Detail Page (SAP Fiori record view style with Bidding support)

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Panel, PanelHeader, Field, FieldGroup, ProgressBar } from '@/components/ui/Panel';
import { Tag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CaseFormModal } from '@/components/cases/CaseFormModal';
import { useStore, API_BASE } from '@/lib/store';
import { getUser, canEdit, canApprove, AuthUser } from '@/lib/auth';
import {
  ProcurementCase, computeRisks, getNextActions,
  caseAge, formatCurrency, formatDate, DOCUMENT_TYPES,
  Supplier, Quotation
} from '@/lib/data';
import {
  Edit2, Plus, ArrowLeft, CheckCircle, XCircle, Clock,
  TrendingUp, FileText, AlertTriangle, Zap, Users, Sparkles, Loader2, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';

const STATUS_FLOW = [
  'RFQ Draft', 'Bidders Defined', 'RFQ Shared', 'Offers Received',
  'Technical Evaluation', 'Commercial Negotiation', 'Approval Pending',
  'PO Released', 'Legal / NDA', 'GRN / Closed'
];

export default function CaseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { cases, init } = useStore();

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

  return <CaseDetailInner caseData={c} />;
}

function CaseDetailInner({ caseData: c }: { caseData: ProcurementCase }) {
  const router = useRouter();
  const { 
    cases, updateCase, deleteCase, addUpdate, 
    suppliers, initSuppliers, setBidders, 
    getBidders, submitQuotation, getQuotations 
  } = useStore();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [updateAuthor, setUpdateAuthor] = useState('');

  // Bidders and Quotes State
  const [bidders, setBiddersList] = useState<Supplier[]>([]);
  const [quotes, setQuotesList] = useState<Quotation[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedBidders, setSelectedBidders] = useState<string[]>([]);
  
  // Quote form state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');

  // AI Advisor State
  const [aiRisk, setAiRisk] = useState<{ summary: string; explanations: { riskType: string; severity: string; explanation: string }[]; recommendations: string[] } | null>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [aiActions, setAiActions] = useState<{ actions: { action: string; reason: string; priority: string }[] } | null>(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [aiError, setAiError] = useState('');

  async function fetchAiRisk() {
    setLoadingRisk(true);
    setAiError('');
    try {
      const res = await fetch(`${API_BASE}/ai/analyze-risk/${c.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('AI Risk analysis failed');
      const data = await res.json();
      setAiRisk(data);
    } catch (err) {
      console.error(err);
      setAiError('Failed to get AI risk analysis.');
    } finally {
      setLoadingRisk(false);
    }
  }

  async function fetchAiActions() {
    setLoadingActions(true);
    setAiError('');
    try {
      const res = await fetch(`${API_BASE}/ai/next-actions/${c.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('AI Next Actions failed');
      const data = await res.json();
      setAiActions(data);
    } catch (err) {
      console.error(err);
      setAiError('Failed to get AI actions.');
    } finally {
      setLoadingActions(false);
    }
  }

  // Fetch bidders & quotations on mount/update
  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) setUpdateAuthor(u.name);
    initSuppliers();
    loadBiddersAndQuotes();
  }, [c.id]);

  async function loadBiddersAndQuotes() {
    try {
      const bList = await getBidders(c.id);
      const qList = await getQuotations(c.id);
      setBiddersList(bList);
      setQuotesList(qList);
      setSelectedBidders(bList.map(s => s.id));
    } catch (err) {
      console.error('Failed to load bidders or quotes:', err);
    }
  }

  const risks = computeRisks(c);
  const actions = getNextActions(c, risks);
  const age = caseAge(c);
  const isOpen = c.status !== 'GRN / Closed';
  const docsReceived = Object.values(c.documents).filter(Boolean).length;
  const docTotal = DOCUMENT_TYPES.length;
  const closure = c.expectedClosure ? new Date(c.expectedClosure) : null;
  const daysToClose = closure ? Math.ceil((closure.getTime() - Date.now()) / 86400000) : null;
  const budgetOverrun = c.estimatedValue > c.approvedBudget
    ? ((c.estimatedValue - c.approvedBudget) / c.approvedBudget * 100) : 0;
  const statusFlowIdx = STATUS_FLOW.indexOf(c.status);

  // Find lowest quotation total price for comparison highlight
  const lowestQuote = quotes.length
    ? [...quotes].sort((a, b) => a.totalPrice - b.totalPrice)[0]
    : null;

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

  async function handleAssignBidders() {
    try {
      await setBidders(c.id, selectedBidders);
      setAssignOpen(false);
      await loadBiddersAndQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplierId || !totalPrice) return;
    try {
      await submitQuotation({
        caseId: c.id,
        supplierId: selectedSupplierId,
        unitPrice: parseFloat(unitPrice) || 0,
        totalPrice: parseFloat(totalPrice) || 0,
        deliveryDays: parseInt(deliveryDays) || 0,
        paymentTerms,
        notes
      });
      // Reset form
      setSelectedSupplierId('');
      setUnitPrice('');
      setTotalPrice('');
      setDeliveryDays('');
      setPaymentTerms('Net 30');
      setNotes('');
      setQuoteOpen(false);
      await loadBiddersAndQuotes();
    } catch (err) {
      console.error(err);
    }
  }

  function quickStatusChange(newStatus: string) {
    if (!user) return;
    if (!canEdit(user) && c.requester !== user.name) {
      alert('Access Denied: Requesters cannot promote status stage.');
      return;
    }
    if (newStatus === 'PO Released' && !canApprove(user)) {
      alert('Access Denied: Only Procurement Managers can approve PO release.');
      return;
    }
    updateCase(c.id, { status: newStatus as ProcurementCase['status'] });
  }

  const hasEditAccess = canEdit(user) || c.requester === user?.name;

  return (
    <AppShell
      title={c.title}
      subtitle={`${c.id}  ·  ${c.category}  ·  ${c.department}`}
      breadcrumbs={[{ label: 'Case Registry', href: '/cases' }, { label: c.id }]}
      actions={
        <>
          <Button icon={Plus} size="sm" onClick={() => setUpdateOpen(true)}>Add Note</Button>
          {hasEditAccess && (
            <Button icon={Edit2} variant="primary" size="sm" onClick={() => setEditOpen(true)}>Edit Case</Button>
          )}
        </>
      }
    >
      {/* 10-Stage Process Flow Bar */}
      <Panel className="mb-4" noPad>
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-[950px]">
            {STATUS_FLOW.map((s, i) => {
              const isDone = statusFlowIdx > i;
              const isCurrent = statusFlowIdx === i;
              return (
                <div key={s} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      if (!isCurrent && window.confirm(`Change status to "${s}"?`)) {
                        quickStatusChange(s);
                      }
                    }}
                    className="flex flex-col items-center gap-1 flex-1 py-1 rounded transition-all hover:bg-enterprise-50/50"
                  >
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all',
                      isCurrent
                        ? 'border-brand bg-brand text-white'
                        : isDone
                          ? 'border-success bg-success text-white'
                          : 'border-enterprise-300 text-text-muted bg-surface'
                    )}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={clsx(
                      "text-[10px] font-semibold whitespace-nowrap",
                      isCurrent ? "text-brand" : isDone ? "text-success" : "text-text-muted"
                    )}>
                      {s}
                    </span>
                  </button>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={clsx(
                      'h-0.5 flex-1 mx-2 min-w-[20px]',
                      isDone ? 'bg-success' : 'bg-enterprise-200'
                    )} />
                  )}
                </div>
              );
            })}
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
              <Field label="Vendor/Supplier">{c.vendor || '—'}</Field>
              <Field label="Requester">{c.requester}</Field>
              <Field label="Assigned To">{c.assignedTo}</Field>
              <Field label="Department">{c.department}</Field>
              <Field label="Category">{c.category}</Field>
              <Field label="Currency">{c.currency || 'INR'}</Field>
              <Field label="Opened Date">{formatDate(c.openedDate)}</Field>
              <Field label="Expected Closure">{formatDate(c.expectedClosure)}</Field>
              <Field label="Last Updated">{formatDate(c.lastUpdated)}</Field>
              <Field label="Budget category">
                <span className={clsx(
                  "text-2xs font-semibold px-1.5 py-0.5 rounded border",
                  c.budgetCategory === 'high_value' 
                    ? "bg-warning-bg text-warning border-warning/20" 
                    : "bg-brand-light text-brand border-brand/20"
                )}>
                  {c.budgetCategory === 'high_value' ? 'High Value (≥50K EUR)' : 'Standard (<50K EUR)'}
                </span>
              </Field>
            </div>
          </Panel>

          {/* Supplier Bidding Registry & Quotations Comparison */}
          <Panel>
            <PanelHeader 
              title="Supplier Bidding & Quotes" 
              icon={<Users size={15} />} 
              actions={
                hasEditAccess && (
                  <div className="flex items-center gap-1.5">
                    <Button icon={Users} size="xs" onClick={() => setAssignOpen(true)}>Assign Bidders</Button>
                    {bidders.length > 0 && (
                      <Button icon={Plus} size="xs" variant="primary" onClick={() => setQuoteOpen(true)}>Submit Quote</Button>
                    )}
                  </div>
                )
              }
            />

            {/* Bidders summary chips */}
            <div className="mb-4">
              <label className="block text-2xs font-semibold text-enterprise-400 uppercase tracking-wide mb-1.5">Assigned Bidders</label>
              <div className="flex flex-wrap gap-1.5">
                {bidders.length === 0 ? (
                  <span className="text-xs text-text-muted italic">No bidders assigned yet. Click &quot;Assign Bidders&quot; to select.</span>
                ) : (
                  bidders.map(b => (
                    <span key={b.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-enterprise-100 border border-enterprise-200 text-xs font-medium text-text-primary">
                      {b.name} <span className="text-[10px] text-text-muted">({b.city})</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Quotes side-by-side comparison table */}
            <div className="border border-enterprise-200 rounded overflow-hidden bg-enterprise-50/30">
              <div className="px-3 py-2 border-b border-enterprise-200 bg-enterprise-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-secondary">Quotation Comparison Grid</span>
                {lowestQuote && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-bg text-success border border-success/20 font-semibold">
                    Lowest bid highlighted
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-enterprise-200 bg-enterprise-50/50 text-text-secondary font-medium">
                      <th className="px-3 py-2 font-semibold">Supplier</th>
                      <th className="px-3 py-2 font-semibold text-right">Unit Price</th>
                      <th className="px-3 py-2 font-semibold text-right">Total Price</th>
                      <th className="px-3 py-2 font-semibold text-center">Delivery Time</th>
                      <th className="px-3 py-2 font-semibold">Payment Terms</th>
                      <th className="px-3 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-text-muted italic">
                          No quotations submitted yet. Click &quot;Submit Quote&quot; to record vendor responses.
                        </td>
                      </tr>
                    ) : (
                      quotes.map(q => {
                        const isBest = q.id === lowestQuote?.id;
                        return (
                          <tr 
                            key={q.id} 
                            className={clsx(
                              "border-b border-enterprise-100 transition-colors text-xs",
                              isBest ? "bg-success-bg/60 text-success hover:bg-success-bg" : "hover:bg-enterprise-50/50 bg-surface"
                            )}
                          >
                            <td className="px-3 py-2.5 font-semibold text-text-primary">
                              {q.supplier?.name || 'Unknown Supplier'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(q.unitPrice)}</td>
                            <td className="px-3 py-2.5 text-right font-bold">{formatCurrency(q.totalPrice)}</td>
                            <td className="px-3 py-2.5 text-center font-medium">{q.deliveryDays} Days</td>
                            <td className="px-3 py-2.5">{q.paymentTerms}</td>
                            <td className="px-3 py-2.5 text-text-secondary italic">{q.notes || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>

          {/* Financial Summary */}
          <Panel>
            <PanelHeader title="Financial Summary" icon={<TrendingUp size={15} />} />
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded border border-enterprise-100 bg-surface">
                <div className="text-xs text-text-muted mb-1">Approved Budget</div>
                <div className="text-xl font-bold text-text-primary">{formatCurrency(c.approvedBudget)}</div>
              </div>
              <div className={`p-3 rounded border ${budgetOverrun > 0 ? 'border-warning/30 bg-warning-bg' : 'border-enterprise-100 bg-surface'}`}>
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
                <div key={doc} className={`flex items-center gap-2.5 p-2 rounded border text-sm ${c.documents[doc] ? 'border-success/20 bg-success-bg' : 'border-enterprise-100 bg-surface'}`}>
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
              <div className="mb-4 p-3 rounded border border-brand/20 bg-surface">
                <input
                  value={updateAuthor}
                  onChange={e => setUpdateAuthor(e.target.value)}
                  className="w-full h-7 px-2.5 mb-2 text-sm border border-enterprise-200 rounded bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  placeholder="Author name"
                />
                <textarea
                  value={updateText}
                  onChange={e => setUpdateText(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-enterprise-200 rounded bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none"
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
          {/* AI Sourcing Advisor */}
          <Panel className="border-brand/35 bg-brand-light/5">
            <PanelHeader
              title="AI Sourcing Advisor"
              icon={<Sparkles size={15} className="text-brand animate-pulse" />}
            />
            
            {!aiRisk && !aiActions ? (
              <div className="p-1.5 text-center">
                <p className="text-xs text-text-secondary leading-relaxed mb-3">
                  Activate Gemini AI to generate context-aware risk summaries, mitigation advice, and actionable next steps.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full flex items-center justify-center gap-1.5"
                  onClick={() => { fetchAiRisk(); fetchAiActions(); }}
                  disabled={loadingRisk || loadingActions}
                >
                  {(loadingRisk || loadingActions) ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Analyzing Case Sourcing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Generate AI Advisor Insights
                    </>
                  )}
                </Button>
                {aiError && <p className="text-[11px] text-danger mt-2">{aiError}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Risk audit */}
                {aiRisk && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-brand uppercase tracking-wider flex items-center gap-1">
                      <span>⚠️</span> AI Risk Audit
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed bg-white dark:bg-surface-alt p-2.5 rounded border border-enterprise-150 shadow-xs">
                      {aiRisk.summary}
                    </p>
                    
                    {aiRisk.explanations && aiRisk.explanations.length > 0 && (
                      <div className="space-y-1.5">
                        {aiRisk.explanations.map((exp, idx) => (
                          <div key={idx} className="text-[11px] p-2 bg-white dark:bg-surface-alt rounded border border-enterprise-100 flex gap-2">
                            <span className={clsx(
                              "font-bold uppercase text-[9px] px-1 rounded flex-shrink-0 self-start mt-0.5",
                              exp.severity === 'critical' ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
                            )}>
                              {exp.severity}
                            </span>
                            <div>
                              <span className="font-semibold text-text-primary block">{exp.riskType}</span>
                              <span className="text-text-secondary">{exp.explanation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {aiRisk.recommendations && aiRisk.recommendations.length > 0 && (
                      <div className="mt-2.5 p-2 bg-white dark:bg-surface-alt rounded border border-enterprise-100 space-y-1">
                        <span className="text-[10px] font-bold text-text-secondary block uppercase tracking-wider">Mitigation Recommendations</span>
                        <ul className="list-disc pl-4 text-[11px] text-text-secondary space-y-1">
                          {aiRisk.recommendations.map((rec, idx) => (
                            <li key={idx} className="leading-relaxed">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {aiActions && (
                  <div className="space-y-2 pt-2.5 border-t border-enterprise-200">
                    <div className="text-[11px] font-semibold text-brand uppercase tracking-wider flex items-center gap-1">
                      <span>🎯</span> AI Next Best Actions
                    </div>
                    <div className="space-y-1.5">
                      {aiActions.actions.map((act, idx) => (
                        <div key={idx} className="p-2.5 bg-white dark:bg-surface-alt rounded border border-enterprise-100 text-xs flex gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-text-primary block">{act.action}</span>
                            <span className="text-[11px] text-text-secondary block mt-0.5 leading-relaxed">{act.reason}</span>
                            <span className={clsx(
                              "inline-block text-[9px] font-bold px-1 rounded mt-1.5 uppercase",
                              act.priority === 'High' ? 'bg-danger-bg text-danger' : act.priority === 'Medium' ? 'bg-warning-bg text-warning' : 'bg-enterprise-100 text-text-secondary'
                            )}>
                              Priority: {act.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { fetchAiRisk(); fetchAiActions(); }}
                    className="text-text-muted hover:text-brand text-[10px] font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                    disabled={loadingRisk || loadingActions}
                  >
                    <RefreshCw size={10} className={clsx(loadingRisk || loadingActions ? "animate-spin" : "")} />
                    Regenerate Insights
                  </button>
                </div>
              </div>
            )}
          </Panel>

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
                       {r.type}
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

      {/* Assign Bidders Dialog */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded border border-enterprise-200 shadow-md max-w-md w-full overflow-hidden">
            <div className="px-4 py-3 border-b border-enterprise-200 bg-enterprise-50 flex items-center justify-between">
              <span className="font-semibold text-text-primary">Assign Bidders</span>
              <button onClick={() => setAssignOpen(false)} className="text-text-muted hover:text-text-primary text-sm font-semibold">✕</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {suppliers.length === 0 ? (
                <p className="text-xs text-text-muted italic">No suppliers in registry. Please add suppliers first.</p>
              ) : (
                suppliers.map(s => {
                  const isChecked = selectedBidders.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 p-2 rounded border border-enterprise-100 hover:bg-enterprise-50 cursor-pointer transition-all">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedBidders(selectedBidders.filter(id => id !== s.id));
                          } else {
                            setSelectedBidders([...selectedBidders, s.id]);
                          }
                        }}
                        className="w-4 h-4 accent-brand"
                      />
                      <div>
                        <div className="text-sm font-medium text-text-primary">{s.name}</div>
                        <div className="text-xs text-text-muted">{s.category} · {s.city}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 border-t border-enterprise-100 bg-enterprise-50 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={handleAssignBidders}>Save Selection</Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Quotation Dialog */}
      {quoteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded border border-enterprise-200 shadow-md max-w-md w-full overflow-hidden">
            <div className="px-4 py-3 border-b border-enterprise-200 bg-enterprise-50 flex items-center justify-between">
              <span className="font-semibold text-text-primary">Submit Supplier Quotation</span>
              <button onClick={() => setQuoteOpen(false)} className="text-text-muted hover:text-text-primary text-sm font-semibold">✕</button>
            </div>
            <form onSubmit={handleQuoteSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Select Bidder</label>
                <select 
                  required
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-surface focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">-- Choose Assigned Supplier --</option>
                  {bidders.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Unit Price (₹)</label>
                  <input 
                    type="number"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Total Quote Price (₹)</label>
                  <input 
                    required
                    type="number"
                    value={totalPrice}
                    onChange={e => setTotalPrice(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Delivery Lead Time</label>
                  <input 
                    type="number"
                    value={deliveryDays}
                    onChange={e => setDeliveryDays(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="Days"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Payment Terms</label>
                  <input 
                    type="text"
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="e.g. Net 30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Remarks / Notes</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-enterprise-200 rounded bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                  rows={2}
                  placeholder="e.g. Warranty details, volume discount"
                />
              </div>
              <div className="pt-3 border-t border-enterprise-100 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setQuoteOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" variant="primary">Submit Bidding Quote</Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
