'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, Images } from 'lucide-react';
import toast from 'react-hot-toast';

import type { GalleryImage } from '@/types/database';
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

interface FormState {
  id?: string;
  image_url: string;
  description: MultilingualValue;
  event_name: string;
  event_date: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  image_url: '',
  description: emptyMultilingual(),
  event_name: '',
  event_date: new Date().toISOString().split('T')[0],
  sort_order: 0,
  is_active: true,
});

export default function GalleryAdminPage() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gallery-images');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      else throw new Error(data?.error || 'Failed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((g) =>
      [g.event_name, g.description_en, g.description_id, g.description_zh].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (g: GalleryImage) => {
    setForm({
      id: g.id,
      image_url: g.image_url || '',
      description: fromRow(g as unknown as Record<string, unknown>, 'description'),
      event_name: g.event_name || '',
      event_date: g.event_date ? g.event_date.split('T')[0] : '',
      sort_order: g.sort_order,
      is_active: g.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.image_url) {
      toast.error('Please upload an image');
      return;
    }
    if (!form.event_name.trim()) {
      toast.error('Event name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        image_url: form.image_url,
        ...toRow(form.description, 'description'),
        event_name: form.event_name,
        event_date: form.event_date,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      const res = await fetch('/api/gallery-images', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(form.id ? 'Updated' : 'Created');
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: GalleryImage) => {
    if (!confirm(`Delete this gallery image from "${g.event_name}"?`)) return;
    const res = await fetch(`/api/gallery-images?id=${g.id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (g: GalleryImage) => {
    const res = await fetch('/api/gallery-images', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: g.id, is_active: !g.is_active }),
    });
    if (!res.ok) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === g.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (g: GalleryImage, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === g.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch('/api/gallery-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: g.id, sort_order: swap.sort_order }),
      }),
      fetch('/api/gallery-images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, sort_order: g.sort_order }),
      }),
    ]);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery Images"
        subtitle={`${items.length} images · ${items.filter((g) => g.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Image
          </AdminButton>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by event or description…" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="admin-skeleton aspect-square" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title="No gallery images"
            description="Upload event photos to populate the gallery."
            icon={<Images className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Image</AdminButton>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((g, idx) => (
            <div key={g.id} className="admin-surface overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)]">
                <Image src={g.image_url} alt={g.event_name} fill className="object-cover" sizes="240px" unoptimized />
                <div className="absolute top-2 left-2"><span className="admin-pill admin-pill-neutral !bg-black/60 !text-white">#{g.sort_order}</span></div>
                <div className="absolute top-2 right-2"><StatusPill active={g.is_active} onClick={() => toggleActive(g)} size="sm" /></div>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                <div>
                  <p className="font-semibold text-sm truncate">{g.event_name}</p>
                  <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">{g.event_date}</p>
                </div>
                <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] line-clamp-2">{g.description_en || '—'}</p>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
                  <SortControl
                    onUp={() => move(g, -1)}
                    onDown={() => move(g, 1)}
                    disabledUp={idx === 0}
                    disabledDown={idx === filtered.length - 1}
                  />
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(g)} className="admin-btn-icon admin-btn-icon-edit"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(g)} className="admin-btn-icon admin-btn-icon-delete"><Trash2 className="w-3.5 h-3.5" /></button>
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
        title={form.id ? 'Edit Gallery Image' : 'Add Gallery Image'}
        size="md"
        footer={
          <>
            <TranslateAllButton
              fields={[{ base: 'description', values: form.description, context: 'gallery image caption' }]}
              onUpdate={(u) => setForm((p) => ({ ...p, description: u.description || p.description }))}
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <ImageUpload
            label="Image"
            value={form.image_url}
            onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
            folder="gallery"
            variant="wide"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel required>Event Name</AdminLabel>
              <AdminInput
                value={form.event_name}
                onChange={(e) => setForm((p) => ({ ...p, event_name: e.target.value }))}
                placeholder="e.g. Mahkota Taipei Expo 2025"
              />
            </div>
            <div>
              <AdminLabel>Event Date</AdminLabel>
              <AdminInput
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
              />
            </div>
          </div>
          <MultilingualField
            label="Description / Caption"
            multiline
            rows={3}
            values={form.description}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            context="gallery image caption"
          />
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
