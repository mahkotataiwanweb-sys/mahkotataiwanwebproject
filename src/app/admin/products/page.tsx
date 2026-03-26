'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, X, Upload, Star } from 'lucide-react';
import Image from 'next/image';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name_en: '', name_id: '', name_zh: '',
    description_en: '', description_id: '', description_zh: '',
    category_id: '', slug: '', is_featured: false, is_active: true, sort_order: 0,
    image_url: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load products');
    else setProducts(data || []);
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name_en: '', name_id: '', name_zh: '',
      description_en: '', description_id: '', description_zh: '',
      category_id: categories[0]?.id || '', slug: '', is_featured: false, is_active: true, sort_order: 0,
      image_url: '',
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name_en: product.name_en, name_id: product.name_id, name_zh: product.name_zh,
      description_en: product.description_en || '', description_id: product.description_id || '', description_zh: product.description_zh || '',
      category_id: product.category_id, slug: product.slug,
      is_featured: product.is_featured, is_active: product.is_active, sort_order: product.sort_order,
      image_url: product.image_url || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(form).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated!');
      } else {
        const { error } = await supabase.from('products').insert(form);
        if (error) throw error;
        toast.success('Product created!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save product';
      toast.error(message);
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
    const ext = file.name.split('.').pop();
    const fileName = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    const url = getStorageUrl('media', fileName);
    setForm({ ...form, image_url: url });
    toast.success('Image uploaded!');
  };

  const filtered = products.filter(p =>
    p.name_en.toLowerCase().includes(search.toLowerCase()) ||
    p.name_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.length} products total</p>
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
          placeholder="Search products..."
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
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
              ) : filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <Image src={product.image_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-gray-300 text-xs">IMG</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name_en}</p>
                        <p className="text-gray-400 text-xs">{product.name_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                      {(product.category as Category | undefined)?.name_en || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(product)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-block mr-1">
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-block">
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

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <Image src={form.image_url} alt="" width={60} height={60} className="rounded-lg object-cover" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <Upload className="w-4 h-4" /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
                  <input type="text" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (ID)</label>
                  <input type="text" value={form.name_id} onChange={(e) => setForm({...form, name_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (中文)</label>
                  <input type="text" value={form.name_zh} onChange={(e) => setForm({...form, name_zh: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required />
                </div>
              </div>

              {/* Category + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-gray-50" />
                </div>
              </div>

              {/* Description fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                <textarea value={form.description_en} onChange={(e) => setForm({...form, description_en: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (ID)</label>
                <textarea value={form.description_id} onChange={(e) => setForm({...form, description_id: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (中文)</label>
                <textarea value={form.description_zh} onChange={(e) => setForm({...form, description_zh: e.target.value})} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({...form, is_featured: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value) || 0})} className="w-20 px-2 py-1 rounded border border-gray-200 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
                {editingProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
