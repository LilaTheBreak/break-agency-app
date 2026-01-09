import React, { useState, useEffect, useMemo } from 'react';
import { DashboardShell } from '../../components/DashboardShell.jsx';
import { ADMIN_NAV_LINKS } from '../adminNavLinks.js';
import { isFeatureEnabled } from '../../config/features.js';
import { ComingSoon } from '../../components/ComingSoon.jsx';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function TextButton({ children, onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-full border border-brand-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-brand-black hover:bg-brand-black/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, required, disabled }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">
        {label} {required ? <span className="text-brand-red">*</span> : null}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 px-4 py-3 text-sm text-brand-black outline-none focus:border-brand-black/30"
      />
    </label>
  );
}

function StatusPill({ isActive }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
      isActive
        ? 'border-brand-black/20 bg-brand-linen/50 text-brand-black'
        : 'border-brand-black/10 bg-brand-black/5 text-brand-black/60'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function Drawer({ open, title, subtitle, onClose, actions, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-brand-black/10 bg-brand-white p-6 shadow-[0_35px_120px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">{subtitle}</p>
            <h3 className="font-display text-2xl uppercase text-brand-black">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <TextButton onClick={onClose}>Close</TextButton>
          </div>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
      </aside>
    </div>
  );
}

export function OpportunitiesAdmin({ session }) {
  // Gate this feature - opportunities API is not yet fully wired
  if (!isFeatureEnabled('BRAND_OPPORTUNITIES_ENABLED')) {
    return (
      <DashboardShell navLinks={ADMIN_NAV_LINKS} session={session}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <ComingSoon
            feature="BRAND_OPPORTUNITIES_ENABLED"
            title="Opportunities Marketplace"
            description="Post briefs and get matched with creators based on AI-powered fit analysis"
          />
        </div>
      </DashboardShell>
    );
  }

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'active', 'inactive'
  const [formData, setFormData] = useState({
    brand: '',
    location: '',
    title: '',
    deliverables: '',
    payment: '',
    deadline: '',
    type: '',
    isActive: true
  });

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.brand?.toLowerCase().includes(q) ||
        opp.title?.toLowerCase().includes(q) ||
        opp.type?.toLowerCase().includes(q)
      );
    }

    // Filter by status
    if (filterActive === 'active') {
      filtered = filtered.filter(opp => opp.isActive);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(opp => !opp.isActive);
    }

    return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [opportunities, searchQuery, filterActive]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.brand?.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const url = editingId ? `/api/opportunities/${editingId}` : '/api/opportunities';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Opportunity ${editingId ? 'updated' : 'created'} successfully`);
        await fetchOpportunities();
        resetForm();
      } else {
        toast.error('Failed to save opportunity');
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast.error('Error saving opportunity');
    }
  };

  const handleEdit = (opportunity) => {
    setFormData({
      brand: opportunity.brand || '',
      location: opportunity.location || '',
      title: opportunity.title || '',
      deliverables: opportunity.deliverables || '',
      payment: opportunity.payment || '',
      deadline: opportunity.deadline || '',
      type: opportunity.type || '',
      isActive: opportunity.isActive !== false
    });
    setEditingId(opportunity.id);
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Opportunity deleted');
        await fetchOpportunities();
      } else {
        toast.error('Failed to delete opportunity');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error('Error deleting opportunity');
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      location: '',
      title: '',
      deliverables: '',
      payment: '',
      deadline: '',
      type: '',
      isActive: true
    });
    setEditingId(null);
    setDrawerOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      brand: '',
      location: '',
      title: '',
      deliverables: '',
      payment: '',
      deadline: '',
      type: '',
      isActive: true
    });
    setDrawerOpen(true);
  };

  return (
    <DashboardShell navLinks={ADMIN_NAV_LINKS} session={session}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-subtitle text-xs uppercase tracking-[0.35em] text-brand-red">Opportunities</p>
            <h1 className="font-display text-3xl uppercase text-brand-black">Manage opportunities</h1>
            <p className="mt-2 text-sm text-brand-black/60">Create and manage all brand opportunities and campaigns</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-brand-red px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-brand-red/90"
          >
            <Plus className="w-4 h-4" />
            Add opportunity
          </button>
        </div>

        {/* Main Content Card */}
        <div className="rounded-3xl border border-brand-black/10 bg-brand-white p-6">
          {/* Filters and Search */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 w-4 h-4 text-brand-black/40 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by brand, title, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-brand-black/10 bg-brand-linen/40 pl-10 pr-4 py-3 text-sm text-brand-black placeholder-brand-black/40 outline-none focus:border-brand-black/30"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterActive('all')}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] border transition-colors ${
                  filterActive === 'all'
                    ? 'border-brand-red bg-brand-red/10 text-brand-red'
                    : 'border-brand-black/10 text-brand-black/60 hover:border-brand-black/20'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] border transition-colors ${
                  filterActive === 'active'
                    ? 'border-brand-red bg-brand-red/10 text-brand-red'
                    : 'border-brand-black/10 text-brand-black/60 hover:border-brand-black/20'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] border transition-colors ${
                  filterActive === 'inactive'
                    ? 'border-brand-red bg-brand-red/10 text-brand-red'
                    : 'border-brand-black/10 text-brand-black/60 hover:border-brand-black/20'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Opportunities List or Empty State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-black/20 border-t-brand-black"></div>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="rounded-2xl border border-brand-black/10 bg-brand-linen/50 p-8 text-center">
              <p className="text-sm font-medium text-brand-black">No opportunities yet</p>
              <p className="mt-1 text-xs text-brand-black/60">
                {opportunities.length === 0
                  ? 'Create your first opportunity to get started'
                  : 'Try adjusting your filters or search'}
              </p>
              {opportunities.length === 0 && (
                <button
                  onClick={openCreate}
                  className="mt-4 rounded-full border border-brand-black px-4 py-2 text-xs uppercase tracking-[0.3em] hover:bg-brand-black/5"
                >
                  Add first opportunity
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOpportunities.map((opp) => (
                <article
                  key={opp.id}
                  className="group flex items-start justify-between gap-4 rounded-2xl border border-brand-black/10 bg-brand-linen/30 p-4 hover:bg-brand-linen/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-brand-black">{opp.brand}</h3>
                        <p className="text-sm text-brand-black/60">{opp.title || 'Untitled'}</p>
                      </div>
                      <StatusPill isActive={opp.isActive} />
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-brand-black/60 mt-2">
                      {opp.type && <span className="inline-flex items-center">💼 {opp.type}</span>}
                      {opp.location && <span className="inline-flex items-center">📍 {opp.location}</span>}
                      {opp.payment && <span className="inline-flex items-center">💰 {opp.payment}</span>}
                      {opp.deadline && <span className="inline-flex items-center">📅 {opp.deadline}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(opp)}
                      title="Edit"
                      className="rounded-full p-2 hover:bg-brand-black/10"
                    >
                      <Edit2 className="w-4 h-4 text-brand-black/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(opp.id)}
                      title="Delete"
                      className="rounded-full p-2 hover:bg-brand-black/10"
                    >
                      <Trash2 className="w-4 h-4 text-brand-red/60" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Drawer */}
      <Drawer
        open={drawerOpen}
        title={editingId ? 'Edit Opportunity' : 'New Opportunity'}
        subtitle={editingId ? 'Update' : 'Create'}
        onClose={resetForm}
        actions={
          <PrimaryButton onClick={handleSubmit}>
            {editingId ? 'Update' : 'Create'} opportunity
          </PrimaryButton>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <Field
              label="Brand name"
              value={formData.brand}
              onChange={(val) => setFormData({...formData, brand: val})}
              placeholder="e.g., Luxury Brand"
              required
            />
            <Field
              label="Type"
              value={formData.type}
              onChange={(val) => setFormData({...formData, type: val})}
              placeholder="e.g., Travel, Fintech"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <Field
              label="Location"
              value={formData.location}
              onChange={(val) => setFormData({...formData, location: val})}
              placeholder="e.g., London, UK"
            />
            <Field
              label="Deadline"
              value={formData.deadline}
              onChange={(val) => setFormData({...formData, deadline: val})}
              placeholder="e.g., Feb 28"
            />
          </div>

          <Field
            label="Title"
            value={formData.title}
            onChange={(val) => setFormData({...formData, title: val})}
            placeholder="Opportunity title"
          />

          <div className="grid gap-4 grid-cols-2">
            <Field
              label="Deliverables"
              value={formData.deliverables}
              onChange={(val) => setFormData({...formData, deliverables: val})}
              placeholder="e.g., 4 IG Reels • 2 Posts"
            />
            <Field
              label="Payment"
              value={formData.payment}
              onChange={(val) => setFormData({...formData, payment: val})}
              placeholder="e.g., £8K – £12K + travel"
            />
          </div>

          <TextArea
            label="Additional details"
            value={formData.deliverables}
            onChange={(val) => setFormData({...formData, deliverables: val})}
            placeholder="Campaign brief, requirements, or notes..."
            rows={3}
          />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 rounded border border-brand-black/20"
            />
            <span className="text-xs uppercase tracking-[0.35em] text-brand-black/60">Active (visible to creators)</span>
          </label>
        </form>
      </Drawer>
    </DashboardShell>
  );
}
