'use client';

import { Newspaper } from 'lucide-react';
import ArticlesAdminView from '@/components/admin/ArticlesAdminView';

export default function NewsAdminPage() {
  return (
    <ArticlesAdminView
      lockedType="news"
      pageTitle="News"
      singular="News article"
      subtitle="Berita & pengumuman perusahaan"
      translateContext="news article"
      icon={Newspaper}
    />
  );
}
