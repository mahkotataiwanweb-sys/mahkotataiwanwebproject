'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Menu as MenuIcon, ChevronRight, Link2, Trash } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { NavMenuItem } from '@/types/database';
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

interface FormState {
  id?: string;
  label: MultilingualValue;
  url: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  label: emptyMultilingual(),
  url: '/',
  parent_id: null,
  sort_order: 0,
  is_active: true,
});

interface RowItem {
  id: string;
  item: NavMenuItem;
  isChild: boolean;
}

export default function NavbarPage() {
  const [menus, setMenus] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('navbar_menus').select('*').order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load');
    else setMenus(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const topLevel = useMemo(() => menus.filter((m) => !m.parent_id), [menus]);
  const getChildren = useCallback((parentId: string) => menus.filter((m) => m.parent_id === parentId), [menus]);

  const grouped = useMemo<RowItem[]>(() => {
    const out: RowItem[] = [];
    topLevel.forEach((parent) => {
      out.push({ id: parent.id, item: parent, isChild: false });
      getChildren(parent.id).forEach((child) => out.push({ id: child.id, item: child, isChild: true }));
    });
    const validParents = new Set(topLevel.map((m) => m.id));
    menus.filter((m) => m.parent_id && !validParents.has(m.parent_id))
      .forEach((orphan) => out.push({ id: orphan.id, item: orphan, isChild: true }));
    return out;
  }, [menus, topLevel, getChildren]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return grouped;
    return grouped.filter((r) =>
      [r.item.label_en, r.item.label_id, r.item.label_zh, r.item.url].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [grouped, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: menus.length });
    setShowModal(true);
  };

  const openEdit = (m: NavMenuItem) => {
    setForm({
      id: m.id,
      label: fromRow(m as unknown as Record<string, unknown>, 'label'),
      url: m.url,
      parent_id: m.parent_id,
      sort_order: m.sort_order,
      is_active: m.is_active,
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
        ...toRow(form.label, 'label'),
        url: form.url,
        parent_id: form.parent_id || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('navbar_menus').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Menu updated');
      } else {
        const { error } = await supabase.from('navbar_menus').insert(payload);
        if (error) throw error;
        toast.success('Menu created');
      }
      setShowModal(false);
      fetchMenus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: NavMenuItem) => {
    const children = getChildren(m.id);
    const msg = children.length
      ? `This menu has ${children.length} sub-item(s). Delete all of them?`
      : `Delete menu "${m.label_en}"?`;
    if (!confirm(msg)) return;
    if (children.length) {
      await supabase.from('navbar_menus').delete().eq('parent_id', m.id);
    }
    const { error } = await supabase.from('navbar_menus').delete().eq('id', m.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchMenus();
    }
  };

  const toggleActive = async (m: NavMenuItem) => {
    const { error } = await supabase.from('navbar_menus').update({ is_active: !m.is_active }).eq('id', m.id);
    if (error) toast.error('Failed');
    else setMenus((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (m: NavMenuItem, dir: -1 | 1) => {
    const siblings = m.parent_id ? getChildren(m.parent_id) : topLevel;
    const idx = siblings.findIndex((s) => s.id === m.id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await swapSortOrder('navbar_menus', m, swap);
    fetchMenus();
  };

  const columns: ColumnDef<RowItem>[] = [
    {
      key: 'label',
      label: 'Label',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.isChild ? (
            <>
              <span className="ml-4 text-[var(--color-admin-faint)]"><ChevronRight className="w-3 h-3" /></span>
              <span className="text-[var(--color-admin-ink-2)] dark:text-[var(--color-admin-ink-2-dark)]">{r.item.label_en}</span>
            </>
          ) : (
            <span className="font-medium text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">{r.item.label_en}</span>
          )}
        </div>
      ),
    },
    {
      key: 'url',
      label: 'URL',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
          <Link2 className="w-3 h-3" /> {r.item.url}
        </span>
      ),
    },
    {
      key: 'translations',
      label: 'Translations',
      render: (r) => (
        <span className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
          {r.item.label_id || '—'} · {r.item.label_zh || '—'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill active={r.item.is_active} onClick={() => toggleActive(r.item)} /> },
    {
      key: 'order',
      label: 'Order',
      render: (r) => (
        <SortControl
          onUp={() => move(r.item, -1)}
          onDown={() => move(r.item, 1)}
          value={r.item.sort_order}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(r.item)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(r.item)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Navbar Menus"
        subtitle={`${menus.length} items · supports nested parent → child`}
        actions={
          <>
            <AdminButton
              variant="ghost"
              iconLeft={<Trash className="w-4 h-4" />}
              onClick={async () => {
                if (!confirm('Delete all dead navbar links (URLs containing /gallery, /news, /lifestyle, /moments, /journal)? This cannot be undone.')) return;
                try {
                  const res = await fetch('/api/admin/cleanup-nav', { method: 'POST' });
                  const data = await res.json();
                  if (data.error) throw new Error(data.error);
                  toast.success(`Removed ${data.navbar_deleted} navbar + ${data.footer_deleted} footer dead links`);
                  fetchMenus();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Cleanup failed');
                }
              }}
            >
              Cleanup Dead Links
            </AdminButton>
            <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
              Add Menu Item
            </AdminButton>
          </>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menus…" />
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(r) => r.id}
        emptyState={
          <EmptyState
            title="No menu items"
            description="Add your first navbar menu item."
            icon={<MenuIcon className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Menu Item' : 'Add Menu Item'}
        size="md"
        footer={
          <>
            <TranslateAllButton
              fields={[{ base: 'label', values: form.label, context: 'navigation menu label' }]}
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
            context="navigation menu label"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>URL</AdminLabel>
              <AdminInput
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="/products"
              />
            </div>
            <div>
              <AdminLabel>Parent menu</AdminLabel>
              <AdminSelect
                value={form.parent_id || ''}
                onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value || null }))}
              >
                <option value="">None (top level)</option>
                {topLevel
                  .filter((m) => !form.id || m.id !== form.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.label_en}</option>
                  ))}
              </AdminSelect>
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
