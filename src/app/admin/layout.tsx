'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Package, FolderOpen, FileText, Settings,
  LogOut, Menu, X, ChevronRight, Newspaper, ImageIcon, Store, Link2, Globe, Image as ImageIconAlt, Play, ShoppingBag
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/articles', label: 'Articles', icon: Newspaper },
  { href: '/admin/showcase-products', label: 'Product Showcase', icon: ShoppingBag },
  { href: '/admin/hero-slides', label: 'Hero Slides', icon: ImageIcon },
  { href: '/admin/video-showcase', label: 'Video Showcase', icon: Play },
  { href: '/admin/navbar', label: 'Navbar Menu', icon: Menu },
  { href: '/admin/footer', label: 'Footer Links', icon: Link2 },
  { href: '/admin/store-partners', label: 'Store Partners', icon: Store },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/pages', label: 'Pages', icon: Globe },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-navy text-white z-40 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/images/logo.png" alt="Logo" width={36} height={36} className="brightness-0 invert" />
            <div>
              <h2 className="font-bold text-sm">Mahkota Taiwan</h2>
              <p className="text-white/50 text-xs">CMS Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive(href)
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {label}
                {isActive(href) && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2 mt-2 rounded-xl text-xs text-white/40 hover:text-white/60 transition-all"
          >
            View Website →
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 sm:p-8">
          {children}
        </div>
      </main>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
