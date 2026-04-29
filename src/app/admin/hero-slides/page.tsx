'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, ImageIcon, Play, Film, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { HeroSlide } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminToggle,
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
} from '@/components/admin/ui';
import { swapSortOrder } from '@/lib/admin-helpers';

type MediaType = 'image' | 'video' | 'gif';

interface FormState {
  id?: string;
  title: MultilingualValue;
  subtitle: MultilingualValue;
  image_url: string;
  media_type: MediaType;
  link_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  title: emptyMultilingual(),
  subtitle: emptyMultilingual(),
  image_url: '',
  media_type: 'image',
  link_url: '',
  sort_order: 0,
  is_active: true,
});

const MEDIA_TYPES: { value: MediaType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Film },
  { value: 'gif', label: 'GIF', icon: Play },
];

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return slides;
    return slides.filter((s) =>
      [s.title_en, s.title_id, s.title_zh, s.subtitle_en].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [slides, search]);

  const openAdd = () => {
    setForm({ ...emptyForm(), sort_order: slides.length });
    setShowModal(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setForm({
      id: slide.id,
      title: fromRow(slide as unknown as Record<string, unknown>, 'title'),
      subtitle: fromRow(slide as unknown as Record<string, unknown>, 'subtitle'),
      image_url: slide.image_url || '',
      media_type: (slide.media_type as MediaType) || 'image',
      link_url: slide.link_url || '',
      sort_order: slide.sort_order,
      is_active: slide.is_active,
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
        ...toRow(form.title, 'title'),
        ...toRow(form.subtitle, 'subtitle'),
        image_url: form.image_url || null,
        media_type: form.media_type,
        link_url: form.link_url || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };
      if (form.id) {
        const { error } = await supabase.from('hero_slides').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Slide updated');
      } else {
        const { error } = await supabase.from('hero_slides').insert(payload);
        if (error) throw error;
        toast.success('Slide created');
      }
      setShowModal(false);
      fetchSlides();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`Delete slide "${slide.title_en}"?`)) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', slide.id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Slide deleted');
      fetchSlides();
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    const { error } = await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
    if (error) toast.error('Failed to toggle');
    else {
      setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, is_active: !s.is_active } : s)));
    }
  };

  const move = async (slide: HeroSlide, direction: -1 | 1) => {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const swap = slides[idx + direction];
    if (!swap) return;
    await swapSortOrder('hero_slides', slide, swap);
    fetchSlides();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Hero Slides"
        subtitle={`${slides.length} slides · ${slides.filter((s) => s.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Slide
          </AdminButton>
        }
      />

      <div className="admin-search-wrap max-w-md">
        <Search className="w-4 h-4 admin-search-icon" />
        <AdminInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search slides…"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-72" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title="No hero slides"
            description="Add your first slide to power the homepage carousel."
            icon={<ImageIcon className="w-6 h-6" />}
            action={
              <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
                Add Slide
              </AdminButton>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((slide, idx) => {
            const isVideo = slide.media_type === 'video';
            return (
              <div key={slide.id} className="admin-surface overflow-hidden flex flex-col">
                <div className="relative aspect-[16/9] bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)]">
                  {slide.image_url ? (
                    isVideo ? (
                      <>
                        <video src={slide.image_url} muted preload="metadata" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/55 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <Image src={slide.image_url} alt={slide.title_en} fill className="object-cover" sizes="320px" unoptimized />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-[var(--color-admin-faint)]" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="admin-pill admin-pill-neutral !bg-black/60 !text-white">#{slide.sort_order}</span>
                    <span className={`admin-pill ${slide.media_type === 'video' ? 'admin-pill-info' : slide.media_type === 'gif' ? 'admin-pill-warn' : 'admin-pill-accent'}`}>
                      {slide.media_type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div>
                    <h3 className="font-semibold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] truncate">{slide.title_en || 'Untitled'}</h3>
                    <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] line-clamp-2">{slide.subtitle_en || '—'}</p>
                  </div>
                  {slide.link_url && (
                    <p className="text-[11px] text-[var(--color-admin-accent)] truncate">{slide.link_url}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
                    <div className="flex items-center gap-2">
                      <StatusPill active={slide.is_active} onClick={() => toggleActive(slide)} size="sm" />
                      <SortControl
                        onUp={() => move(slide, -1)}
                        onDown={() => move(slide, 1)}
                        disabledUp={idx === 0}
                        disabledDown={idx === filtered.length - 1}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(slide)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(slide)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Hero Slide' : 'Add Hero Slide'}
        description="Image, video, or GIF banner that appears on the homepage carousel."
        size="lg"
        footer={
          <>
            <TranslateAllButton
              fields={[
                { base: 'title', values: form.title, context: 'hero slide title' },
                { base: 'subtitle', values: form.subtitle, context: 'hero slide subtitle' },
              ]}
              onUpdate={(updates) =>
                setForm((prev) => ({
                  ...prev,
                  title: updates.title || prev.title,
                  subtitle: updates.subtitle || prev.subtitle,
                }))
              }
            />
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>
              {form.id ? 'Save changes' : 'Create slide'}
            </AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <AdminLabel>Media Type</AdminLabel>
            <div className="flex flex-wrap gap-2">
              {MEDIA_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setForm((p) => ({ ...p, media_type: value, image_url: '' }))}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.media_type === value
                      ? 'border-[var(--color-admin-accent)] bg-[var(--color-admin-accent-soft)] text-[#7A5C0A] dark:bg-[rgba(184,134,11,0.18)] dark:text-[#F4D58D]'
                      : 'border-[var(--color-admin-border-strong)] dark:border-[var(--color-admin-border-strong-dark)] text-[var(--color-admin-ink-2)] dark:text-[var(--color-admin-ink-2-dark)] hover:bg-[var(--color-admin-surface-2)] dark:hover:bg-[var(--color-admin-surface-2-dark)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ImageUpload
            label={form.media_type === 'video' ? 'Slide Video' : form.media_type === 'gif' ? 'Slide GIF' : 'Slide Image'}
            description={form.media_type === 'video' ? 'MP4, WebM, MOV' : form.media_type === 'gif' ? 'GIF format' : 'JPG, PNG, WebP recommended'}
            value={form.image_url}
            onChange={(url) => setForm((p) => ({ ...p, image_url: url }))}
            folder={form.media_type === 'video' ? 'hero-slides/videos' : form.media_type === 'gif' ? 'hero-slides/gifs' : 'hero-slides'}
            accept={form.media_type === 'video' ? 'video/mp4,video/webm,video/quicktime' : form.media_type === 'gif' ? 'image/gif' : 'image/*'}
            variant="wide"
          />

          <MultilingualField
            label="Title"
            required
            values={form.title}
            onChange={(values) => setForm((p) => ({ ...p, title: values }))}
            context="hero slide title"
          />

          <MultilingualField
            label="Subtitle"
            multiline
            rows={2}
            values={form.subtitle}
            onChange={(values) => setForm((p) => ({ ...p, subtitle: values }))}
            context="hero slide subtitle"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Link URL</AdminLabel>
              <AdminInput
                value={form.link_url}
                onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
                placeholder="https://…"
              />
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

          <div className="flex items-center gap-6 pt-1">
            <AdminToggle
              checked={form.is_active}
              onChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              label="Active (visible on website)"
            />
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
