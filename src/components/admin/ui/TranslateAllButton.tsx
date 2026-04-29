'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Lang, MultilingualValue } from './MultilingualField';

interface FieldSpec {
  base: string;
  values: MultilingualValue;
  context?: string;
}

interface Props {
  /** All multilingual fields in the form, keyed by `base` (e.g. 'name', 'description'). */
  fields: FieldSpec[];
  onUpdate: (next: Record<string, MultilingualValue>) => void;
  /** Source language to translate from. Defaults to whichever has content. */
  preferSource?: Lang;
}

export default function TranslateAllButton({ fields, onUpdate, preferSource = 'en' }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const langs: Lang[] = ['en', 'id', 'zh'];
    const updates: Record<string, MultilingualValue> = {};
    let totalFilled = 0;

    setBusy(true);
    try {
      for (const f of fields) {
        // pick the source: prefer `preferSource` if filled; else first non-empty
        let source: Lang | null = null;
        if (f.values[preferSource]?.trim()) source = preferSource;
        else {
          for (const l of langs) {
            if (f.values[l]?.trim()) {
              source = l;
              break;
            }
          }
        }
        if (!source) continue;

        const targets = langs.filter((l) => l !== source && !f.values[l]?.trim());
        if (targets.length === 0) continue;

        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: f.values[source],
            from: source,
            to: targets,
            context: f.context,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const next = { ...f.values };
        for (const t of targets) {
          const tx = data.translations?.[t];
          if (tx) {
            next[t] = tx;
            totalFilled += 1;
          }
        }
        updates[f.base] = next;
      }

      if (totalFilled === 0) {
        toast('All multilingual fields already filled.', { icon: 'ℹ️' });
      } else {
        onUpdate(updates);
        toast.success(`Filled ${totalFilled} translation${totalFilled === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Translation failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="admin-btn admin-btn-accent"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      Translate All Empty Fields
    </button>
  );
}
