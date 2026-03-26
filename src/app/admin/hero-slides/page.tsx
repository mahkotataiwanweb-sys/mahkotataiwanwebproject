'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { HeroSlide } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload, ImageIcon } from 'lucide-react';
import Image from 'next/image';

const defaultForm = {
  title_en: '', title_id: '', title_zh: '',
  subtitle_en: '', subtitle_id: '', subtitle_zh: '',
  image_url: '',
  link_url: '',
  sort_order: 0,
  is_active: true,
};

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) toast.error('Failed to load slides');
    else setSlides(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const openAddModal = () => {
    setEditingSlide(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setForm({
      title_en: slide.title_en, title_id: slide.title_id, title_zh: slide.title_zh,
      subtitle_en: slide.subtitle_en, subtitle_id: slide.subtitle_id, subtitle_zh: slide.subtitle_zh,
      image_url: slide.image_url || '',
      link_url: slide.link_url || '',
      sort_order: slide.sort_order,
      is_active: slide.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title_en.trim()) {
      toast.error('English title is required');
      return;
    }

    const payload = {
      ...form,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
    };

    try {
      if (editingSlide) {
        const { error } = await supabase.from('hero_slides').update(payload).eq('id', editingSlide.id);
        if (error) throw error;
        toast.success('Slide updated!');
      } else {
        const { error } = await supabase.from('hero_slides').insert(payload);
        if (error) throw error;
        toast.success('Slide created!');
      }
      setShowModal(false);
      fetchSlides();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save slide';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Slide deleted'); fetchSlides(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `hero-slides/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    const url = getStorageUrl('media', fileName);
    setForm({ ...form, image_url: url });
    toast.success('Image uploaded!');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-500 text-sm">{slides.length} slides total</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors">
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {/* Slides Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No hero slides yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first slide to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <div key={slide.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Image Preview */}
              <div className="relative h-40 bg-gray-100">
                {slide.image_url ? (
                  <Image src={slide.image_url} alt={slide.title_en} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {slide.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-black/50 text-white">
                    #{slide.sort_order}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{slide.title_en || 'Untitled'}</h3>
                <p className="text-gray-500 text-sm mt-1 truncate">{slide.subtitle_en || 'No subtitle'}</p>
                {slide.link_url && (
                  <p className="text-blue-500 text-xs mt-2 truncate">{slide.link_url}</p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => openEditModal(slide)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(slide.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingSlide ? 'Edit Slide' : 'Add Slide'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slide Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <Image src={form.image_url} alt="" width={120} height={60} className="rounded-lg object-cover" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <Upload className="w-4 h-4" /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Title fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input type="text" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (ID)</label>
                  <input type="text" value={form.title_id} onChange={(e) => setForm({ ...form, title_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (中文)</label>
                  <input type="text" value={form.title_zh} onChange={(e) => setForm({ ...form, title_zh: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              </div>

              {/* Subtitle fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (EN)</label>
                  <input type="text" value={form.subtitle_en} onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (ID)</label>
                  <input type="text" value={form.subtitle_id} onChange={(e) => setForm({ ...form, subtitle_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (中文)</label>
                  <input type="text" value={form.subtitle_zh} onChange={(e) => setForm({ ...form, subtitle_zh: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input type="text" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-20 px-2 py-1 rounded border border-gray-200 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
                {editingSlide ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
