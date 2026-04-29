'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, Search, Images,
  ChevronUp, ChevronDown, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { Article } from '@/types/database';
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
import { swapSortOrder, slugify, formatDateTime } from '@/lib/admin-helpers';

export type ArticleType = 'event' | 'news' | 'lifestyle' | 'recipe';

const SLIDER_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Slider 1', value: 'slider_1' },
  { label: 'Slider 2', value: 'slider_2' },
  { label: 'Slider 3', value: 'slider_3' },
  { label: 'Slider 4', value: 'slider_4' },
];

interface FormState {
  id?: string;
  type: ArticleType;
  slug: string;
  title: MultilingualValue;
  excerpt: MultilingualValue;
  description: MultilingualValue;
  content: MultilingualValue;
  image_url: string;
  slider_section: string;
  gallery_images: string[];
  published_at: string;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = (lockedType: ArticleType): FormState => ({
  type: lockedType,
  slug: '',
  title: emptyMultilingual(),
  excerpt: emptyMultilingual(),
  description: emptyMultilingual(),
  content: emptyMultilingual(),
  image_url: '',
  slider_section: '',
  gallery_images: [],
  published_at: new Date().toISOString().split('T')[0],
  is_active: true,
  sort_order: 0,
});

interface Props {
  /** Database type to filter on (e.g. 'event', 'lifestyle'). */
  lockedType: ArticleType;
  /** Display title (e.g. "Events", "Activity"). May differ from DB type. */
  pageTitle: string;
  /** Singular label used in buttons / form copy ("Event", "Activity"). */
  singular: string;
  /** Optional subtitle for the page header. */
  subtitle?: string;
  /** Optional context string for translate API ("event article", "recipe article"). */
  translateContext?: string;
  /** Icon component for the empty state. */
  icon?: React.ComponentType<{ className?: string }>;
}

export default function ArticlesAdminView({
  lockedType,
  pageTitle,
  singular,
  subtitle,
  translateContext,
  icon: EmptyIcon,
}: Props) {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(lockedType));

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('type', lockedType)
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load');
    else setItems(data || []);
    setLoading(false);
  }, [lockedType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((a) =>
      [a.title_en, a.title_id, a.title_zh, a.slug].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [items, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(lockedType), sort_order: items.length });
    setShowModal(true);
  };

  const openEdit = (a: Article) => {
    setForm({
      id: a.id,
      type: a.type,
      slug: a.slug,
      title: fromRow(a as unknown as Record<string, unknown>, 'title'),
      excerpt: fromRow(a as unknown as Record<string, unknown>, 'excerpt'),
      description: fromRow(a as unknown as Record<string, unknown>, 'description'),
      content: fromRow(a as unknown as Record<string, unknown>, 'content'),
      image_url: a.image_url || '',
      slider_section: a.slider_section || '',
      gallery_images: a.gallery_images || [],
      published_at: a.published_at ? a.published_at.split('T')[0] : '',
      is_active: a.is_active,
      sort_order: a.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.en.trim()) {
      toast.error('English title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: lockedType,
        slug: form.slug || slugify(form.title.en),
        ...toRow(form.title, 'title'),
        ...toRow(form.excerpt, 'excerpt'),
        ...toRow(form.description, 'description'),
        ...toRow(form.content, 'content'),
        image_url: form.image_url || null,
        slider_section: form.slider_section || null,
        gallery_images: form.gallery_images,
        published_at: form.published_at,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };
      const res = await fetch('/api/articles', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(form.id ? `${singular} updated` : `${singular} created`);
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: Article) => {
    if (!confirm(`Delete ${singular.toLowerCase()} "${a.title_en}"?`)) return;
    const res = await fetch(`/api/articles?id=${a.id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (a: Article) => {
    const { error } = await supabase.from('articles').update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === a.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const move = async (a: Article, dir: -1 | 1) => {
    const idx = items.findIndex((x) => x.id === a.id);
    const swap = items[idx + dir];
    if (!swap) return;
    await swapSortOrder('articles', a, swap);
    fetchItems();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', `articles/${lockedType}/gallery`);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      }
      setForm((p) => ({ ...p, gallery_images: [...p.gallery_images, ...urls] }));
      toast.success(`Uploaded ${urls.length} image${urls.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const moveGalleryImage = (idx: number, dir: -1 | 1) => {
    setForm((p) => {
      const arr = [...p.gallery_images];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return p;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return { ...p, gallery_images: arr };
    });
  };

  const removeGalleryImage = (idx: number) => {
    setForm((p) => ({ ...p, gallery_images: p.gallery_images.filter((_, i) => i !== idx) }));
  };

  const columns: ColumnDef<Article>[] = [
    {
      key: 'article',
      label: singular,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] flex-shrink-0">
            {a.image_url ? (
              <Image src={a.image_url} alt="" fill className="object-cover" sizes="56px" unoptimized />
            ) : EmptyIcon ? (
              <div className="w-full h-full flex items-center justify-center"><EmptyIcon className="w-3.5 h-3.5 text-[var(--color-admin-faint)]" /></div>
            ) : null}
          </div>
          <div className="min-w-0 max-w-md">
            <p className="font-medium truncate">{a.title_en}</p>
            <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate">{a.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'published',
      label: 'Published',
      render: (a) => <span className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">{formatDateTime(a.published_at)}</span>,
    },
    { key: 'status', label: 'Status', render: (a) => <StatusPill active={a.is_active} onClick={() => toggleActive(a)} /> },
    {
      key: 'order',
      label: 'Order',
      render: (a, i) => (
        <SortControl
          onUp={() => move(a, -1)}
          onDown={() => move(a, 1)}
          disabledUp={i === 0}
          disabledDown={i === filtered.length - 1}
          value={a.sort_order}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(a)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(a)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  const ctx = translateContext || `${singular.toLowerCase()} article`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pageTitle}
        subtitle={subtitle ?? `${items.length} ${pageTitle.toLowerCase()} · ${items.filter((a) => a.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add {singular}
          </AdminButton>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${pageTitle.toLowerCase()}…`} />
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title={`No ${pageTitle.toLowerCase()}`}
            description={`Add your first ${singular.toLowerCase()} to populate this section.`}
            icon={EmptyIcon ? <EmptyIcon className="w-6 h-6" /> : undefined}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add {singular}</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? `Edit ${singular}` : `Add ${singular}`}
        size="xl"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'title', values: form.title, context: `${ctx} title` },
                { base: 'excerpt', values: form.excerpt, context: `${ctx} excerpt` },
                { base: 'description', values: form.description, context: `${ctx} description` },
                { base: 'content', values: form.content, context: `${ctx} body content` },
              ]}
              onUpdate={(u) =>
                setForm((p) => ({
                  ...p,
                  title: u.title || p.title,
                  excerpt: u.excerpt || p.excerpt,
                  description: u.description || p.description,
                  content: u.content || p.content,
                }))
              }
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : `Create ${singular.toLowerCase()}`}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <ImageUpload
            label="Cover Image"
            value={form.image_url}
            onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
            folder={`articles/${lockedType}`}
            variant="wide"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Slider Section</AdminLabel>
              <AdminSelect value={form.slider_section} onChange={(e) => setForm((p) => ({ ...p, slider_section: e.target.value }))}>
                {SLIDER_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <AdminLabel>Published Date</AdminLabel>
              <AdminInput
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
              />
            </div>
          </div>

          <MultilingualField
            label="Title"
            required
            values={form.title}
            onChange={(v) =>
              setForm((p) => ({
                ...p,
                title: v,
                slug: p.id ? p.slug : slugify(v.en || ''),
              }))
            }
            context={`${ctx} title`}
          />

          <div>
            <AdminLabel>Slug</AdminLabel>
            <AdminInput value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" />
          </div>

          <MultilingualField
            label="Excerpt"
            multiline
            rows={2}
            values={form.excerpt}
            onChange={(v) => setForm((p) => ({ ...p, excerpt: v }))}
            context={`${ctx} excerpt`}
          />
          <MultilingualField
            label="Short Description"
            multiline
            rows={2}
            values={form.description}
            onChange={(v) => setForm((p) => ({ ...p, description: v }))}
            context={`${ctx} short description`}
          />
          <MultilingualField
            label="Body Content"
            multiline
            rows={8}
            values={form.content}
            onChange={(v) => setForm((p) => ({ ...p, content: v }))}
            context={`${ctx} body`}
          />

          {/* Gallery Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <AdminLabel className="!mb-0">Gallery Images</AdminLabel>
              <label className="admin-btn admin-btn-ghost cursor-pointer">
                <Images className="w-4 h-4" />
                {uploadingGallery ? 'Uploading…' : 'Add to gallery'}
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
              </label>
            </div>
            {form.gallery_images.length === 0 ? (
              <div className="admin-dropzone">
                <Images className="w-5 h-5 mb-1.5" />
                No gallery images yet
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.gallery_images.map((url, i) => (
                  <div key={`${url}-${i}`} className="relative group rounded-xl overflow-hidden border border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)] aspect-square">
                    <Image src={url} alt="" fill className="object-cover" sizes="160px" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button type="button" onClick={() => moveGalleryImage(i, -1)} disabled={i === 0} className="w-7 h-7 rounded bg-white/90 text-gray-800 disabled:opacity-30 flex items-center justify-center"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => moveGalleryImage(i, 1)} disabled={i === form.gallery_images.length - 1} className="w-7 h-7 rounded bg-white/90 text-gray-800 disabled:opacity-30 flex items-center justify-center"><ChevronDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => removeGalleryImage(i)} className="w-7 h-7 rounded bg-red-500 text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
