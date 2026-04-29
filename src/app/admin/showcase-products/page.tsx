'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminTable,
  AdminToggle,
  ImageUpload,
  MultilingualField,
  TranslateAllButton,
  StatusPill,
  SortControl,
  EmptyState,
  type ColumnDef,
  type MultilingualValue,
  emptyMultilingual,
} from '@/components/admin/ui';

interface ShowcaseProduct {
  id: string;
  category: string;
  name: string;
  name_zh: string;
  name_id: string;
  description_en: string;
  description_id: string;
  description_zh: string;
  image_url: string | null;
  detail_image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

const CATEGORIES = [
  { value: 'abon-sapi', label: 'Abon Sapi' },
  { value: 'bakso-pentol', label: 'Bakso & Pentol' },
  { value: 'cita-rasa-indonesia', label: 'Cita Rasa Indonesia' },
  { value: 'nasi-rempah-instan', label: 'Nasi Rempah Instan' },
  { value: 'snack', label: 'Snack' },
];

interface FormState {
  id?: string;
  category: string;
  name: MultilingualValue;
  description: MultilingualValue;
  image_url: string;
  detail_image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  category: 'abon-sapi',
  name: emptyMultilingual(),
  description: emptyMultilingual(),
  image_url: '',
  detail_image_url: '',
  sort_order: 0,
  is_active: true,
});

export default function ShowcaseProductsAdmin() {
  const [items, setItems] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/showcase-products');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to fetch');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((p) => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (q && ![p.name, p.name_id, p.name_zh].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, search, filterCategory]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (p: ShowcaseProduct) => {
    setForm({
      id: p.id,
      category: p.category,
      name: { en: p.name || '', id: p.name_id || '', zh: p.name_zh || '' },
      description: { en: p.description_en || '', id: p.description_id || '', zh: p.description_zh || '' },
      image_url: p.image_url || '',
      detail_image_url: p.detail_image_url || '',
      sort_order: p.sort_order,
      is_active: p.is_active,
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
        category: form.category,
        name: form.name.en,
        name_id: form.name.id,
        name_zh: form.name.zh,
        description_en: form.description.en,
        description_id: form.description.id,
        description_zh: form.description.zh,
        image_url: form.image_url || null,
        detail_image_url: form.detail_image_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      const res = await fetch('/api/showcase-products', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(form.id ? 'Updated' : 'Created');
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: ShowcaseProduct) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const res = await fetch(`/api/showcase-products?id=${p.id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (p: ShowcaseProduct) => {
    await fetch('/api/showcase-products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
    });
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (p: ShowcaseProduct, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === p.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await Promise.all([
      fetch('/api/showcase-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, sort_order: swap.sort_order }),
      }),
      fetch('/api/showcase-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swap.id, sort_order: p.sort_order }),
      }),
    ]);
    fetchItems();
  };

  const columns: ColumnDef<ShowcaseProduct>[] = [
    {
      key: 'product',
      label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] flex-shrink-0">
            {p.image_url ? (
              <Image src={p.image_url} alt="" fill className="object-cover" sizes="48px" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-[var(--color-admin-faint)]" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{p.name}</p>
            <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate">{p.name_id || p.name_zh}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (p) => <span className="admin-pill admin-pill-neutral">{CATEGORIES.find((c) => c.value === p.category)?.label || p.category}</span> },
    { key: 'status', label: 'Status', render: (p) => <StatusPill active={p.is_active} onClick={() => toggleActive(p)} /> },
    {
      key: 'order',
      label: 'Order',
      render: (p, i) => (
        <SortControl
          onUp={() => move(p, -1)}
          onDown={() => move(p, 1)}
          disabledUp={i === 0}
          disabledDown={i === filtered.length - 1}
          value={p.sort_order}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(p)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(p)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Showcase Products"
        subtitle="Produk highlight untuk halaman utama (terpisah dari katalog produk utama)"
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Showcase Product
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="admin-search-wrap">
          <Search className="w-4 h-4 admin-search-icon" />
          <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
        </div>
        <AdminSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">All categories ({items.length})</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label} ({items.filter((p) => p.category === c.value).length})
            </option>
          ))}
        </AdminSelect>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title="No showcase products"
            description="Add a product to feature on the homepage carousel."
            icon={<ShoppingBag className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Showcase Product' : 'Add Showcase Product'}
        size="lg"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'name', values: form.name, context: 'product name' },
                { base: 'description', values: form.description, context: 'product description' },
              ]}
              onUpdate={(u) => setForm((p) => ({ ...p, name: u.name || p.name, description: u.description || p.description }))}
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Card Image"
              description="Transparent PNG recommended"
              value={form.image_url}
              onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
              folder="showcase-products"
            />
            <ImageUpload
              label="Detail Image"
              description="Big card / product detail"
              value={form.detail_image_url}
              onChange={(url) => setForm((p) => ({ ...p, detail_image_url: url }))}
              folder="showcase-products/detail"
            />
          </div>

          <div>
            <AdminLabel>Category</AdminLabel>
            <AdminSelect value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </AdminSelect>
          </div>

          <MultilingualField
            label="Name"
            required
            values={form.name}
            onChange={(values) => setForm((p) => ({ ...p, name: values }))}
            context="product name"
          />

          <MultilingualField
            label="Description"
            multiline
            rows={3}
            values={form.description}
            onChange={(values) => setForm((p) => ({ ...p, description: values }))}
            context="product description"
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
