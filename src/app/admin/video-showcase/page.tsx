'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, X, Eye, EyeOff,
  ArrowUpDown, Loader2, Video, Youtube, Smartphone,
} from 'lucide-react';
import type { VideoShowcase, VideoShowcaseInsert, VideoShowcaseUpdate } from '@/types/database';

const emptyForm: VideoShowcaseInsert = {
  title_en: '',
  title_id: '',
  title_zh: '',
  description_en: '',
  description_id: '',
  description_zh: '',
  video_category: 'youtube',
  video_url: '',
  thumbnail_url: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminVideoShowcasePage() {
  const [videos, setVideos] = useState<VideoShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<VideoShowcaseInsert>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* ---------- Fetch ---------- */
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('video_showcases')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('Failed to load videos');
      console.error(error);
    } else {
      setVideos((data || []) as VideoShowcase[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  /* ---------- Open dialogs ---------- */
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (video: VideoShowcase) => {
    setEditingId(video.id);
    setForm({
      title_en: video.title_en,
      title_id: video.title_id,
      title_zh: video.title_zh,
      description_en: video.description_en || '',
      description_id: video.description_id || '',
      description_zh: video.description_zh || '',
      video_category: video.video_category,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      sort_order: video.sort_order,
      is_active: video.is_active,
    });
    setDialogOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  /* ---------- Save ---------- */
  const handleSave = async () => {
    if (!form.title_en.trim()) {
      toast.error('Title (EN) is required');
      return;
    }
    if (!form.video_url.trim()) {
      toast.error('Video URL is required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updateData: VideoShowcaseUpdate = { ...form };
        const { error } = await supabase
          .from('video_showcases')
          .update(updateData)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Video updated');
      } else {
        const { error } = await supabase
          .from('video_showcases')
          .insert(form);
        if (error) throw error;
        toast.success('Video added');
      }
      setDialogOpen(false);
      fetchVideos();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Delete ---------- */
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('video_showcases')
        .delete()
        .eq('id', deletingId);
      if (error) throw error;
      toast.success('Video deleted');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchVideos();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete video');
    }
  };

  /* ---------- Toggle active ---------- */
  const toggleActive = async (video: VideoShowcase) => {
    const { error } = await supabase
      .from('video_showcases')
      .update({ is_active: !video.is_active })
      .eq('id', video.id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(video.is_active ? 'Video deactivated' : 'Video activated');
      fetchVideos();
    }
  };

  /* ---------- File upload ---------- */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'video_url' | 'thumbnail_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'videos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((prev) => ({ ...prev, [field]: data.url }));
      toast.success('File uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Video className="w-7 h-7 text-red-500" />
            Video Showcase
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage homepage video showcases</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Video
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No videos yet. Add your first video showcase.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" /> Order
                  </span>
                </th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{video.title_en}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">{video.video_url}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      video.video_category === 'youtube'
                        ? 'bg-red-50 text-red-600'
                        : video.video_category === 'shorts'
                        ? 'bg-blue-50 text-blue-600'
                        : video.video_category === 'tiktok'
                        ? 'bg-black/10 text-black'
                        : 'bg-pink-50 text-pink-600'
                    }`}>
                      {video.video_category === 'youtube' && <Youtube className="w-3 h-3" />}
                      {(video.video_category === 'shorts' || video.video_category === 'tiktok' || video.video_category === 'reels') && <Smartphone className="w-3 h-3" />}
                      {video.video_category.charAt(0).toUpperCase() + video.video_category.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 font-mono">{video.sort_order}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(video)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        video.is_active
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {video.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {video.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(video)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDelete(video.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Video' : 'Add Video'}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN) *</label>
                  <input
                    type="text"
                    value={form.title_en}
                    onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="English title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (ID)</label>
                  <input
                    type="text"
                    value={form.title_id}
                    onChange={(e) => setForm({ ...form, title_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="Indonesian title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (ZH)</label>
                  <input
                    type="text"
                    value={form.title_zh}
                    onChange={(e) => setForm({ ...form, title_zh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="Chinese title"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN)</label>
                  <input
                    type="text"
                    value={form.description_en || ''}
                    onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="English description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (ID)</label>
                  <input
                    type="text"
                    value={form.description_id || ''}
                    onChange={(e) => setForm({ ...form, description_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="Indonesian description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (ZH)</label>
                  <input
                    type="text"
                    value={form.description_zh || ''}
                    onChange={(e) => setForm({ ...form, description_zh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                    placeholder="Chinese description"
                  />
                </div>
              </div>

              {/* Video Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video Category *</label>
                <select
                  value={form.video_category}
                  onChange={(e) => setForm({ ...form, video_category: e.target.value as 'youtube' | 'shorts' | 'tiktok' | 'reels' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="shorts">YouTube Shorts</option>
                  <option value="tiktok">TikTok</option>
                  <option value="reels">Instagram Reels</option>
                </select>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
                <input
                  type="text"
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  placeholder={
                    form.video_category === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : form.video_category === 'shorts'
                      ? 'https://www.youtube.com/shorts/...'
                      : form.video_category === 'tiktok'
                      ? 'https://www.tiktok.com/@.../video/...'
                      : 'https://www.instagram.com/reels/...'
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Paste the video URL/link from the platform</p>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail (optional)</label>
                <div className="space-y-2">
                  {form.thumbnail_url && (
                    <p className="text-sm text-gray-500 truncate">{form.thumbnail_url}</p>
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Choose Thumbnail
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'thumbnail_url')}
                      className="sr-only"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order ?? 0}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <label className="flex items-center gap-3 mt-2 cursor-pointer">
                    <div
                      onClick={() => setForm({ ...form, is_active: !form.is_active })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        form.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        form.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </div>
                    <span className="text-sm text-gray-600">{form.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Video</h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
