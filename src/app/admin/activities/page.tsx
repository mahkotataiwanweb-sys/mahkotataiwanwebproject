'use client';

import { Sparkles } from 'lucide-react';
import ArticlesAdminView from '@/components/admin/ArticlesAdminView';

/**
 * Activity tab — DB type masih "lifestyle" (sesuai schema), label tampilan
 * "Activity" mengikuti terminology website setelah rename lifestyle→activity.
 */
export default function ActivitiesAdminPage() {
  return (
    <ArticlesAdminView
      lockedType="lifestyle"
      pageTitle="Activity"
      singular="Activity"
      subtitle="Konten lifestyle / activity (DB type: lifestyle)"
      translateContext="activity / lifestyle article"
      icon={Sparkles}
    />
  );
}
