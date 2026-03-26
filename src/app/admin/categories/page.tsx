'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { Category } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name_en: '', name_id: '', name_zh: '', slug: '', icon: '',
    description_en: '', description_id: '', description_zh: '',
    image_url: '', sort_order: 0, is_active: true,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) toast.error('Failed to load categories');
    else setCategories(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name_en: '', name_id: '', name_zh: '', slug: '', icon: '', description_en: '', description_id: '', description_zh: '', image_url: '', sort_order: 0, is_active: true });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name_en: cat.name_en, name_id: cat.name_id, name_zh: cat.name_zh,
      slug: cat.slug, icon: cat.icon,
      description_en: cat.description_en || '', description_id: cat.description_id || '', description_zh: cat.description_zh || '',
      image_url: cat.image_url || '', sort_order: cat.sort_order, is_active: cat.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const { error } = await supabase.from('categories').update(form as any).eq('id', editing.id);
        if (error) throw error;
        toast.success('Category updated!');
      } else {
        const { error } = await supabase.from('categories').insert(form as any);
        if (error) throw error;
        toast.success('Category created!');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will be affected.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); fetchCategories(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = `categories/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    setForm({ ...form, image_url: getStorageUrl('media', fileName) });
    toast.success('Uploaded!');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-full text-center py-8">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-400 col-span-full text-center py-8">No categories. Run setup first.</p>
        ) : categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name_en}</h3>
                  <p className="text-gray-400 text-xs">{cat.name_id} / {cat.name_zh}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-gray-500 text-xs mb-3">{cat.description_en || 'No description'}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Order: {cat.sort_order}</span>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5 text-gray-400" /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({...form, icon: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="🍡" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
                <input type="text" value={form.name_en} onChange={(e) => setForm({...form, name_en: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (ID)</label>
                <input type="text" value={form.name_id} onChange={(e) => setForm({...form, name_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (中文)</label>
                <input type="text" value={form.name_zh} onChange={(e) => setForm({...form, name_zh: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                  <Upload className="w-4 h-4" /> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} className="w-4 h-4 rounded" />
                  <span className="text-sm">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Sort</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({...form, sort_order: parseInt(e.target.value)||0})} className="w-20 px-2 py-1 rounded border border-gray-200 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
