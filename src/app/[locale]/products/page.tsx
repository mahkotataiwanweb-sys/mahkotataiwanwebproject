'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProductsPage() {
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}#products-catalog`);
  }, [locale, router]);

  return null;
}
