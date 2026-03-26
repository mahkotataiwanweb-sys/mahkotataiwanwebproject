'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, Save, X, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { GalleryImage } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FormData {
  id?: string;
  image_url: string;
  event_name: string;
  event_date: string;
  description_en: string;
  description_id: string;
  description_zh: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: FormData = {
  image_url: '',
  event_name: '',
  event_date: '',
  description_en: '',
  description_id: '',
  description_zh: '',
  sort_order: 0,
  is_active: true,
};

/* ------------------------------------------------------------------ */
/*  Admin Gallery Page                                                 */
/* ------------------------------------------------------------------ */
export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ---------- fetch ---------- */
  async function fetchImages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('event_date', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      toast.error('Failed to load gallery images');
    } else {
      setImages((data as GalleryImage[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchImages();
  }, []);

  /* ---------- file upload ---------- */
  async function handleFileUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setFormData((prev) => ({ ...prev, image_url: publicUrl }));
      setPreviewUrl(URL.createObjectURL(file));
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  /* ---------- form actions ---------- */
  function openAddForm() {
    setFormData(emptyForm);
    setPreviewUrl(null);
    setIsEditing(false);
    setShowForm(true);
  }

  function openEditForm(img: GalleryImage) {
    setFormData({
      id: img.id,
      image_url: img.image_url,
      event_name: img.event_name,
      event_date: img.event_date,
      description_en: img.description_en || '',
      description_id: img.description_id || '',
      description_zh: img.description_zh || '',
      sort_order: img.sort_order || 0,
      is_active: img.is_active,
    });
    setPreviewUrl(img.image_url);
    setIsEditing(true);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormData(emptyForm);
    setPreviewUrl(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!formData.image_url) {
      toast.error('Please upload an image');
      return;
    }
    if (!formData.event_name.trim()) {
      toast.error('Event name is required');
      return;
    }
    if (!formData.event_date) {
      toast.error('Event date is required');
      return;
    }

    setSaving(true);
    try {
      const record = {
        image_url: formData.image_url,
        event_name: formData.event_name.trim(),
        event_date: formData.event_date,
        description_en: formData.description_en.trim() || null,
        description_id: formData.description_id.trim() || null,
        description_zh: formData.description_zh.trim() || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('gallery_images')
          .update(record)
          .eq('id', formData.id);
        if (error) throw error;
        toast.success('Image updated successfully');
      } else {
        const { error } = await supabase
          .from('gallery_images')
          .insert([record]);
        if (error) throw error;
        toast.success('Image added successfully');
      }

      closeForm();
      fetchImages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  /* ---------- delete ---------- */
  async function handleDelete(img: GalleryImage) {
    try {
      // Attempt to remove from storage
      const urlParts = img.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        await supabase.storage.from('gallery').remove([fileName]);
      }

      // Remove from database
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', img.id);

      if (error) throw error;
      toast.success('Image deleted');
      setDeleteConfirm(null);
      fetchImages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  }

  /* ---------- toggle active ---------- */
  async function toggleActive(img: GalleryImage) {
    try {
      const { error } = await supabase
        .from('gallery_images')
        .update({ is_active: !img.is_active })
        .eq('id', img.id);

      if (error) throw error;
      toast.success(img.is_active ? 'Image hidden' : 'Image visible');
      fetchImages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#003048]">Gallery Management</h1>
              <p className="text-gray-500 text-sm mt-1">
                Manage gallery images and events
              </p>
            </div>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003048] text-white rounded-lg font-semibold text-sm hover:bg-[#003048]/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-[#003048]/20 border-t-[#003048] rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && images.length === 0 && !showForm && (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No gallery images yet</h3>
            <p className="text-gray-400 mb-6 text-sm">Upload your first image to get started</p>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003048] text-white rounded-lg font-semibold text-sm hover:bg-[#003048]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Image
            </button>
          </div>
        )}

        {/* ===================== ADD/EDIT FORM ===================== */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-[#003048]">
                {isEditing ? 'Edit Image' : 'Add New Image'}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Upload area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image *
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver
                      ? 'border-[#003048] bg-[#003048]/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative mx-auto w-48 h-48">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium text-sm">
                        Drag & drop an image here, or click to browse
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Supports JPG, PNG, WebP
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                      <div className="w-8 h-8 border-4 border-[#003048]/20 border-t-[#003048] rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Event Name & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.event_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, event_name: e.target.value }))
                    }
                    placeholder="e.g. Annual Gala 2026"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, event_date: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm"
                  />
                </div>
              </div>

              {/* Sort order */}
              <div className="sm:w-1/4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sort_order: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm"
                />
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-700">Descriptions</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                    English
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description_en: e.target.value }))
                    }
                    rows={2}
                    placeholder="Description in English..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                    Bahasa Indonesia
                  </label>
                  <textarea
                    value={formData.description_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description_id: e.target.value }))
                    }
                    rows={2}
                    placeholder="Deskripsi dalam Bahasa Indonesia..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                    中文
                  </label>
                  <textarea
                    value={formData.description_zh}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description_zh: e.target.value }))
                    }
                    rows={2}
                    placeholder="中文描述..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003048]/30 focus:border-[#003048] outline-none text-sm resize-none"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.is_active ? 'bg-[#003048]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      formData.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.is_active ? 'Active (Visible)' : 'Inactive (Hidden)'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003048] text-white rounded-lg font-semibold text-sm hover:bg-[#003048]/90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
                </button>
                <button
                  onClick={closeForm}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== IMAGE GRID ===================== */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={img.image_url}
                    alt={img.event_name}
                    className="w-full h-full object-cover"
                  />
                  {/* Active badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        img.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {img.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#003048] text-sm truncate">
                    {img.event_name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{img.event_date}</p>
                  {img.description_en && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {img.description_en}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditForm(img)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#003048] hover:bg-[#003048]/10 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(img)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      {img.is_active ? 'Hide' : 'Show'}
                    </button>
                    {deleteConfirm === img.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => handleDelete(img)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(img.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
