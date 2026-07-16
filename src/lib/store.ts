'use client';

import { create } from 'zustand';
import { supabase } from './supabaseClient';
import { 
  ProcurementCase, 
  generateId, 
  computeRisks, 
  DOCUMENT_TYPES 
} from './data';

interface Store {
  cases: ProcurementCase[];
  initialized: boolean;
  loading: boolean;
  init: () => Promise<void>;
  addCase: (c: Omit<ProcurementCase, 'id' | 'updates' | 'lastUpdated'>) => Promise<string>;
  updateCase: (id: string, updates: Partial<ProcurementCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addUpdate: (caseId: string, text: string, author: string) => Promise<void>;
  // Derived
  openCases: () => ProcurementCase[];
  atRiskCases: () => ProcurementCase[];
  criticalCases: () => ProcurementCase[];
}

interface DbCaseUpdate {
  text: string;
  author: string;
  created_at: string;
}

interface DbDocumentChecklist {
  doc_type: string;
  received: boolean;
}

interface DbCaseRow {
  id: string;
  title: string;
  category: string;
  department: string;
  requester: string;
  assigned_to: string;
  priority: string;
  status: string;
  vendor: string | null;
  estimated_value: number;
  approved_budget: number;
  currency: string;
  opened_date: string;
  expected_closure: string | null;
  last_updated: string | null;
  description: string | null;
  tags: string[] | null;
  case_updates?: DbCaseUpdate[];
  document_checklist?: DbDocumentChecklist[];
}

// Database mapper helpers
function mapDbCase(row: DbCaseRow): ProcurementCase {
  const documents: Record<string, boolean> = {};
  
  DOCUMENT_TYPES.forEach(doc => {
    documents[doc] = false;
  });
  
  if (row.document_checklist) {
    row.document_checklist.forEach((d) => {
      documents[d.doc_type] = d.received;
    });
  }

  const updates = (row.case_updates || []).map((u) => ({
    date: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    text: u.text,
    author: u.author,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    department: row.department,
    requester: row.requester,
    assignedTo: row.assigned_to,
    priority: row.priority as ProcurementCase['priority'],
    status: row.status as ProcurementCase['status'],
    vendor: row.vendor || '',
    estimatedValue: Number(row.estimated_value || 0),
    approvedBudget: Number(row.approved_budget || 0),
    currency: row.currency || 'INR',
    openedDate: row.opened_date,
    expectedClosure: row.expected_closure || '',
    lastUpdated: row.last_updated || row.opened_date,
    description: row.description || '',
    documents,
    updates,
    tags: row.tags || [],
  };
}

function mapToDbCase(c: Partial<ProcurementCase>) {
  const dbData: Record<string, unknown> = {};
  if (c.title !== undefined) dbData.title = c.title;
  if (c.category !== undefined) dbData.category = c.category;
  if (c.department !== undefined) dbData.department = c.department;
  if (c.requester !== undefined) dbData.requester = c.requester;
  if (c.assignedTo !== undefined) dbData.assigned_to = c.assignedTo;
  if (c.priority !== undefined) dbData.priority = c.priority;
  if (c.status !== undefined) dbData.status = c.status;
  if (c.vendor !== undefined) dbData.vendor = c.vendor;
  if (c.estimatedValue !== undefined) dbData.estimated_value = c.estimatedValue;
  if (c.approvedBudget !== undefined) dbData.approved_budget = c.approvedBudget;
  if (c.currency !== undefined) dbData.currency = c.currency;
  if (c.openedDate !== undefined) dbData.opened_date = c.openedDate;
  if (c.expectedClosure !== undefined) dbData.expected_closure = c.expectedClosure || null;
  if (c.lastUpdated !== undefined) dbData.last_updated = c.lastUpdated;
  if (c.description !== undefined) dbData.description = c.description;
  if (c.tags !== undefined) dbData.tags = c.tags;
  return dbData;
}

export const useStore = create<Store>((set, get) => ({
  cases: [],
  initialized: false,
  loading: false,

  async init() {
    if (get().initialized) return;
    set({ loading: true });

    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          case_updates(text, author, created_at),
          document_checklist(doc_type, received)
        `);

      if (error) throw error;

      const mappedCases = ((data as unknown as DbCaseRow[]) || []).map(mapDbCase);
      set({ cases: mappedCases, initialized: true, loading: false });
    } catch (err) {
      console.error('Failed to load cases from Supabase database:', err);
      set({ loading: false });
      throw err;
    }
  },

  async addCase(data) {
    const { cases } = get();
    const today = new Date().toISOString().split('T')[0];
    const newCaseId = generateId(cases);

    const fullNewCase: ProcurementCase = {
      ...data,
      id: newCaseId,
      lastUpdated: today,
      updates: [{ date: today, text: 'Case created.', author: data.assignedTo || 'System' }],
      documents: data.documents || Object.fromEntries(DOCUMENT_TYPES.map(d => [d, false])),
      tags: data.tags || [],
    };

    try {
      // 1. Insert base case
      const dbCase = {
        ...mapToDbCase(fullNewCase),
        id: newCaseId
      };
      const { error: caseErr } = await supabase.from('cases').insert(dbCase);
      if (caseErr) throw caseErr;

      // 2. Insert document checklist items
      const checklistRows = DOCUMENT_TYPES.map(doc => ({
        case_id: newCaseId,
        doc_type: doc,
        received: fullNewCase.documents[doc] || false
      }));
      const { error: docErr } = await supabase.from('document_checklist').insert(checklistRows);
      if (docErr) throw docErr;

      // 3. Insert initial update note
      const { error: updateErr } = await supabase.from('case_updates').insert({
        case_id: newCaseId,
        text: 'Case created.',
        author: data.assignedTo || 'System'
      });
      if (updateErr) throw updateErr;

      set({ cases: [...cases, fullNewCase] });
    } catch (err) {
      console.error('Error adding case to Supabase:', err);
      throw err;
    }

    return newCaseId;
  },

  async updateCase(id, updates) {
    const today = new Date().toISOString().split('T')[0];
    const { cases } = get();
    const next = cases.map(c =>
      c.id === id ? { ...c, ...updates, lastUpdated: today } : c
    );

    try {
      // 1. Update cases table
      const dbCaseUpdates = mapToDbCase(updates);
      dbCaseUpdates.last_updated = today;
      const { error: caseErr } = await supabase
        .from('cases')
        .update(dbCaseUpdates)
        .eq('id', id);
      if (caseErr) throw caseErr;

      // 2. Update document checklist if included
      if (updates.documents) {
        const checklistUpserts = Object.entries(updates.documents).map(([docType, received]) => ({
          case_id: id,
          doc_type: docType,
          received
        }));
        
        const { error: docErr } = await supabase
          .from('document_checklist')
          .upsert(checklistUpserts, { onConflict: 'case_id,doc_type' });
        if (docErr) throw docErr;
      }

      set({ cases: next });
    } catch (err) {
      console.error('Error updating case in Supabase:', err);
      throw err;
    }
  },

  async deleteCase(id) {
    const { cases } = get();
    const next = cases.filter(c => c.id !== id);

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id);
      if (error) throw error;

      set({ cases: next });
    } catch (err) {
      console.error('Error deleting case from Supabase:', err);
      throw err;
    }
  },

  async addUpdate(caseId, text, author) {
    const today = new Date().toISOString().split('T')[0];
    const { cases } = get();
    const next = cases.map(c => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        lastUpdated: today,
        updates: [...(c.updates || []), { date: today, text, author }],
      };
    });

    try {
      // 1. Insert update note
      const { error: updateErr } = await supabase
        .from('case_updates')
        .insert({
          case_id: caseId,
          text,
          author
        });
      if (updateErr) throw updateErr;

      // 2. Update case's lastUpdated timestamp in DB
      const { error: caseErr } = await supabase
        .from('cases')
        .update({ last_updated: today })
        .eq('id', caseId);
      if (caseErr) throw caseErr;

      set({ cases: next });
    } catch (err) {
      console.error('Error adding case update in Supabase:', err);
      throw err;
    }
  },

  openCases() {
    return get().cases.filter(c => !['Closed', 'Cancelled'].includes(c.status));
  },

  atRiskCases() {
    return get().openCases().filter(c => computeRisks(c).length > 0);
  },

  criticalCases() {
    return get().openCases().filter(c => computeRisks(c).some(r => r.severity === 'critical'));
  },
}));
