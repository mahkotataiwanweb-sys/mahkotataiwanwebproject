'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, Store, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { StorePartner } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminToggle,
  ImageUpload,
  StatusPill,
  SortControl,
  EmptyState,
} from '@/components/admin/ui';
import { swapSortOrder } from '@/lib/admin-helpers';

interface FormState {
  id?: string;
  name: string;
  logo_url: string;
  website_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  name: '',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: true,
});

export default function StorePartnersPage() {
  const [items, setItems] = useState<StorePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_partners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load');
    else setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [items, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (p: StorePartner) => {
    setForm({
      id: p.id,
      name: p.name,
      logo_url: p.logo_url || '',
      website_url: p.website_url || '',
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        logo_url: form.logo_url || null,
        website_url: form.website_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('store_partners').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Partner updated');
      } else {
        const { error } = await supabase.from('store_partners').insert(payload);
        if (error) throw error;
        toast.success('Partner created');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: StorePartner) => {
    if (!confirm(`Delete partner "${p.name}"?`)) return;
    const { error } = await supabase.from('store_partners').delete().eq('id', p.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (p: StorePartner) => {
    const { error } = await supabase.from('store_partners').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (p: StorePartner, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === p.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await swapSortOrder('store_partners', p, swap);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Store Partners"
        subtitle={`${items.length} partners · ${items.filter((p) => p.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Partner
          </AdminButton>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title="No store partners"
            description="Add retailers and marketplaces selling Mahkota Taiwan products."
            icon={<Store className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Partner</AdminButton>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((partner, idx) => (
            <div key={partner.id} className="admin-surface overflow-hidden flex flex-col">
              <div className="relative h-32 bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] flex items-center justify-center p-4">
                {partner.logo_url ? (
                  <Image src={partner.logo_url} alt={partner.name} width={140} height={80} className="object-contain max-h-full" unoptimized />
                ) : (
                  <Store className="w-10 h-10 text-[var(--color-admin-faint)]" />
                )}
                <div className="absolute top-2 left-2"><span className="admin-pill admin-pill-neutral">#{partner.sort_order}</span></div>
                <div className="absolute top-2 right-2"><StatusPill active={partner.is_active} onClick={() => toggleActive(partner)} size="sm" /></div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] truncate">{partner.name}</h3>
                {partner.website_url && (
                  <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-admin-accent)] truncate inline-flex items-center gap-1 mt-1 hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {partner.website_url}
                  </a>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
                  <SortControl
                    onUp={() => move(partner, -1)}
                    onDown={() => move(partner, 1)}
                    disabledUp={idx === 0}
                    disabledDown={idx === filtered.length - 1}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(partner)} className="admin-btn-icon admin-btn-icon-edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(partner)} className="admin-btn-icon admin-btn-icon-delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Store Partner' : 'Add Store Partner'}
        size="md"
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <ImageUpload
            label="Logo"
            value={form.logo_url}
            onChange={(url) => setForm((p) => ({ ...p, logo_url: url }))}
            folder="store-partners"
          />
          <div>
            <AdminLabel required>Partner Name</AdminLabel>
            <AdminInput
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Indomaret, Tokopedia"
            />
          </div>
          <div>
            <AdminLabel>Website URL</AdminLabel>
            <AdminInput
              value={form.website_url}
              onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))}
              placeholder="https://…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <AdminToggle checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active" />
            <div className="flex items-center gap-2">
              <AdminLabel className="!mb-0">Sort</AdminLabel>
              <AdminInput
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
