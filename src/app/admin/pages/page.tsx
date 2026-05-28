'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Save, Plus, Trash2, FileText, Globe, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminLabel,
  AdminSelect,
  AdminToggle,
  ImageUpload,
  MultilingualField,
  StatusPill,
  EmptyState,
} from '@/components/admin/ui';

interface PageContent {
  id: string;
  page: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  _dirty?: boolean;
}

const PAGES = [
  { value: 'home', label: 'Home' },
  { value: 'about', label: 'About Us' },
  { value: 'contact', label: 'Contact Us' },
  { value: 'products', label: 'Products' },
  { value: 'where-to-buy', label: 'Where to Buy' },
  { value: 'events', label: 'Events' },
  { value: 'activities', label: 'Activity' },
  { value: 'recipes', label: 'Recipes' },
];

const CONTENT_TYPES = ['text', 'textarea', 'richtext', 'number', 'image', 'link', 'email', 'phone'];

const formatLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function PagesEditorPage() {
  const [items, setItems] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activePage, setActivePage] = useState<string>('about');
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ section: '', key: '', content_type: 'text' });

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('page', activePage)
      .order('section')
      .order('sort_order');
    if (error) toast.error('Failed to load');
    else setItems(data || []);
    setLoading(false);
  }, [activePage]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const sections = useMemo(() => Array.from(new Set(items.map((i) => i.section))), [items]);
  const dirtyCount = useMemo(() => items.filter((i) => i._dirty).length, [items]);

  const updateItem = (id: string, patch: Partial<PageContent>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, _dirty: true } : it)));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const dirty = items.filter((i) => i._dirty);
      if (dirty.length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }
      const updates = dirty.map((it) => ({
        id: it.id,
        value_en: it.value_en,
        value_id: it.value_id,
        value_zh: it.value_zh,
        content_type: it.content_type,
        image_url: it.image_url,
        sort_order: it.sort_order,
        is_active: it.is_active,
      }));
      const res = await fetch('/api/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(`Saved ${dirty.length} change${dirty.length === 1 ? '' : 's'}`);
      setItems((prev) => prev.map((i) => ({ ...i, _dirty: false })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newItem.section.trim() || !newItem.key.trim()) {
      toast.error('Section and key are required');
      return;
    }
    setAddingItem(true);
    try {
      const res = await fetch('/api/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: activePage,
          section: newItem.section.trim().toLowerCase().replace(/\s+/g, '_'),
          key: newItem.key.trim().toLowerCase().replace(/\s+/g, '_'),
          content_type: newItem.content_type,
          value_en: '',
          value_id: '',
          value_zh: '',
          sort_order: items.length,
          is_active: true,
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      toast.success('Item added');
      setNewItem({ section: '', key: '', content_type: 'text' });
      setShowAddModal(false);
      fetchContent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    const res = await fetch(`/api/page-content?id=${id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchContent();
    }
  };

  const translateAllVisible = async () => {
    setTranslating(true);
    let translated = 0;
    try {
      for (const it of items) {
        const langs: ('en' | 'id' | 'zh')[] = ['en', 'id', 'zh'];
        let source: 'en' | 'id' | 'zh' | null = null;
        for (const l of langs) {
          if ((it[`value_${l}` as `value_en`] || '').trim()) {
            source = l;
            break;
          }
        }
        if (!source) continue;
        const targets = langs.filter((l) => l !== source && !(it[`value_${l}` as `value_en`] || '').trim());
        if (targets.length === 0) continue;
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: it[`value_${source}` as `value_en`],
            from: source,
            to: targets,
            context: `${it.page} ${it.section} ${it.key}`,
          }),
        });
        const data = await res.json();
        if (data.error) continue;
        const patch: Partial<PageContent> = {};
        for (const t of targets) {
          if (data.translations?.[t]) {
            (patch as Record<string, string>)[`value_${t}`] = data.translations[t];
            translated += 1;
          }
        }
        if (Object.keys(patch).length) updateItem(it.id, patch);
      }
      if (translated === 0) toast('Already filled', { icon: 'ℹ️' });
      else toast.success(`Translated ${translated} field${translated === 1 ? '' : 's'} (Save to persist)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setTranslating(false);
    }
  };

  const syncFromTranslations = async () => {
    if (
      !confirm(
        'Import all i18n translation keys into page_content?\n\n' +
        'This will add rows for every label/heading/text on the live site for ALL pages ' +
        '(home, about, contact, products, events, recipes, activity, where-to-buy, navbar, footer, etc.) ' +
        'so you can edit them from /admin/pages.\n\n' +
        'Existing rows are NOT overwritten.'
      )
    ) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/sync-page-content', { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Imported ${data.inserted} new rows (${data.alreadyExisted} already existed)`);
      fetchContent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site Content"
        subtitle="Edit konten setiap halaman website — pilih halaman, lalu edit setiap section di bawah."
        actions={
          <>
            <AdminButton variant="ghost" onClick={syncFromTranslations} disabled={syncing}>
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync from Translations
            </AdminButton>
            <AdminButton variant="ghost" onClick={translateAllVisible} disabled={translating}>
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Translate Visible
            </AdminButton>
            <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>
              Add Content
            </AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={saveAll} iconLeft={<Save className="w-4 h-4" />}>
              Save {dirtyCount > 0 ? `(${dirtyCount})` : 'All'}
            </AdminButton>
          </>
        }
      />

      {/* Page picker — clear hierarchy: pilih halaman dulu, lalu edit sections */}
      <div className="admin-surface p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--color-admin-faint)] mb-3 flex items-center gap-1.5">
          <Globe className="w-3 h-3" /> Pilih Halaman
        </p>
        <div className="flex flex-wrap gap-2">
          {PAGES.map((p) => (
            <button
              key={p.value}
              onClick={() => setActivePage(p.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activePage === p.value
                  ? 'bg-[var(--color-admin-accent)] text-yellow-300 shadow-md'
                  : 'bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] text-[var(--color-admin-ink-2)] hover:bg-[var(--color-admin-border)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="admin-skeleton h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title={`No content for "${activePage}"`}
            description="Click 'Add Content' to create a new key for this page."
            icon={<FileText className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={() => setShowAddModal(true)}>Add Content</AdminButton>}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section} className="admin-surface p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[var(--color-admin-accent)] mb-1">
                    Section
                  </p>
                  <h2 className="font-heading text-xl font-bold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">
                    {formatLabel(section)}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-[var(--color-admin-muted)]">
                  {items.filter((it) => it.section === section).length} field{items.filter((it) => it.section === section).length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-4">
                {items.filter((it) => it.section === section).map((it) => (
                  <div key={it.id} className="border border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-admin-faint)] font-semibold">
                          {it.content_type} · order {it.sort_order}
                        </p>
                        <h3 className="font-semibold capitalize text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] mt-0.5">
                          {formatLabel(it.key)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {it._dirty && <span className="admin-pill admin-pill-warn">unsaved</span>}
                        <StatusPill active={it.is_active} onClick={() => updateItem(it.id, { is_active: !it.is_active })} size="sm" />
                        <button onClick={() => handleDelete(it.id)} className="admin-btn-icon admin-btn-icon-delete" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {it.content_type === 'image' ? (
                      <ImageUpload
                        label="Image"
                        value={it.image_url}
                        onChange={(url) => updateItem(it.id, { image_url: url || null })}
                        folder={`page-content/${activePage}`}
                        variant="wide"
                      />
                    ) : (
                      <MultilingualField
                        label="Value"
                        multiline={it.content_type === 'textarea' || it.content_type === 'richtext'}
                        rows={3}
                        values={{ en: it.value_en || '', id: it.value_id || '', zh: it.value_zh || '' }}
                        onChange={(v) => updateItem(it.id, { value_en: v.en, value_id: v.id, value_zh: v.zh })}
                        context={`${activePage} ${it.section} ${it.key}`}
                      />
                    )}

                    {/* Optional image alongside text content */}
                    {it.content_type !== 'image' && (
                      <div className="mt-3">
                        <ImageUpload
                          label="Optional image"
                          value={it.image_url}
                          onChange={(url) => updateItem(it.id, { image_url: url || null })}
                          folder={`page-content/${activePage}`}
                          variant="square"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Content Item"
        description={`Add a new key to the "${activePage}" page`}
        size="sm"
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={addingItem} onClick={handleAdd}>Add Item</AdminButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <AdminLabel required>Section</AdminLabel>
            <AdminInput
              value={newItem.section}
              onChange={(e) => setNewItem((p) => ({ ...p, section: e.target.value }))}
              placeholder="e.g. hero, about, services"
            />
            <p className="text-[11px] text-[var(--color-admin-faint)] mt-1">Lowercase, snake_case</p>
          </div>
          <div>
            <AdminLabel required>Key</AdminLabel>
            <AdminInput
              value={newItem.key}
              onChange={(e) => setNewItem((p) => ({ ...p, key: e.target.value }))}
              placeholder="e.g. headline, subtitle, cta_text"
            />
          </div>
          <div>
            <AdminLabel>Content Type</AdminLabel>
            <AdminSelect
              value={newItem.content_type}
              onChange={(e) => setNewItem((p) => ({ ...p, content_type: e.target.value }))}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </AdminSelect>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
