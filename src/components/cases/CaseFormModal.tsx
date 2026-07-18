'use client';
// src/components/cases/CaseFormModal.tsx

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { ProcurementCase, STATUSES, CATEGORIES, DEPARTMENTS, PRIORITIES, DOCUMENT_TYPES, generateId } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';
import { getUser, canEdit, canApprove, AuthUser } from '@/lib/auth';
import { API_BASE } from '@/lib/store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProcurementCase>, isEdit: boolean) => void;
  onDelete?: (id: string) => void;
  editCase?: ProcurementCase | null;
  existingCases: ProcurementCase[];
}

function Input({ label, id, required, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={id}
        {...rest}
        className="w-full h-8 px-2.5 text-sm border border-enterprise-200 rounded bg-white text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
      />
    </div>
  );
}

function Select({ label, id, children, required, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <select
        id={id}
        {...rest}
        className="w-full h-8 px-2.5 text-sm border border-enterprise-200 rounded bg-white text-text-primary
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all appearance-none"
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, id, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <textarea
        id={id}
        {...rest}
        className="w-full px-2.5 py-2 text-sm border border-enterprise-200 rounded bg-white text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
      />
    </div>
  );
}

type FormState = {
  title: string; category: string; department: string; requester: string;
  assignedTo: string; vendor: string; priority: string; status: string;
  approvedBudget: string; estimatedValue: string; openedDate: string;
  expectedClosure: string; description: string;
  documents: Record<string, boolean>;
  budgetCategory: string;
};

