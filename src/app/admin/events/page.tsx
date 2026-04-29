'use client';

import { Calendar } from 'lucide-react';
import ArticlesAdminView from '@/components/admin/ArticlesAdminView';

export default function EventsAdminPage() {
  return (
    <ArticlesAdminView
      lockedType="event"
      pageTitle="Events"
      singular="Event"
      subtitle="Acara, expo, dan event Mahkota Taiwan"
      translateContext="event article"
      icon={Calendar}
    />
  );
}
