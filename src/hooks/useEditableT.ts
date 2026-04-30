'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePageContent } from './usePageContent';

/**
 * Drop-in replacement for next-intl's `useTranslations(namespace)` that ALSO
 * checks the `page_content` Supabase table for an admin-authored override
 * before falling back to the static translation.
 *
 * Usage — change a single line and every existing `t('xxx')` call inside the
 * component becomes editable from the CMS at /admin/pages:
 *
 *   // before
 *   const t = useTranslations('about');
 *
 *   // after
 *   const t = useEditableT('about');
 *
 * Lookup convention for `t(key)`:
 *   - Single-segment key  e.g. `t('title')`         → page_content row with
 *     section='_' key='title'
 *   - Dot-namespaced key  e.g. `t('hero.title')`    → page_content row with
 *     section='hero' key='title'
 *   - Multi-dot key       e.g. `t('faq.q1.answer')` → section='faq' key='q1.answer'
 *
 * Interpolation: when the override contains `{var}` placeholders and `values`
 * are provided, simple braces substitution is applied. For ICU-rich messages
 * (plurals, selects), simply leave the page_content row empty — the static
 * translation handles them.
 *
 * `t.raw(key)` always delegates to the underlying next-intl call so existing
 * code that destructures nested objects continues to work unchanged.
 *
 * @param namespace  next-intl namespace, also used as the `page_content.page` slug
 * @param pageSlug   override the page slug if it differs from the namespace
 */
export interface EditableTranslator {
  (key: string, values?: Record<string, string | number | Date>): string;
  raw: (key: string) => unknown;
}

export function useEditableT(namespace: string, pageSlug?: string): EditableTranslator {
  const slug = pageSlug || namespace;
  const nextIntlT = useTranslations(namespace);
  const locale = useLocale();
  const { lookup, loading } = usePageContent(slug);

  const interp = useCallback(
    (template: string, values?: Record<string, string | number | Date>): string => {
      if (!values) return template;
      let out = template;
      for (const [name, value] of Object.entries(values)) {
        out = out.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
      }
      return out;
    },
    []
  );

  const t = useMemo(() => {
    function fn(key: string, values?: Record<string, string | number | Date>): string {
      // Resolve override only after page_content has loaded — avoid flicker
      // where the first render shows the override and a re-render reverts to
      // the static translation.
      if (!loading) {
        const dot = key.indexOf('.');
        const section = dot === -1 ? '_' : key.slice(0, dot);
        const k = dot === -1 ? key : key.slice(dot + 1);
        const override = lookup.pick(section, k, locale);
        if (override) return interp(override, values);
      }
      try {
        return nextIntlT(key, values as never);
      } catch {
        return key;
      }
    }
    fn.raw = (key: string) => {
      try {
        return nextIntlT.raw(key);
      } catch {
        return undefined;
      }
    };
    return fn as EditableTranslator;
  }, [loading, lookup, locale, nextIntlT, interp]);

  return t;
}