export function CaseFormModal({ open, onClose, onSave, onDelete, editCase, existingCases }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const emptyDocs = Object.fromEntries(DOCUMENT_TYPES.map(d => [d, false]));

  const [form, setForm] = useState<FormState>({
    title: '', category: CATEGORIES[0], department: DEPARTMENTS[0],
    requester: '', assignedTo: 'Priya Sharma', vendor: '', priority: 'Medium',
    status: 'RFQ Draft', approvedBudget: '', estimatedValue: '',
    openedDate: today, expectedClosure: '', description: '',
    documents: emptyDocs,
    budgetCategory: 'standard',
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'docs'>('basic');

  const [showAiParser, setShowAiParser] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [parsingEmail, setParsingEmail] = useState(false);
  const [aiError, setAiError] = useState('');

  async function handleParseEmail() {
    if (!emailText.trim()) return;
    setParsingEmail(true);
    setAiError('');
    try {
      const res = await fetch(`${API_BASE}/ai/parse-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailText }),
      });
      if (!res.ok) throw new Error('AI parse request failed');
      const data = await res.json();
      
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        category: data.category || f.category,
        department: data.department || f.department,
        priority: data.priority || f.priority,
        estimatedValue: data.estimatedValue !== undefined ? String(data.estimatedValue) : f.estimatedValue,
        approvedBudget: data.approvedBudget !== undefined ? String(data.approvedBudget) : f.approvedBudget,
        expectedClosure: data.expectedClosure || f.expectedClosure,
      }));
      setShowAiParser(false);
      setEmailText('');
    } catch (err) {
      console.error(err);
      setAiError('Failed to parse email. Please verify backend connection and API key configuration.');
    } finally {
      setParsingEmail(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setUser(getUser());
    if (editCase) {
      setForm({
        title: editCase.title, category: editCase.category, department: editCase.department,
        requester: editCase.requester, assignedTo: editCase.assignedTo, vendor: editCase.vendor,
        priority: editCase.priority, status: editCase.status,
        approvedBudget: String(editCase.approvedBudget || ''), estimatedValue: String(editCase.estimatedValue || ''),
        openedDate: editCase.openedDate, expectedClosure: editCase.expectedClosure,
        description: editCase.description,
        documents: { ...emptyDocs, ...editCase.documents },
        budgetCategory: editCase.budgetCategory || 'standard',
      });
    } else {
      setForm({ title: '', category: CATEGORIES[0], department: DEPARTMENTS[0], requester: '', assignedTo: 'Priya Sharma', vendor: '', priority: 'Medium', status: 'RFQ Draft', approvedBudget: '', estimatedValue: '', openedDate: today, expectedClosure: '', description: '', documents: emptyDocs, budgetCategory: 'standard' });
    }
    setErrors({});
    setActiveTab('basic');
  }, [editCase, open]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(field: keyof FormState, val: any) {
    setForm(f => ({ ...f, [field]: val }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.requester.trim()) e.requester = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const isReadOnly = editCase ? (!canEdit(user) && editCase.requester !== user?.name) : false;
  const canDelete = !!user && canApprove(user);

  function handleSave() {
    if (isReadOnly) return;
    if (!validate()) { setActiveTab('basic'); return; }
    const data: Partial<ProcurementCase> = {
      ...form,
      approvedBudget: parseFloat(form.approvedBudget) || 0,
      estimatedValue: parseFloat(form.estimatedValue) || 0,
      currency: 'INR',
      id: editCase?.id || generateId(existingCases),
      tags: editCase?.tags || [],
      updates: editCase?.updates || [],
      priority: form.priority as ProcurementCase['priority'],
      status: form.status as ProcurementCase['status'],
      budgetCategory: form.budgetCategory as 'standard' | 'high_value',
    };
    onSave(data, !!editCase);
  }

  if (!open) return null;

  const TABS = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'financial', label: 'Financials' },
    { id: 'docs', label: 'Documents' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg border border-enterprise-200 shadow-md max-w-lg w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-enterprise-200 bg-enterprise-50 flex items-center justify-between rounded-t-lg">
          <span className="font-semibold text-text-primary text-sm uppercase tracking-wide">
            {editCase ? 'Edit Case Record' : 'Create Procurement Case'}
          </span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-enterprise-200 px-5 bg-enterprise-50">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={clsx(
                'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all',
                activeTab === t.id
                  ? 'border-brand text-brand bg-white'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isReadOnly && (
          <div className="bg-info-bg px-5 py-2 text-xs text-info font-semibold border-b border-enterprise-200">
            ℹ You are viewing this case in read-only mode.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <fieldset disabled={isReadOnly} className="contents">
          {activeTab === 'basic' && (
            <div className="space-y-3">
              {!editCase && !isReadOnly && (
                <div className="mb-3">
                  {!showAiParser ? (
                    <button
                      type="button"
                      onClick={() => setShowAiParser(true)}
                      className="w-full py-2 px-3 border border-dashed border-brand/50 bg-brand/5 hover:bg-brand/10 text-brand text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={13} className="text-brand animate-pulse" />
                      AI Auto-Fill from Email Sourcing Document
                    </button>
                  ) : (
                    <div className="bg-enterprise-50 dark:bg-surface-alt p-3.5 border border-brand/20 rounded space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-brand flex items-center gap-1.5">
                          <Sparkles size={13} className="text-brand" />
                          AI Email-to-Case Extractor
                        </span>
                        <button
                          type="button"
                          onClick={() => { setShowAiParser(false); setAiError(''); }}
                          className="text-text-secondary hover:text-text-primary text-[11px] font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        Paste the raw request or sourcing email text below. Gemini AI will automatically extract case title, category, budget, department, priority and closure timeline.
                      </p>
                      <textarea
                        rows={4}
                        className="w-full p-2.5 text-xs border border-enterprise-200 dark:border-enterprise-800 rounded focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white dark:bg-surface text-text-primary"
                        placeholder="e.g. Hi Priya, we need to procure 50 units of industrial steel sheets for the Manufacturing division. Expected value is 45,000 INR with a budget of 50,000 INR. Need this completed by August 15..."
                        value={emailText}
                        onChange={e => setEmailText(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          type="button"
                          onClick={handleParseEmail}
                          disabled={parsingEmail || !emailText.trim()}
                        >
                          {parsingEmail ? 'Extracting...' : 'Extract & Auto-Fill'}
                        </Button>
                      </div>
                      {aiError && <p className="text-[11px] text-danger mt-1">{aiError}</p>}
                    </div>
                  )}
                </div>
              )}

              <Input label="Case Title" id="f-title" required placeholder="e.g. Annual SAP License Renewal" value={form.title} onChange={e => set('title', e.target.value)} />
              {errors.title && <p className="text-xs text-danger -mt-2">{errors.title}</p>}

              <div className="grid grid-cols-2 gap-3">
                <Select label="Priority" id="f-priority" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </Select>
                <Select label="Status" id="f-status" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select label="Category" id="f-cat" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
                <Select label="Department" id="f-dept" value={form.department} onChange={e => set('department', e.target.value)}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Requester Name" id="f-req" required placeholder="Who raised this?" value={form.requester} onChange={e => set('requester', e.target.value)} />
                  {errors.requester && <p className="text-xs text-danger mt-0.5">{errors.requester}</p>}
                </div>
                <Input label="Assigned To" id="f-assign" placeholder="Procurement owner" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} />
              </div>

              <Input label="Vendor / Shortlist" id="f-vendor" placeholder="Vendor name or TBD" value={form.vendor} onChange={e => set('vendor', e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Opened Date" id="f-open" type="date" value={form.openedDate} onChange={e => set('openedDate', e.target.value)} />
                <Input label="Expected Closure" id="f-close" type="date" value={form.expectedClosure} onChange={e => set('expectedClosure', e.target.value)} />
              </div>

              <Textarea label="Description / Scope" id="f-desc" rows={3} placeholder="What is being procured and why?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Approved Budget (₹)" id="f-budget" type="number" placeholder="0" value={form.approvedBudget} onChange={e => set('approvedBudget', e.target.value)} />
                <Input label="Estimated Value (₹)" id="f-estimate" type="number" placeholder="0" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} />
              </div>
              <Select label="Budget Category" id="f-budget-cat" value={form.budgetCategory} onChange={e => set('budgetCategory', e.target.value)}>
                <option value="standard">Standard (&lt;50K EUR)</option>
                <option value="high_value">High Value (≥50K EUR)</option>
              </Select>
              {form.approvedBudget && form.estimatedValue && parseFloat(form.estimatedValue) > parseFloat(form.approvedBudget) && (
                <div className="bg-warning-bg border border-warning/20 rounded p-3 text-xs text-warning">
                  ⚠ Estimated value exceeds approved budget by{' '}
                  {(((parseFloat(form.estimatedValue) - parseFloat(form.approvedBudget)) / parseFloat(form.approvedBudget)) * 100).toFixed(1)}%
                </div>
              )}
              <div className="bg-enterprise-50 rounded p-3 text-xs text-text-secondary border border-enterprise-200">
                Budget variance, overrun flags, and financial risk will be computed automatically based on these values.
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div>
              <p className="text-xs text-text-secondary mb-3">Check documents that have been received or uploaded for this case.</p>
              <div className="space-y-2">
                {DOCUMENT_TYPES.map(doc => (
                  <label key={doc} className="flex items-center gap-3 p-2.5 rounded border border-enterprise-100 hover:border-enterprise-300 hover:bg-enterprise-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={!!form.documents[doc]}
                      onChange={e => set('documents', { ...form.documents, [doc]: e.target.checked })}
                      className="w-4 h-4 accent-brand"
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">{doc}</div>
                      <div className="text-xs text-text-muted">
                        {form.documents[doc] ? '✓ Received' : 'Pending'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-enterprise-200 bg-enterprise-50 rounded-b-lg">
          <div>
            {editCase && onDelete && canDelete && (
              <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this case?')) onDelete(editCase.id); }}>
                Delete Case
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>{isReadOnly ? 'Close' : 'Cancel'}</Button>
            {!isReadOnly && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                {editCase ? 'Save Changes' : 'Create Case'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
