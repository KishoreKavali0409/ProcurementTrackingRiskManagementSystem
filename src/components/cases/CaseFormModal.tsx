'use client';
// src/components/cases/CaseFormModal.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ProcurementCase, STATUSES, CATEGORIES, DEPARTMENTS, PRIORITIES, DOCUMENT_TYPES, generateId } from '@/lib/data';
import { Button } from '@/components/ui/Button';
import { clsx } from 'clsx';

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'financial' | 'docs'>('basic');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
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

  function handleSave() {
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
    { id: 'financial', label: 'Financial' },
    { id: 'docs', label: 'Documents' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-enterprise-200">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {editCase ? `Edit Case — ${editCase.id}` : 'New Procurement Case'}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {editCase ? 'Update case information' : 'Create a new procurement case record'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded hover:bg-enterprise-100 transition-colors">
            <X size={16} className="text-text-muted" />
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'basic' && (
            <div className="space-y-3">
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-enterprise-200 bg-enterprise-50 rounded-b-lg">
          <div>
            {editCase && onDelete && (
              <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this case?')) onDelete(editCase.id); }}>
                Delete Case
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editCase ? 'Save Changes' : 'Create Case'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
