'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { usePageContent } from '@/hooks/usePageContent';

interface Props {
  /** Page slug, must match `page_content.page` (e.g. "about", "contact"). */
  page: string;
  /** Section name in `page_content`. Group related keys under one section. */
  section: string;
  /** Specific key inside the section. */
  k: string;
  /** Existing fallback (typically a next-intl `t()` call). Rendered unchanged
   *  while data is loading and whenever no admin override exists. */
  children: ReactNode;
}

/**
 * Wrap any user-facing text node so that admins can override it from the CMS
 * (`/admin/pages` → page_content) without redeploying the site.
 *
 * Usage:
 *
 * ```tsx
 * <EditableText page="about" section="hero" k="title">{t('title')}</EditableText>
 * ```
 *
 * If no `page_content` row exists for the given (page, section, k), the
 * original `children` (e.g. the next-intl translation) is rendered unchanged.
 * As soon as an admin adds a row in /admin/pages, the public site updates
 * (auto-translate fills 3 languages so locale-aware override works out of
 * the box).
 */
export default function EditableText({ page, section, k, children }: Props) {
  const locale = useLocale();
  const { lookup, loading } = usePageContent(page);
  if (loading) return <>{children}</>;
  const override = lookup.pick(section, k, locale, '');
  if (!override) return <>{children}</>;
  return <>{override}</>;
}
