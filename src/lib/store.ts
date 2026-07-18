'use client';

import { create } from 'zustand';
import { 
  ProcurementCase, 
  Supplier, 
  Quotation, 
  computeRisks,
  Notification
} from './data';

const API_BASE = 'http://localhost:8000/api';

interface Store {
  cases: ProcurementCase[];
  suppliers: Supplier[];
  notifications: Notification[];
  initialized: boolean;
  suppliersInitialized: boolean;
  notificationsInitialized: boolean;
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
  
  // Notifications
  initNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  
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
      if (!res.ok) throw new Error('Failed to load cases');
      const data = await res.json();
      set({ cases: data, initialized: true, loading: false });
    } catch (err) {
      console.error('Failed to load cases from database:', err);
      set({ cases: [], initialized: false, loading: false });
      throw err;
    }
  },

  async addCase(data) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create case');
    const newCase = await res.json();
    set({ cases: [...get().cases, newCase] });
    return newCase.id;
  },

  async updateCase(id, updates) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update case');
    
    // Reload cases
    const refreshRes = await fetch(`${API_BASE}/cases`);
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      set({ cases: data });
    }
  },

  async deleteCase(id) {
    const res = await fetch(`${API_BASE}/cases/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete case');
    set({ cases: get().cases.filter(c => c.id !== id) });
  },

  async addUpdate(caseId, text, author) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    if (!res.ok) throw new Error('Failed to log update');
    
    // Reload cases
    const refreshRes = await fetch(`${API_BASE}/cases`);
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      set({ cases: data });
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
      console.error('Failed to load suppliers from database:', err);
      set({ suppliers: [], suppliersInitialized: false });
      throw err;
    }
  },

  async addSupplier(data) {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create supplier');
    const newSupplier = await res.json();
    set({ suppliers: [...get().suppliers, newSupplier] });
    return newSupplier.id;
  },

  async deleteSupplier(id) {
    const res = await fetch(`${API_BASE}/suppliers/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete supplier');
    set({ suppliers: get().suppliers.filter(s => s.id !== id) });
  },

  async setBidders(caseId, supplierIds) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/bidders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierIds }),
    });
    if (!res.ok) throw new Error('Failed to assign bidders');
    
    // Refresh cases
    const refreshRes = await fetch(`${API_BASE}/cases`);
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      set({ cases: data });
    }
  },

  async getBidders(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/bidders`);
    if (!res.ok) throw new Error('Failed to load bidders');
    return await res.json();
  },

  async submitQuotation(data) {
    const res = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit quote');
    
    // Refresh cases
    const refreshRes = await fetch(`${API_BASE}/cases`);
    if (refreshRes.ok) {
      const casesData = await refreshRes.json();
      set({ cases: casesData });
    }
  },

  async getQuotations(caseId) {
    const res = await fetch(`${API_BASE}/quotations/case/${caseId}`);
    if (!res.ok) throw new Error('Failed to load quotations');
    return await res.json();
  },

  notifications: [],
  notificationsInitialized: false,

  async initNotifications() {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      if (!res.ok) throw new Error('Failed to load notifications');
      const data = await res.json();
      set({ notifications: data, notificationsInitialized: true });
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT'
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    set({
      notifications: get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
    });
  },

  async clearNotifications() {
    const res = await fetch(`${API_BASE}/notifications/clear`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to clear notifications');
    set({ notifications: [] });
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
