'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  FolderOpen,
  ImageIcon,
  Store,
  Play,
  ShoppingBag,
  MapPin,
  Calendar,
  ChefHat,
  Sparkles as SparklesIcon,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/ui';

type StatKey =
  | 'products'
  | 'categories'
  | 'showcaseProducts'
  | 'events'
  | 'activities'
  | 'recipes'
  | 'heroSlides'
  | 'storePartners'
  | 'storeLocations'
  | 'videoShowcases'
  | 'siteContent';

interface StatDef {
  key: StatKey;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const STAT_DEFINITIONS: StatDef[] = [
  { key: 'products', label: 'Products', href: '/admin/products', icon: Package, tone: 'from-blue-500 to-indigo-500' },
  { key: 'categories', label: 'Categories', href: '/admin/categories', icon: FolderOpen, tone: 'from-emerald-500 to-teal-500' },
  { key: 'showcaseProducts', label: 'Showcase Products', href: '/admin/showcase-products', icon: ShoppingBag, tone: 'from-fuchsia-500 to-pink-500' },
  { key: 'events', label: 'Events', href: '/admin/events', icon: Calendar, tone: 'from-violet-500 to-purple-500' },
  { key: 'activities', label: 'Activity', href: '/admin/activities', icon: SparklesIcon, tone: 'from-rose-500 to-pink-500' },
  { key: 'recipes', label: 'Recipes', href: '/admin/recipes', icon: ChefHat, tone: 'from-amber-500 to-orange-500' },
  { key: 'videoShowcases', label: 'Video Showcases', href: '/admin/video-showcase', icon: Play, tone: 'from-orange-500 to-red-500' },
  { key: 'heroSlides', label: 'Hero Slides', href: '/admin/hero-slides', icon: ImageIcon, tone: 'from-yellow-500 to-amber-500' },
  { key: 'storeLocations', label: 'Store Locations', href: '/admin/store-locations', icon: MapPin, tone: 'from-sky-500 to-cyan-500' },
  { key: 'storePartners', label: 'Store Partners', href: '/admin/store-partners', icon: Store, tone: 'from-cyan-500 to-blue-500' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<StatKey, number>>({
    products: 0,
    categories: 0,
    showcaseProducts: 0,
    events: 0,
    activities: 0,
    recipes: 0,
    heroSlides: 0,
    storePartners: 0,
    storeLocations: 0,
    videoShowcases: 0,
    siteContent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const tableQueries = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('showcase_products').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('type', 'event'),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('type', 'lifestyle'),
          supabase.from('articles').select('id', { count: 'exact', head: true }).eq('type', 'recipe'),
          supabase.from('hero_slides').select('id', { count: 'exact', head: true }),
          supabase.from('store_partners').select('id', { count: 'exact', head: true }),
          supabase.from('store_locations').select('id', { count: 'exact', head: true }),
          supabase.from('video_showcases').select('id', { count: 'exact', head: true }),
          supabase.from('site_content').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          products: tableQueries[0].count || 0,
          categories: tableQueries[1].count || 0,
          showcaseProducts: tableQueries[2].count || 0,
          events: tableQueries[3].count || 0,
          activities: tableQueries[4].count || 0,
          recipes: tableQueries[5].count || 0,
          heroSlides: tableQueries[6].count || 0,
          storePartners: tableQueries[7].count || 0,
          storeLocations: tableQueries[8].count || 0,
          videoShowcases: tableQueries[9].count || 0,
          siteContent: tableQueries[10].count || 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        subtitle="Selamat datang di Mahkota Taiwan CMS Console"
        actions={
          <Link href="/admin/products" className="admin-btn admin-btn-accent">
            <Sparkles className="w-4 h-4" />
            Manage products
          </Link>
        }
      />

      <div className="relative overflow-hidden admin-surface p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br from-[var(--color-admin-accent-soft)] to-transparent blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 admin-pill admin-pill-accent">
              <TrendingUp className="w-3 h-3" /> Live data dari Supabase
            </span>
            <h2 className="font-heading text-2xl font-bold mt-3 text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">
              Konsol terpadu untuk semua konten website
            </h2>
            <p className="text-sm text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] mt-1.5">
              Atur halaman, produk, event, activity, recipe, news, lokasi toko, navigasi, dan pengaturan brand — semua di satu tempat. Setiap field 3 bahasa kini dilengkapi auto-translate berbasis Claude AI.
            </p>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
            Ringkasan konten
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          {STAT_DEFINITIONS.map(({ key, label, href, icon: Icon, tone }) => (
            <Link key={key} href={href} className="admin-stat-card group block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">{label}</p>
                  <p className="font-heading text-3xl font-bold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] mt-1.5 tabular-nums">
                    {loading ? <span className="admin-skeleton inline-block w-10 h-7 align-middle" /> : stats[key]}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tone} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] group-hover:text-[var(--color-admin-accent)] transition-colors">
                Manage
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-surface p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] mb-4">
          Quick actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <QuickAction href="/admin/hero-slides" icon={ImageIcon} label="Hero" />
          <QuickAction href="/admin/products" icon={Package} label="Products" />
          <QuickAction href="/admin/events" icon={Calendar} label="Events" />
          <QuickAction href="/admin/recipes" icon={ChefHat} label="Recipes" />
          <QuickAction href="/admin/store-locations" icon={MapPin} label="Stores" />
          <QuickAction href="/admin/settings" icon={Store} label="Company" />
        </div>
      </section>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] hover:bg-[var(--color-admin-accent-soft)] dark:hover:bg-[rgba(184,134,11,0.12)] transition-colors text-center"
    >
      <Icon className="w-5 h-5 text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]" />
      <p className="text-xs font-medium text-[var(--color-admin-ink-2)] dark:text-[var(--color-admin-ink-2-dark)]">{label}</p>
    </Link>
  );
}
