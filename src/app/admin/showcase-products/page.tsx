'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Plus, X, Save, GripVertical } from 'lucide-react';

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

const EMPTY_PRODUCT: Omit<ShowcaseProduct, 'id'> = {
  category: 'abon-sapi',
  name: '',
  name_zh: '',
  name_id: '',
  description_en: '',
  description_id: '',
  description_zh: '',
  image_url: null,
  detail_image_url: null,
  sort_order: 0,
  is_active: true,
};

export default function ShowcaseProductsAdmin() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShowcaseProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadingDetail, setUploadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/showcase-products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    try {
      if (isNew) {
        const { ...body } = editing;
        const res = await fetch('/api/showcase-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create');
      } else {
        const res = await fetch('/api/showcase-products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editing),
        });
        if (!res.ok) throw new Error('Failed to update');
      }

      setEditing(null);
      setIsNew(false);
      fetchProducts();
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/showcase-products?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete product');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'showcase-products');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setEditing({ ...editing, image_url: data.url });
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };


  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingDetail(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'showcase-products/detail');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setEditing({ ...editing, detail_image_url: data.url });
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload detail image');
    } finally {
      setUploadingDetail(false);
    }
  };

  const handleToggleActive = async (product: ShowcaseProduct) => {
    try {
      await fetch('/api/showcase-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active }),
      });
      fetchProducts();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const filtered = filterCategory === 'all' ? products : products.filter((p) => p.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog Showcase</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage products displayed in the homepage product catalog section
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(EMPTY_PRODUCT as ShowcaseProduct);
            setIsNew(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filterCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({products.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterCategory === cat.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                !product.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-3xl">🍽️</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {CATEGORIES.find((c) => c.value === product.category)?.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {product.description_en || 'No description'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setEditing(product);
                      setIsNew(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      product.is_active ? 'hover:bg-green-50' : 'hover:bg-gray-100'
                    }`}
                    title={product.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        product.is_active
                          ? 'bg-green-500 border-green-500'
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {isNew ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {editing.image_url ? (
                      <Image
                        src={editing.image_url}
                        alt="Preview"
                        width={96}
                        height={96}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl">📷</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1">PNG with transparent background recommended</p>
                  </div>
                </div>
              </div>


              {/* Detail Image (Big Card) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detail Image <span className="text-xs text-gray-400 font-normal">(Big Card)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Shown in the large product detail card only. Does NOT affect the small card image.</p>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg bg-[#0c1929] flex items-center justify-center overflow-hidden">
                    {editing.detail_image_url ? (
                      <Image
                        src={editing.detail_image_url}
                        alt="Detail Preview"
                        width={96}
                        height={96}
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xs text-gray-500 text-center leading-tight">No detail<br/>image</span>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDetailImageUpload}
                      />
                      {uploadingDetail ? 'Uploading...' : 'Upload Detail Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-1">Professional product photo recommended</p>
                    {editing.detail_image_url && (
                      <button
                        onClick={() => setEditing({ ...editing, detail_image_url: null })}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        Remove detail image
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English)
                  </label>
                  <input
                    type="text"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (中文)
                  </label>
                  <input
                    type="text"
                    value={editing.name_zh}
                    onChange={(e) => setEditing({ ...editing, name_zh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="產品名稱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Indonesia)
                  </label>
                  <input
                    type="text"
                    value={editing.name_id}
                    onChange={(e) => setEditing({ ...editing, name_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    placeholder="Nama produk"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={editing.description_en}
                    onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Short product description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (中文)
                  </label>
                  <textarea
                    value={editing.description_zh}
                    onChange={(e) => setEditing({ ...editing, description_zh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="產品描述"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Indonesia)
                  </label>
                  <textarea
                    value={editing.description_id}
                    onChange={(e) => setEditing({ ...editing, description_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Deskripsi produk"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) =>
                    setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="w-24 px-3 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => {
                  setEditing(null);
                  setIsNew(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editing.name || saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
