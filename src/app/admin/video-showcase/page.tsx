'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Play, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { VideoShowcase } from '@/types/database';
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
  emptyMultilingual,
  fromRow,
  toRow,
  type MultilingualValue,
} from '@/components/admin/ui';
import { swapSortOrder } from '@/lib/admin-helpers';

type Cat = 'youtube' | 'shorts' | 'tiktok' | 'reels';

interface FormState {
  id?: string;
  title: MultilingualValue;
  description: MultilingualValue;
  video_category: Cat;
  video_url: string;
  thumbnail_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  title: emptyMultilingual(),
  description: emptyMultilingual(),
  video_category: 'youtube',
  video_url: '',
  thumbnail_url: '',
  sort_order: 0,
  is_active: true,
});

const CATEGORY_LABELS: Record<Cat, string> = {
  youtube: 'YouTube',
  shorts: 'Shorts',
  tiktok: 'TikTok',
  reels: 'Instagram Reels',
};

const CATEGORY_PILL: Record<Cat, string> = {
  youtube: 'admin-pill-danger',
  shorts: 'admin-pill-warn',
  tiktok: 'admin-pill-neutral',
  reels: 'admin-pill-info',
};

export default function VideoShowcasePage() {
  const [items, setItems] = useState<VideoShowcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | Cat>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('video_showcases')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load');
    else setItems((data || []) as VideoShowcase[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((v) => {
      if (filterCategory !== 'all' && v.video_category !== filterCategory) return false;
      if (q && ![v.title_en, v.title_id, v.title_zh, v.video_url].some((x) => (x || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, search, filterCategory]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (v: VideoShowcase) => {
    setForm({
      id: v.id,
      title: fromRow(v as unknown as Record<string, unknown>, 'title'),
      description: fromRow(v as unknown as Record<string, unknown>, 'description'),
      video_category: v.video_category as Cat,
      video_url: v.video_url || '',
      thumbnail_url: v.thumbnail_url || '',
      sort_order: v.sort_order,
      is_active: v.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.en.trim()) {
      toast.error('English title is required');
      return;
    }
    if (!form.video_url.trim()) {
      toast.error('Video URL is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...toRow(form.title, 'title'),
        ...toRow(form.description, 'description'),
        video_category: form.video_category,
        video_url: form.video_url,
        thumbnail_url: form.thumbnail_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('video_showcases').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Video updated');
      } else {
        const { error } = await supabase.from('video_showcases').insert(payload);
        if (error) throw error;
        toast.success('Video added');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: VideoShowcase) => {
    if (!confirm(`Delete "${v.title_en}"?`)) return;
    const { error } = await supabase.from('video_showcases').delete().eq('id', v.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (v: VideoShowcase) => {
    const { error } = await supabase.from('video_showcases').update({ is_active: !v.is_active }).eq('id', v.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === v.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (v: VideoShowcase, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === v.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await swapSortOrder('video_showcases', v, swap);
    fetchItems();
  };

  const columns: ColumnDef<VideoShowcase>[] = [
    {
      key: 'title',
      label: 'Title',
      render: (v) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{v.title_en}</p>
          <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate max-w-md">{v.video_url}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Type',
      render: (v) => (
        <span className={`admin-pill ${CATEGORY_PILL[v.video_category as Cat]}`}>
          <Youtube className="w-3 h-3" />
          {CATEGORY_LABELS[v.video_category as Cat]}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (v) => <StatusPill active={v.is_active} onClick={() => toggleActive(v)} /> },
    {
      key: 'order',
      label: 'Order',
      render: (v, i) => (
        <SortControl
          onUp={() => move(v, -1)}
          onDown={() => move(v, 1)}
          disabledUp={i === 0}
          disabledDown={i === filtered.length - 1}
          value={v.sort_order}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(v)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(v)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Video Showcases"
        subtitle="YouTube · Shorts · TikTok · Instagram Reels"
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Video
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="admin-search-wrap">
          <Search className="w-4 h-4 admin-search-icon" />
          <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos…" />
        </div>
        <AdminSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as 'all' | Cat)}>
          <option value="all">All categories</option>
          <option value="youtube">YouTube</option>
          <option value="shorts">Shorts</option>
          <option value="tiktok">TikTok</option>
          <option value="reels">Reels</option>
        </AdminSelect>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title="No videos yet"
            description="Add YouTube, Shorts, TikTok or Reels showcases."
            icon={<Play className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Video</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Video' : 'Add Video'}
        size="lg"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'title', values: form.title, context: 'video title' },
                { base: 'description', values: form.description, context: 'video description' },
              ]}
              onUpdate={(u) =>
                setForm((p) => ({
                  ...p,
                  title: u.title || p.title,
                  description: u.description || p.description,
                }))
              }
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <MultilingualField
            label="Title"
            required
            values={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
            context="video title"
          />
          <MultilingualField
            label="Description"
            multiline
            rows={3}
            values={form.description}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            context="video description"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel required>Category</AdminLabel>
              <AdminSelect value={form.video_category} onChange={(e) => setForm((p) => ({ ...p, video_category: e.target.value as Cat }))}>
                <option value="youtube">YouTube</option>
                <option value="shorts">Shorts</option>
                <option value="tiktok">TikTok</option>
                <option value="reels">Instagram Reels</option>
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>Sort Order</AdminLabel>
              <AdminInput
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div>
            <AdminLabel required>Video URL</AdminLabel>
            <AdminInput
              value={form.video_url}
              onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>

          <ImageUpload
            label="Thumbnail (optional)"
            description="Auto-fetched if left empty for YouTube"
            value={form.thumbnail_url}
            onChange={(url) => setForm((p) => ({ ...p, thumbnail_url: url }))}
            folder="video-thumbnails"
            variant="wide"
          />

          <AdminToggle checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active" />
        </div>
      </AdminModal>
    </div>
  );
}
