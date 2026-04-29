'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Search, Star, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminToggle,
  AdminTable,
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
  type ColumnDef,
} from '@/components/admin/ui';
import { swapSortOrder, slugify } from '@/lib/admin-helpers';

interface ProductWithCategory extends Product {
  category?: Category;
}

interface FormState {
  id?: string;
  name: MultilingualValue;
  description: MultilingualValue;
  category_id: string;
  slug: string;
  image_url: string;
  detail_image_url: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = (): FormState => ({
  name: emptyMultilingual(),
  description: emptyMultilingual(),
  category_id: '',
  slug: '',
  image_url: '',
  detail_image_url: '',
  is_featured: false,
  is_active: true,
  sort_order: 0,
});

export default function ProductsPage() {
  const [items, setItems] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load');
    else setItems((data as ProductWithCategory[]) || []);
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
    setCategories(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((p) => {
      if (q && ![p.name_en, p.name_id, p.name_zh, p.slug].some((v) => (v || '').toLowerCase().includes(q))) return false;
      if (filterCategory && p.category_id !== filterCategory) return false;
      if (filterStatus === 'active' && !p.is_active) return false;
      if (filterStatus === 'inactive' && p.is_active) return false;
      if (filterStatus === 'featured' && !p.is_featured) return false;
      return true;
    });
  }, [items, search, filterCategory, filterStatus]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (p: ProductWithCategory) => {
    setForm({
      id: p.id,
      name: fromRow(p as unknown as Record<string, unknown>, 'name'),
      description: fromRow(p as unknown as Record<string, unknown>, 'description'),
      category_id: p.category_id || '',
      slug: p.slug,
      image_url: p.image_url || '',
      detail_image_url: p.detail_image_url || '',
      is_featured: p.is_featured,
      is_active: p.is_active,
      sort_order: p.sort_order,
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
        category_id: form.category_id || null,
        image_url: form.image_url || null,
        detail_image_url: form.detail_image_url || null,
        is_featured: form.is_featured,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      const body = form.id ? { id: form.id, ...payload } : payload;
      const res = await fetch('/api/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(form.id ? 'Product updated' : 'Product created');
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete product "${p.name_en}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchProducts();
    }
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const toggleFeatured = async (p: Product) => {
    const { error } = await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_featured: !x.is_featured } : x)));
  };

  const move = async (p: Product, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === p.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await swapSortOrder('products', p, swap);
    fetchProducts();
  };

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      key: 'product',
      label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] flex-shrink-0">
            {p.image_url ? (
              <Image src={p.image_url} alt="" fill className="object-cover" sizes="48px" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[var(--color-admin-faint)]" /></div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] truncate">{p.name_en}</p>
            <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate">{p.name_id || p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => (
        <span className="admin-pill admin-pill-neutral">
          {p.category?.icon && <span>{p.category.icon}</span>}
          {p.category?.name_en || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StatusPill active={p.is_active} onClick={() => toggleActive(p)} />,
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (p) => (
        <button onClick={() => toggleFeatured(p)} className="admin-btn-icon" title={p.is_featured ? 'Unfeature' : 'Feature'}>
          <Star className={`w-4 h-4 ${p.is_featured ? 'text-amber-500 fill-amber-500' : 'text-[var(--color-admin-faint)]'}`} />
        </button>
      ),
    },
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
        title="Products"
        subtitle={`${items.length} products · ${items.filter((p) => p.is_active).length} active · ${items.filter((p) => p.is_featured).length} featured`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Product
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="admin-search-wrap sm:col-span-1">
          <Search className="w-4 h-4 admin-search-icon" />
          <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
        </div>
        <AdminSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name_en}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="all">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
          <option value="featured">Featured only</option>
        </AdminSelect>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title={search || filterCategory ? 'No products match your filters' : 'No products yet'}
            description={search || filterCategory ? 'Try clearing filters.' : 'Add your first product to start the catalog.'}
            icon={<Package className="w-6 h-6" />}
            action={
              !search && !filterCategory ? (
                <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
                  Add Product
                </AdminButton>
              ) : undefined
            }
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Product' : 'Add Product'}
        size="lg"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'name', values: form.name, context: 'product name' },
                { base: 'description', values: form.description, context: 'product description' },
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
              {form.id ? 'Save changes' : 'Create product'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Card Image"
              description="Small product card"
              value={form.image_url}
              onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
              folder="products"
            />
            <ImageUpload
              label="Detail Image"
              description="Large product detail / showcase card"
              value={form.detail_image_url}
              onChange={(url) => setForm((p) => ({ ...p, detail_image_url: url }))}
              folder="products/detail"
            />
          </div>

          <MultilingualField
            label="Name"
            required
            values={form.name}
            onChange={(values) =>
              setForm((p) => ({
                ...p,
                name: values,
                slug: p.id ? p.slug : slugify(values.en || ''),
              }))
            }
            context="product name"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Category</AdminLabel>
              <AdminSelect value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name_en}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>Slug</AdminLabel>
              <AdminInput
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="auto-generated"
              />
            </div>
          </div>

          <MultilingualField
            label="Description"
            multiline
            rows={4}
            values={form.description}
            onChange={(values) => setForm((p) => ({ ...p, description: values }))}
            context="product description"
          />

          <div className="flex flex-wrap items-center gap-6">
            <AdminToggle
              checked={form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              label="Active"
            />
            <AdminToggle
              checked={form.is_featured}
              onChange={(v) => setForm((p) => ({ ...p, is_featured: v }))}
              label="Featured"
            />
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
