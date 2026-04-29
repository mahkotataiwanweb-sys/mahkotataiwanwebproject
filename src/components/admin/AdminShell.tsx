'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard,
  Image as ImageIconLucide,
  FileText,
  FolderOpen,
  Package,
  ShoppingBag,
  Newspaper,
  Calendar,
  Sparkles as SparklesIcon,
  ChefHat,
  Play,
  MapPin,
  Store,
  Menu as MenuIcon,
  Link2,
  Globe,
  Settings,
  LogOut,
  ExternalLink,
  Moon,
  Sun,
  Search,
  X,
  ChevronRight,
} from 'lucide-react';

import { useAdminTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, description: 'Ringkasan & quick actions' },
    ],
  },
  {
    title: 'Homepage',
    items: [
      { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIconLucide, description: 'Slider utama (image / video / gif)' },
      { href: '/admin/content', label: 'Site Content', icon: FileText, description: 'Konten umum tiap section' },
    ],
  },
  {
    title: 'Produk',
    items: [
      { href: '/admin/categories', label: 'Categories', icon: FolderOpen, description: 'Kategori produk' },
      { href: '/admin/products', label: 'Products', icon: Package, description: 'Katalog produk' },
      { href: '/admin/showcase-products', label: 'Showcase Products', icon: ShoppingBag, description: 'Produk highlight halaman utama' },
    ],
  },
  {
    title: 'Artikel & Media',
    items: [
      { href: '/admin/events', label: 'Events', icon: Calendar, description: 'Acara & expo' },
      { href: '/admin/activities', label: 'Activity', icon: SparklesIcon, description: 'Lifestyle / activity' },
      { href: '/admin/recipes', label: 'Recipes', icon: ChefHat, description: 'Resep masakan' },
      { href: '/admin/news', label: 'News', icon: Newspaper, description: 'Berita & pengumuman' },
      { href: '/admin/video-showcase', label: 'Video Showcases', icon: Play, description: 'YouTube · Shorts · TikTok · Reels' },
    ],
  },
  {
    title: 'Store',
    items: [
      { href: '/admin/store-locations', label: 'Store Locations', icon: MapPin, description: 'Lokasi toko & koordinat' },
      { href: '/admin/store-partners', label: 'Store Partners', icon: Store, description: 'Logo retail partner' },
    ],
  },
  {
    title: 'Navigasi',
    items: [
      { href: '/admin/navbar', label: 'Navbar Menus', icon: MenuIcon, description: 'Menu navigasi (nested)' },
      { href: '/admin/footer', label: 'Footer Links', icon: Link2, description: 'Link footer per section' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { href: '/admin/settings', label: 'Company Settings', icon: Settings, description: 'Profil perusahaan & social' },
      { href: '/admin/pages', label: 'Page Content', icon: Globe, description: 'Konten per halaman (about/contact/dll)' },
    ],
  },
];

function flatNav(): NavItem[] {
  return NAV_GROUPS.flatMap((g) => g.items);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useAdminTheme();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const currentItem = flatNav().find((i) => isActive(i.href));

  const filteredGroups = !search.trim()
    ? NAV_GROUPS
    : NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((it) => it.label.toLowerCase().includes(search.toLowerCase())),
      })).filter((g) => g.items.length > 0);

  return (
    <div className="admin-scope min-h-screen flex">
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!rounded-xl !text-sm !font-medium',
          style: {
            background: theme === 'dark' ? '#1A2434' : '#FFFFFF',
            color: theme === 'dark' ? '#F1F5F9' : '#0F172A',
            border: `1px solid ${theme === 'dark' ? '#2A3548' : '#E8EBF0'}`,
            boxShadow: '0 12px 28px -10px rgba(15,23,42,0.18)',
          },
        }}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'admin-sidebar fixed inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-admin-accent)] to-[#D4A03B] flex items-center justify-center shadow-lg">
              <Image src="/images/logo.png" alt="Logo" width={22} height={22} className="brightness-0" />
            </div>
            <div className="leading-tight">
              <p className="font-heading text-[15px] font-bold text-white tracking-tight">Mahkota Taiwan</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-admin-sidebar-muted)]">CMS Console</p>
            </div>
          </Link>
          <button
            type="button"
            className="lg:hidden admin-btn-icon !text-white/70"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu…"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-[var(--color-admin-accent)] transition-colors"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto admin-sidebar-scroll px-3 pb-4 space-y-4">
          {filteredGroups.map((group) => (
            <div key={group.title}>
              <p className="admin-sidebar-group-title">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('admin-sidebar-link', isActive(href) && 'is-active')}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    {isActive(href) && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <button
            type="button"
            onClick={toggle}
            className="admin-sidebar-link w-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="flex-1 text-left">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <Link href="/" target="_blank" className="admin-sidebar-link w-full">
            <ExternalLink className="w-4 h-4" />
            <span className="flex-1 text-left">View website</span>
          </Link>
          <button type="button" onClick={handleLogout} className="admin-sidebar-link w-full text-red-300 hover:text-red-200">
            <LogOut className="w-4 h-4" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 lg:ml-72 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-[color-mix(in_srgb,var(--color-admin-bg)_85%,transparent)] dark:bg-[color-mix(in_srgb,var(--color-admin-bg-dark)_85%,transparent)] border-b border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)]">
          <div className="px-4 sm:px-8 h-14 flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden admin-btn-icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-admin-faint)] dark:text-[var(--color-admin-faint-dark)] font-semibold">
                {currentItem ? findGroupTitle(currentItem.href) : 'Console'}
              </p>
              <h2 className="text-sm font-semibold text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)] truncate">
                {currentItem?.label || 'Admin'}
              </h2>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="admin-btn-icon"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function findGroupTitle(href: string): string {
  for (const g of NAV_GROUPS) {
    if (g.items.some((it) => it.href === href)) return g.title;
  }
  return 'Console';
}

export { NAV_GROUPS };
