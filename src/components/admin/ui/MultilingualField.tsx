'use client';

import { useState, useId } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { AdminLabel } from './AdminInput';

export type Lang = 'en' | 'id' | 'zh';

export const LANG_LABELS: Record<Lang, { short: string; full: string; flag: string }> = {
  en: { short: 'EN', full: 'English', flag: 'EN' },
  id: { short: 'ID', full: 'Bahasa Indonesia', flag: 'ID' },
  zh: { short: 'ZH', full: '中文', flag: '中文' },
};

export interface MultilingualValue {
  en: string;
  id: string;
  zh: string;
}

interface Props {
  label: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  values: MultilingualValue;
  onChange: (next: MultilingualValue) => void;
  placeholder?: Partial<Record<Lang, string>>;
  /** Optional context hint for the translator (e.g. "product name", "article title"). */
  context?: string;
  /** When true, "Auto-Translate" is hidden (e.g. for fields that don't need translation). */
  noAutoTranslate?: boolean;
}

export default function MultilingualField({
  label,
  required,
  multiline,
  rows = 3,
  values,
  onChange,
  placeholder,
  context,
  noAutoTranslate,
}: Props) {
  const [active, setActive] = useState<Lang>('en');
  const [translating, setTranslating] = useState(false);
  const id = useId();

  const langs: Lang[] = ['en', 'id', 'zh'];

  async function handleTranslate(overwrite: boolean) {
    const sourceText = values[active]?.trim();
    if (!sourceText) {
      toast.error(`Fill in ${LANG_LABELS[active].full} first to use as source.`);
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          from: active,
          to: langs.filter((l) => l !== active),
          context,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const next = { ...values };
      let filled = 0;
      for (const target of langs) {
        if (target === active) continue;
        const translated = data.translations?.[target] || '';
        if (!translated) continue;
        if (!overwrite && next[target]?.trim()) continue;
        next[target] = translated;
        filled += 1;
      }
      onChange(next);
      if (filled === 0) {
        toast('All other languages already filled. Use overwrite to replace.', { icon: 'ℹ️' });
      } else {
        toast.success(`Translated into ${filled} language${filled === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <AdminLabel required={required} className="!mb-0">{label}</AdminLabel>
        <div className="flex items-center gap-1.5">
          <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] border border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
            {langs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setActive(l)}
                className={cn('admin-lang-tab', active === l && 'is-active')}
              >
                {LANG_LABELS[l].flag}
              </button>
            ))}
          </div>
          {!noAutoTranslate && (
            <button
              type="button"
              onClick={() => handleTranslate(false)}
              disabled={translating}
              title={`Translate from ${LANG_LABELS[active].full} to fill empty fields`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[var(--color-admin-accent-soft)] text-[#7A5C0A] hover:bg-[#FFE6A8] transition-colors disabled:opacity-50 dark:bg-[rgba(184,134,11,0.18)] dark:text-[#F4D58D] dark:hover:bg-[rgba(184,134,11,0.25)]"
            >
              {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Auto-Translate
            </button>
          )}
        </div>
      </div>

      {/* Active language input */}
      {multiline ? (
        <textarea
          id={id}
          value={values[active] ?? ''}
          onChange={(e) => onChange({ ...values, [active]: e.target.value })}
          rows={rows}
          placeholder={placeholder?.[active] ?? `Enter ${LANG_LABELS[active].full}…`}
          className="admin-input"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={values[active] ?? ''}
          onChange={(e) => onChange({ ...values, [active]: e.target.value })}
          placeholder={placeholder?.[active] ?? `Enter ${LANG_LABELS[active].full}…`}
          className="admin-input"
        />
      )}

      {/* Tiny preview of inactive language values */}
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {langs
          .filter((l) => l !== active)
          .map((l) => (
            <p
              key={l}
              className="text-[11px] text-[var(--color-admin-faint)] dark:text-[var(--color-admin-faint-dark)] truncate max-w-[18rem]"
              title={values[l] || ''}
            >
              <span className="font-semibold mr-1">{LANG_LABELS[l].flag}:</span>
              {values[l] || <span className="italic">empty</span>}
            </p>
          ))}
      </div>
    </div>
  );
}

export function emptyMultilingual(): MultilingualValue {
  return { en: '', id: '', zh: '' };
}

export function fromRow(row: Record<string, unknown>, base: string): MultilingualValue {
  return {
    en: (row[`${base}_en`] as string) || '',
    id: (row[`${base}_id`] as string) || '',
    zh: (row[`${base}_zh`] as string) || '',
  };
}

export function toRow<T extends string>(values: MultilingualValue, base: T): Record<`${T}_en` | `${T}_id` | `${T}_zh`, string> {
  return {
    [`${base}_en`]: values.en,
    [`${base}_id`]: values.id,
    [`${base}_zh`]: values.zh,
  } as Record<`${T}_en` | `${T}_id` | `${T}_zh`, string>;
}
