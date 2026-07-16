'use client';

import { create } from 'zustand';
import { 
  ProcurementCase, 
  Supplier, 
  Quotation, 
  computeRisks, 
  SAMPLE_CASES 
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
      console.error('Failed to load cases from FastAPI backend, using static samples:', err);
      set({ cases: SAMPLE_CASES, initialized: true, loading: false });
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
      console.error('Error creating case on backend:', err);
      throw err;
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
      
      // Reload cases
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.error('Error updating case on backend:', err);
      throw err;
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
      console.error('Error deleting case on backend:', err);
      throw err;
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
      
      // Reload cases
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.error('Error adding case update on backend:', err);
      throw err;
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
      console.error('Failed to load suppliers from backend:', err);
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
      console.error('Error adding supplier on backend:', err);
      throw err;
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
      console.error('Error deleting supplier on backend:', err);
      throw err;
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
      
      // Refresh cases to pull updated status/logs
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const data = await refreshRes.json();
      set({ cases: data });
    } catch (err) {
      console.error('Error setting bidders on backend:', err);
      throw err;
    }
  },

  async getBidders(caseId) {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}/bidders`);
      if (!res.ok) throw new Error('Failed to load bidders');
      return await res.json();
    } catch (err) {
      console.error('Error loading bidders from backend:', err);
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
      
      // Refresh cases
      const refreshRes = await fetch(`${API_BASE}/cases`);
      const casesData = await refreshRes.json();
      set({ cases: casesData });
    } catch (err) {
      console.error('Error submitting quotation on backend:', err);
      throw err;
    }
  },

  async getQuotations(caseId) {
    try {
      const res = await fetch(`${API_BASE}/quotations/case/${caseId}`);
      if (!res.ok) throw new Error('Failed to load quotations');
      return await res.json();
    } catch (err) {
      console.error('Error loading quotations from backend:', err);
      return [];
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
