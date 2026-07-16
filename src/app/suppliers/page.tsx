'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { Plus, Search, Trash2, Mail, Phone, MapPin, Tag } from 'lucide-react';

export default function SuppliersPage() {
  const { suppliers, initSuppliers, addSupplier, deleteSupplier } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('IT & Software');
  const [city, setCity] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    initSuppliers();
  }, []);

  const filtered = suppliers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await addSupplier({ name, email, phone, category, city, rating });
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setCategory('IT & Software');
      setCity('');
      setRating(5);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppShell
      title="Supplier Registry"
      subtitle={`${filtered.length} of ${suppliers.length} suppliers`}
      breadcrumbs={[{ label: 'Supplier Registry' }]}
      actions={
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          Add Supplier
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search bar toolbar */}
        <Panel noPad>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-enterprise-200 bg-enterprise-50">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search suppliers, categories, cities..."
                className="w-full h-7 pl-7 pr-3 text-sm border border-enterprise-200 rounded bg-white placeholder-text-muted
                  focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              />
            </div>
          </div>

          {/* Supplier Grid/List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-enterprise-200 bg-enterprise-50 text-text-secondary font-medium">
                  <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">Supplier Name</th>
                  <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">Contact Details</th>
                  <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">Category</th>
                  <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide">Location</th>
                  <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-center">Rating</th>
                  <th className="px-4 py-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                      No suppliers found. Click &quot;Add Supplier&quot; to populate.
                    </td>
                  </tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} className="border-b border-enterprise-100 hover:bg-enterprise-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{s.name}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-xs">
                            <Mail size={12} className="text-text-muted" /> {s.email}
                          </span>
                          {s.phone && (
                            <span className="flex items-center gap-1 text-xs">
                              <Phone size={12} className="text-text-muted" /> {s.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-light text-brand text-xs font-medium">
                          <Tag size={10} /> {s.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {s.city ? (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin size={12} className="text-text-muted" /> {s.city}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-yellow-500 font-semibold text-sm">
                          {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button 
                          onClick={() => deleteSupplier(s.id)}
                          className="p-1 rounded hover:bg-danger-bg text-text-muted hover:text-danger transition-colors"
                          title="Delete supplier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Modal dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded border border-enterprise-200 shadow-md max-w-md w-full overflow-hidden">
            <div className="px-4 py-3 border-b border-enterprise-200 bg-enterprise-50 flex items-center justify-between">
              <span className="font-semibold text-text-primary">Add New Supplier</span>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-text-muted hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Supplier Name</label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded focus:outline-none focus:ring-1 focus:ring-brand" 
                  placeholder="e.g. Acme Tech Solutions"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded focus:outline-none focus:ring-1 focus:ring-brand" 
                    placeholder="e.g. contact@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded focus:outline-none focus:ring-1 focus:ring-brand" 
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option>IT & Software</option>
                    <option>Facilities</option>
                    <option>Professional Services</option>
                    <option>Raw Materials</option>
                    <option>Logistics</option>
                    <option>Marketing</option>
                    <option>HR & Training</option>
                    <option>Capital Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Location (City)</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-enterprise-200 rounded focus:outline-none focus:ring-1 focus:ring-brand" 
                    placeholder="e.g. Bangalore"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-text-secondary">Rating ({rating} Stars)</label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={rating} 
                  onChange={e => setRating(parseInt(e.target.value))}
                  className="w-full accent-brand h-4 cursor-pointer"
                />
                <div className="flex justify-between text-2xs text-text-muted px-0.5 mt-0.5">
                  <span>1 Star</span>
                  <span>5 Stars</span>
                </div>
              </div>
              <div className="pt-3 border-t border-enterprise-100 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" variant="primary">Add Supplier</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
