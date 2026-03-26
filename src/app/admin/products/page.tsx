'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, X, Upload, Star, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

interface ProductWithCategory extends Product {
  category?: Category;
}

interface ProductForm {
  name_en: string;
  name_id: string;
  name_zh: string;
  description_en: string;
  description_id: string;
  description_zh: string;
  category_id: string;
  slug: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  image_url: string;
}

const defaultForm: ProductForm = {
  name_en: '', name_id: '', name_zh: '',
  description_en: '', description_id: '', description_zh: '',
  category_id: '', slug: '', is_featured: false, is_active: true, sort_order: 0,
  image_url: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>({ ...defaultForm });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load products');
    else setProducts((data as ProductWithCategory[]) || []);
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

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setForm({
      name_en: product.name_en,
      name_id: product.name_id,
      name_zh: product.name_zh,
      description_en: product.description_en || '',
      description_id: product.description_id || '',
      description_zh: product.description_zh || '',
      category_id: product.category_id || '',
      slug: product.slug,
      is_featured: product.is_featured,
      is_active: product.is_active,
      sort_order: product.sort_order,
      image_url: product.image_url || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name_en.trim()) {
      toast.error('English name is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated!');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Product created!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save product';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Product deleted'); fetchProducts(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'products');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(prev => ({ ...prev, image_url: data.url }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(product.is_active ? 'Product deactivated' : 'Product activated');
      fetchProducts();
    }
  };

  const toggleFeatured = async (product: Product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !product.is_featured })
      .eq('id', product.id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(product.is_featured ? 'Removed from featured' : 'Marked as featured');
      fetchProducts();
    }
  };

  const filtered = products.filter(p =>
    p.name_en.toLowerCase().includes(search.toLowerCase()) ||
    p.name_id.toLowerCase().includes(search.toLowerCase()) ||
    p.name_zh.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (product: ProductWithCategory): string => {
    return product.category?.name_en || '—';
  };

  const getCategoryIcon = (product: ProductWithCategory): string => {
    return product.category?.icon || '';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">
            {products.length} products total · {products.filter(p => p.is_active).length} active · {products.filter(p => p.is_featured).length} featured
          </p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-navy transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Featured</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse">Loading products...</div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  {search ? 'No products match your search' : 'No products yet. Click "Add Product" to create one.'}
                </td></tr>
              ) : filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <span className="text-gray-300 text-xs">IMG</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name_en}</p>
                        <p className="text-gray-400 text-xs truncate">{product.name_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 inline-flex items-center gap-1">
                      {getCategoryIcon(product) && <span>{getCategoryIcon(product)}</span>}
                      {getCategoryName(product)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                        product.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {product.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFeatured(product)}
                      className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors"
                      title={product.is_featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star className={`w-4 h-4 ${product.is_featured ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{product.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(product)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-block mr-1" title="Edit">
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Delete">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  {form.image_url ? (
                    <div className="relative group">
                      <Image src={form.image_url} alt="" width={80} height={80} className="rounded-lg object-cover w-20 h-20" unoptimized />
                      <button
                        onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-300 text-xs">No image</span>
                    </div>
                  )}
                  <label className={`flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Name fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">English *</label>
                    <input
                      type="text"
                      value={form.name_en}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        name_en: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Indonesian</label>
                    <input
                      type="text"
                      value={form.name_id}
                      onChange={(e) => setForm(prev => ({ ...prev, name_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="Nama produk"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">中文</label>
                    <input
                      type="text"
                      value={form.name_zh}
                      onChange={(e) => setForm(prev => ({ ...prev, name_zh: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="产品名称"
                    />
                  </div>
                </div>
              </div>

              {/* Category + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                  >
                    <option value="">No category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.icon ? `${c.icon} ` : ''}{c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-gray-50"
                    placeholder="auto-generated-from-name"
                  />
                </div>
              </div>

              {/* Description fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">English</label>
                    <textarea
                      value={form.description_en}
                      onChange={(e) => setForm(prev => ({ ...prev, description_en: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="Product description in English"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Indonesian</label>
                    <textarea
                      value={form.description_id}
                      onChange={(e) => setForm(prev => ({ ...prev, description_id: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="Deskripsi produk dalam Bahasa Indonesia"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">中文</label>
                    <textarea
                      value={form.description_zh}
                      onChange={(e) => setForm(prev => ({ ...prev, description_zh: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="中文产品描述"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
