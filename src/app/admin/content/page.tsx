'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Save, FileText, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { SiteContent } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  EmptyState,
  MultilingualField,
} from '@/components/admin/ui';

interface ContentDraft extends SiteContent {
  _dirty?: boolean;
}

export default function ContentPage() {
  const [items, setItems] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_content').select('*').order('section').order('key');
    if (error) toast.error('Failed to load');
    else setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const sections = useMemo(() => Array.from(new Set(items.map((c) => c.section))), [items]);

  const visible = useMemo(() => {
    if (activeSection === 'all') return items;
    return items.filter((c) => c.section === activeSection);
  }, [items, activeSection]);

  const dirtyCount = useMemo(() => items.filter((i) => i._dirty).length, [items]);

  const saveAll = async () => {
    setSaving(true);
    try {
      const dirty = items.filter((i) => i._dirty);
      if (dirty.length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        return;
      }
      for (const it of dirty) {
        await supabase
          .from('site_content')
          .update({
            value_en: it.value_en,
            value_id: it.value_id,
            value_zh: it.value_zh,
          })
          .eq('id', it.id);
      }
      toast.success(`Saved ${dirty.length} item${dirty.length === 1 ? '' : 's'}`);
      setItems((prev) => prev.map((i) => ({ ...i, _dirty: false })));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const translateAllVisible = async () => {
    setTranslating(true);
    let translated = 0;
    try {
      for (const it of visible) {
        const langs: ('en' | 'id' | 'zh')[] = ['en', 'id', 'zh'];
        let source: 'en' | 'id' | 'zh' | null = null;
        for (const l of langs) {
          if ((it[`value_${l}`] || '').trim()) {
            source = l;
            break;
          }
        }
        if (!source) continue;
        const targets = langs.filter((l) => l !== source && !(it[`value_${l}`] || '').trim());
        if (targets.length === 0) continue;
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: it[`value_${source}`], from: source, to: targets, context: `${it.section} ${it.key}` }),
        });
        const data = await res.json();
        if (data.error) continue;
        const next: Partial<ContentDraft> = {};
        for (const t of targets) {
          if (data.translations?.[t]) {
            next[`value_${t}` as keyof SiteContent] = data.translations[t] as never;
            translated += 1;
          }
        }
        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, ...next, _dirty: true } : p)));
      }
      if (translated === 0) {
        toast('All visible fields are already filled', { icon: 'ℹ️' });
      } else {
        toast.success(`Translated ${translated} field${translated === 1 ? '' : 's'} (don't forget to save)`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site Content"
        subtitle="Edit semua key-value konten website (homepage, sections, dll.)"
        actions={
          <>
            <AdminButton variant="ghost" onClick={translateAllVisible} disabled={translating}>
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Translate Visible
            </AdminButton>
            <AdminButton variant="primary" onClick={saveAll} loading={saving} iconLeft={<Save className="w-4 h-4" />}>
              Save {dirtyCount > 0 ? `(${dirtyCount})` : 'All'}
            </AdminButton>
          </>
        }
      />

      {/* Section tabs */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-2 admin-surface p-2">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              activeSection === 'all'
                ? 'bg-[var(--color-admin-ink)] text-white dark:bg-[var(--color-admin-accent)] dark:text-[#1A1308]'
                : 'text-[var(--color-admin-muted)] hover:bg-[var(--color-admin-surface-2)] dark:hover:bg-[var(--color-admin-surface-2-dark)]'
            }`}
          >
            All ({items.length})
          </button>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                activeSection === s
                  ? 'bg-[var(--color-admin-ink)] text-white dark:bg-[var(--color-admin-accent)] dark:text-[#1A1308]'
                  : 'text-[var(--color-admin-muted)] hover:bg-[var(--color-admin-surface-2)] dark:hover:bg-[var(--color-admin-surface-2-dark)]'
              }`}
            >
              {s} ({items.filter((i) => i.section === s).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-skeleton h-28" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="admin-surface">
          <EmptyState
            title="No content yet"
            description="Run /api/setup to seed initial site content."
            icon={<FileText className="w-6 h-6" />}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((it) => (
            <div key={it.id} className="admin-surface p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-admin-faint)] dark:text-[var(--color-admin-faint-dark)] font-semibold">
                    {it.section} · {it.content_type}
                  </p>
                  <h3 className="font-semibold capitalize text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] mt-0.5">
                    {it.key.replace(/_/g, ' ')}
                  </h3>
                </div>
                {it._dirty && <span className="admin-pill admin-pill-warn">unsaved</span>}
              </div>
              <MultilingualField
                label="Value"
                multiline={it.content_type === 'textarea' || it.content_type === 'richtext'}
                rows={3}
                values={{
                  en: it.value_en || '',
                  id: it.value_id || '',
                  zh: it.value_zh || '',
                }}
                onChange={(v) => {
                  setItems((prev) =>
                    prev.map((p) =>
                      p.id === it.id
                        ? { ...p, value_en: v.en, value_id: v.id, value_zh: v.zh, _dirty: true }
                        : p
                    )
                  );
                }}
                context={`${it.section} ${it.key}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

