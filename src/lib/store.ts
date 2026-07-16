'use client';

import { create } from 'zustand';
import { 
  ProcurementCase, 
  Supplier, 
  Quotation, 
  computeRisks, 
  SAMPLE_CASES,
  CaseStatus
} from './data';

const API_BASE = 'http://localhost:8000/api';

interface Store {
  cases: ProcurementCase[];
  suppliers: Supplier[];
  initialized: boolean;
  suppliersInitialized: boolean;
  loading: boolean;
  
  init: () => Promise<void>;
  addCase: (c: Omit<ProcurementCase, 'id' | 'updates' | 'lastUpdated'>) => Promise<string>;
  updateCase: (id: string, updates: Partial<ProcurementCase>) => Promise<void>;
  deleteCase: (id: string) => Promise<void>;
  addUpdate: (caseId: string, text: string, author: string) => Promise<void>;
  
  // Suppliers
  initSuppliers: () => Promise<void>;
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>) => Promise<string>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Bidding & Quotations
  setBidders: (caseId: string, supplierIds: string[]) => Promise<void>;
  getBidders: (caseId: string) => Promise<Supplier[]>;
  submitQuotation: (q: Omit<Quotation, 'id' | 'submittedAt'>) => Promise<void>;
  getQuotations: (caseId: string) => Promise<Quotation[]>;
  
  // Derived
  openCases: () => ProcurementCase[];
  atRiskCases: () => ProcurementCase[];
  criticalCases: () => ProcurementCase[];
}

