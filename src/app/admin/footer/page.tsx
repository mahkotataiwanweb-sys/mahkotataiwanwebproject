'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { FooterLink } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTable,
  AdminToggle,
  MultilingualField,
  TranslateAllButton,
  StatusPill,
  SortControl,
  EmptyState,
  type ColumnDef,
  emptyMultilingual,
  fromRow,
  toRow,
  type MultilingualValue,
} from '@/components/admin/ui';
import { swapSortOrder } from '@/lib/admin-helpers';

const SECTIONS = ['products', 'moments', 'company'] as const;

interface FormState {
  id?: string;
  section: string;
  label: MultilingualValue;
  url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  section: 'products',
  label: emptyMultilingual(),
  url: '/',
  sort_order: 0,
  is_active: true,
});

export default function FooterPage() {
  const [items, setItems] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .order('section')
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
    return items.filter((l) => {
      if (activeTab !== 'all' && l.section !== activeTab) return false;
      if (q && ![l.label_en, l.label_id, l.label_zh, l.url].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, activeTab, search]);

  const openAdd = () => {
    setForm({
      ...emptyForm(),
      section: activeTab !== 'all' ? activeTab : 'products',
      sort_order: items.filter((l) => l.section === (activeTab !== 'all' ? activeTab : 'products')).length,
    });
    setShowModal(true);
  };

  const openEdit = (l: FooterLink) => {
    setForm({
      id: l.id,
      section: l.section,
      label: fromRow(l as unknown as Record<string, unknown>, 'label'),
      url: l.url,
      sort_order: l.sort_order,
      is_active: l.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label.en.trim()) {
      toast.error('English label is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section: form.section,
        ...toRow(form.label, 'label'),
        url: form.url,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('footer_links').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Link updated');
      } else {
        const { error } = await supabase.from('footer_links').insert(payload);
        if (error) throw error;
        toast.success('Link created');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l: FooterLink) => {
    if (!confirm(`Delete link "${l.label_en}"?`)) return;
    const { error } = await supabase.from('footer_links').delete().eq('id', l.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (l: FooterLink) => {
    const { error } = await supabase.from('footer_links').update({ is_active: !l.is_active }).eq('id', l.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (l: FooterLink, dir: -1 | 1) => {
    const siblings = items.filter((x) => x.section === l.section);
    const idx = siblings.findIndex((s) => s.id === l.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await swapSortOrder('footer_links', l, swap);
    fetchItems();
  };

  const columns: ColumnDef<FooterLink>[] = [
    { key: 'label', label: 'Label', render: (l) => <span className="font-medium">{l.label_en}</span> },
    { key: 'section', label: 'Section', render: (l) => <span className="admin-pill admin-pill-neutral capitalize">{l.section}</span> },
    {
      key: 'url',
      label: 'URL',
      render: (l) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
          <Link2 className="w-3 h-3" /> {l.url}
        </span>
      ),
    },
    { key: 'translations', label: 'ID · ZH', render: (l) => <span className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">{l.label_id || '—'} · {l.label_zh || '—'}</span> },
    { key: 'status', label: 'Status', render: (l) => <StatusPill active={l.is_active} onClick={() => toggleActive(l)} /> },
    { key: 'order', label: 'Order', render: (l) => <SortControl onUp={() => move(l, -1)} onDown={() => move(l, 1)} value={l.sort_order} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (l) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(l)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(l)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Footer Links"
        subtitle="Link footer per section (Products · Moments · Company)"
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Footer Link
          </AdminButton>
        }
      />

      <div className="flex flex-wrap gap-2 admin-surface p-2">
        {(['all', ...SECTIONS] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveTab(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              activeTab === s
                ? 'bg-[var(--color-admin-ink)] text-white dark:bg-[var(--color-admin-accent)] dark:text-[#1A1308]'
                : 'text-[var(--color-admin-muted)] hover:bg-[var(--color-admin-surface-2)] dark:hover:bg-[var(--color-admin-surface-2-dark)]'
            }`}
          >
            {s} {s !== 'all' && `(${items.filter((l) => l.section === s).length})`}
          </button>
        ))}
      </div>

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title="No footer links"
            description="Add links to populate the website footer."
            icon={<Link2 className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Link</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Footer Link' : 'Add Footer Link'}
        size="md"
        footer={
          <>
            <TranslateAllButton
              fields={[{ base: 'label', values: form.label, context: 'footer link label' }]}
              onUpdate={(u) => setForm((p) => ({ ...p, label: u.label || p.label }))}
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <MultilingualField
            label="Label"
            required
            values={form.label}
            onChange={(v) => setForm((p) => ({ ...p, label: v }))}
            context="footer link label"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Section</AdminLabel>
              <AdminSelect value={form.section} onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>URL</AdminLabel>
              <AdminInput
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="/about"
              />
            </div>
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
