'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminToggle,
  ImageUpload,
  MultilingualField,
  TranslateAllButton,
  StatusPill,
  SortControl,
  EmptyState,
  emptyMultilingual,
  fromRow,
  toRow,
  type MultilingualValue,
} from '@/components/admin/ui';
import { swapSortOrder, slugify } from '@/lib/admin-helpers';

interface FormState {
  id?: string;
  name: MultilingualValue;
  description: MultilingualValue;
  slug: string;
  icon: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  name: emptyMultilingual(),
  description: emptyMultilingual(),
  slug: '',
  icon: '',
  image_url: '',
  sort_order: 0,
  is_active: true,
});

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) toast.error('Failed to load');
    else setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((c) =>
      [c.name_en, c.name_id, c.name_zh, c.slug].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setForm({
      id: cat.id,
      name: fromRow(cat as unknown as Record<string, unknown>, 'name'),
      description: fromRow(cat as unknown as Record<string, unknown>, 'description'),
      slug: cat.slug,
      icon: cat.icon || '',
      image_url: cat.image_url || '',
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.en.trim()) {
      toast.error('English name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...toRow(form.name, 'name'),
        ...toRow(form.description, 'description'),
        slug: form.slug || slugify(form.name.en),
        icon: form.icon,
        image_url: form.image_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        toast.success('Category created');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name_en}"?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetch();
    }
  };

  const toggleActive = async (cat: Category) => {
    const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (error) toast.error('Failed');
    else setItems((p) => p.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c)));
  };

  const move = async (cat: Category, dir: -1 | 1) => {
    const idx = items.findIndex((c) => c.id === cat.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await swapSortOrder('categories', cat, swap);
    fetch();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        subtitle={`${items.length} categories · ${items.filter((c) => c.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Category
          </AdminButton>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-44" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title="No categories"
            description="Categories let you group products on the website."
            icon={<FolderOpen className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Category</AdminButton>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, idx) => (
            <div key={cat.id} className="admin-surface p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[var(--color-admin-accent-soft)] dark:bg-[rgba(184,134,11,0.18)] text-2xl flex items-center justify-center">
                    {cat.icon || '📦'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] truncate">{cat.name_en}</h3>
                    <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate">{cat.name_id} · {cat.name_zh}</p>
                  </div>
                </div>
                <StatusPill active={cat.is_active} onClick={() => toggleActive(cat)} size="sm" />
              </div>
              <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] line-clamp-2 mb-3">{cat.description_en || 'No description'}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
                <SortControl
                  onUp={() => move(cat, -1)}
                  onDown={() => move(cat, 1)}
                  disabledUp={idx === 0}
                  disabledDown={idx === filtered.length - 1}
                  value={cat.sort_order}
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(cat)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Category' : 'Add Category'}
        size="md"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'name', values: form.name, context: 'product category name' },
                { base: 'description', values: form.description, context: 'product category description' },
              ]}
              onUpdate={(u) =>
                setForm((p) => ({
                  ...p,
                  name: u.name || p.name,
                  description: u.description || p.description,
                }))
              }
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>
              {form.id ? 'Save changes' : 'Create category'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Icon (emoji)</AdminLabel>
              <AdminInput value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="🍡" />
            </div>
            <div>
              <AdminLabel>Slug</AdminLabel>
              <AdminInput
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="auto-from-name"
              />
            </div>
          </div>

          <MultilingualField
            label="Name"
            required
            values={form.name}
            onChange={(values) =>
              setForm((p) => ({
                ...p,
                name: values,
                slug: p.slug || slugify(values.en || ''),
              }))
            }
            context="product category name"
          />

          <MultilingualField
            label="Description"
            multiline
            rows={3}
            values={form.description}
            onChange={(values) => setForm((p) => ({ ...p, description: values }))}
            context="product category description"
          />

          <ImageUpload
            label="Image"
            value={form.image_url}
            onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
            folder="categories"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <AdminLabel>Sort Order</AdminLabel>
              <AdminInput
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <AdminToggle
                checked={form.is_active}
                onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                label="Active"
              />
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