export const useStore = create<Store>((set, get) => ({
  cases: [],
  suppliers: [],
  initialized: false,
  suppliersInitialized: false,
  loading: false,

  async init() {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/cases`);
      if (!res.ok) throw new Error('API response not ok');
      const data = await res.json();
      set({ cases: data, initialized: true, loading: false });
    } catch (err) {
      console.warn('Failed to load cases from FastAPI backend, using localStorage fallback:', err);
      const stored = typeof window !== 'undefined' ? localStorage.getItem('procuretrack_cases_v3') : null;
      const initialCases = stored ? JSON.parse(stored) : SAMPLE_CASES;
      if (typeof window !== 'undefined' && !stored) {
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(SAMPLE_CASES));
      }
      set({ cases: initialCases, initialized: true, loading: false });
    }
  },

  async addCase(data) {
    try {
      const res = await fetch(`${API_BASE}/cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create case');
      const newCase = await res.json();
      set({ cases: [...get().cases, newCase] });
      return newCase.id;
    } catch (err) {
      console.warn('Error creating case on backend, using localStorage fallback:', err);
      const year = new Date().getFullYear();
      const nums = get().cases.map(c => parseInt(c.id.split('-')[2])).filter(n => !isNaN(n));
      const next = nums.length ? Math.max(...nums) + 1 : 1;
      const newId = `PC-${year}-${String(next).padStart(3, '0')}`;
      
      const newCase: ProcurementCase = {
        id: newId,
        title: data.title || '',
        category: data.category || '',
        department: data.department || '',
        requester: data.requester || '',
        assignedTo: data.assignedTo || '',
        priority: data.priority || 'Medium',
        status: data.status || 'RFQ Draft',
        vendor: data.vendor || '',
        estimatedValue: data.estimatedValue || 0,
        approvedBudget: data.approvedBudget || 0,
        currency: data.currency || 'INR',
        openedDate: data.openedDate || new Date().toISOString().split('T')[0],
        expectedClosure: data.expectedClosure || new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        description: data.description || '',
        documents: data.documents || {},
        updates: [{ date: new Date().toISOString().split('T')[0], text: 'Case opened.', author: data.requester }],
        tags: data.tags || [],
        budgetCategory: data.budgetCategory
      };
      
      const updated = [...get().cases, newCase];
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updated));
      }
      set({ cases: updated });
      return newId;
    }
  },

  async updateCase(id, updates) {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update case');
      
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.warn('Error updating case on backend, using localStorage fallback:', err);
      const updated = get().cases.map(c => {
        if (c.id === id) {
          return { ...c, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updated));
      }
      set({ cases: updated });
    }
  },

  async deleteCase(id) {
    try {
      const res = await fetch(`${API_BASE}/cases/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete case');
      set({ cases: get().cases.filter(c => c.id !== id) });
    } catch (err) {
      console.warn('Error deleting case on backend, using localStorage fallback:', err);
      const updated = get().cases.filter(c => c.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updated));
      }
      set({ cases: updated });
    }
  },

  async addUpdate(caseId, text, author) {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author }),
      });
      if (!res.ok) throw new Error('Failed to log update');
      
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.warn('Error adding case update on backend, using localStorage fallback:', err);
      const updated = get().cases.map(c => {
        if (c.id === caseId) {
          const newUpdates = [...(c.updates || []), { date: new Date().toISOString().split('T')[0], text, author }];
          return { ...c, updates: newUpdates, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updated));
      }
      set({ cases: updated });
    }
  },

  async initSuppliers() {
    if (get().suppliersInitialized) return;
    try {
      const res = await fetch(`${API_BASE}/suppliers`);
      if (!res.ok) throw new Error('Failed to load suppliers');
      const data = await res.json();
      set({ suppliers: data, suppliersInitialized: true });
    } catch (err) {
      console.warn('Failed to load suppliers from backend, using localStorage fallback:', err);
      const stored = typeof window !== 'undefined' ? localStorage.getItem('procuretrack_suppliers_v3') : null;
      const initialSuppliers = stored ? JSON.parse(stored) : [
        { id: 'SUP-001', name: 'Salesforce Inc.', email: 'renewals@salesforce.com', phone: '+1 800 667 6389', category: 'IT & Software', city: 'San Francisco', rating: 5, createdAt: new Date().toISOString() },
        { id: 'SUP-002', name: 'Classmate Supplies Pvt Ltd', email: 'sales@classmate.in', phone: '+91 80 2345 6789', category: 'Facilities', city: 'Bangalore', rating: 4, createdAt: new Date().toISOString() },
        { id: 'SUP-003', name: 'AZB & Partners', email: 'delhi@azbpartners.com', phone: '+91 11 4155 5555', category: 'Professional Services', city: 'New Delhi', rating: 5, createdAt: new Date().toISOString() },
        { id: 'SUP-004', name: 'Amazon Web Services', email: 'billing@aws.amazon.com', phone: '+1 888 289 9720', category: 'IT & Software', city: 'Seattle', rating: 5, createdAt: new Date().toISOString() },
      ];
      if (typeof window !== 'undefined' && !stored) {
        localStorage.setItem('procuretrack_suppliers_v3', JSON.stringify(initialSuppliers));
      }
      set({ suppliers: initialSuppliers, suppliersInitialized: true });
    }
  },

  async addSupplier(data) {
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create supplier');
      const newSupplier = await res.json();
      set({ suppliers: [...get().suppliers, newSupplier] });
      return newSupplier.id;
    } catch (err) {
      console.warn('Error adding supplier on backend, using localStorage fallback:', err);
      const newSupplier: Supplier = {
        ...data,
        id: `SUP-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString()
      };
      const updated = [...get().suppliers, newSupplier];
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_suppliers_v3', JSON.stringify(updated));
      }
      set({ suppliers: updated });
      return newSupplier.id;
    }
  },

  async deleteSupplier(id) {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete supplier');
      set({ suppliers: get().suppliers.filter(s => s.id !== id) });
    } catch (err) {
      console.warn('Error deleting supplier on backend, using localStorage fallback:', err);
      const updated = get().suppliers.filter(s => s.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_suppliers_v3', JSON.stringify(updated));
      }
      set({ suppliers: updated });
    }
  },

  async setBidders(caseId, supplierIds) {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/bidders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierIds }),
      });
      if (!res.ok) throw new Error('Failed to assign bidders');
      
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.warn('Error setting bidders on backend, using localStorage fallback:', err);
      const updatedCases = get().cases.map(c => {
        if (c.id === caseId) {
          const newStatus: CaseStatus = c.status === 'RFQ Draft' ? 'Bidders Defined' : c.status;
          return { ...c, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_case_suppliers_v3_' + caseId, JSON.stringify(supplierIds));
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updatedCases));
      }
      set({ cases: updatedCases });
    }
  },

  async getBidders(caseId) {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/bidders`);
      if (!res.ok) throw new Error('Failed to load bidders');
      return await res.json();
    } catch (err) {
      console.warn('Error loading bidders from backend, using localStorage fallback:', err);
      const storedIds = typeof window !== 'undefined' ? localStorage.getItem('procuretrack_case_suppliers_v3_' + caseId) : null;
      if (storedIds) {
        const ids: string[] = JSON.parse(storedIds);
        return get().suppliers.filter(s => ids.includes(s.id));
      }
      return [];
    }
  },

  async submitQuotation(data) {
    try {
      const res = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to submit quote');
      
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const casesData = await refreshRes.json();
      set({ cases: casesData });
    } catch (err) {
      console.warn('Error submitting quotation on backend, using localStorage fallback:', err);
      const newQuote: Quotation = {
        ...data,
        id: `QUO-${Math.floor(100 + Math.random() * 900)}`,
        submittedAt: new Date().toISOString(),
        supplier: get().suppliers.find(s => s.id === data.supplierId)
      };
      
      const updatedCases = get().cases.map(c => {
        if (c.id === data.caseId) {
          const priorStages = ['RFQ Draft', 'Bidders Defined', 'RFQ Shared'];
          const newStatus: CaseStatus = priorStages.includes(c.status) ? 'Offers Received' : c.status;
          return { ...c, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] };
        }
        return c;
      });
      
      const stored = typeof window !== 'undefined' ? localStorage.getItem('procuretrack_quotations_v3_' + data.caseId) : null;
      const quotes = stored ? JSON.parse(stored) : [];
      const updatedQuotes = [...quotes, newQuote];
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('procuretrack_quotations_v3_' + data.caseId, JSON.stringify(updatedQuotes));
        localStorage.setItem('procuretrack_cases_v3', JSON.stringify(updatedCases));
      }
      set({ cases: updatedCases });
    }
  },

  async getQuotations(caseId) {
    try {
      const res = await fetch(`${API_BASE}/quotations/case/${caseId}`);
      if (!res.ok) throw new Error('Failed to load quotations');
      return await res.json();
    } catch (err) {
      console.warn('Error loading quotations from backend, using localStorage fallback:', err);
      const stored = typeof window !== 'undefined' ? localStorage.getItem('procuretrack_quotations_v3_' + caseId) : null;
      return stored ? JSON.parse(stored) : [];
    }
  },

  openCases() {
    return get().cases.filter(c => c.status !== 'GRN / Closed');
  },

  atRiskCases() {
    return get().openCases().filter(c => computeRisks(c).length > 0);
  },

  criticalCases() {
    return get().openCases().filter(c => computeRisks(c).some(r => r.severity === 'critical'));
  },
}));
