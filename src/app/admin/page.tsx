'use client';

import { useEffect, useState } from 'react';
import { Package, FolderOpen, FileText, Newspaper, ImageIcon, Store, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface DashboardStats {
  products: number;
  categories: number;
  articles: number;
  heroSlides: number;
  storePartners: number;
  content: number;
  videoShowcases: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ products: 0, categories: 0, articles: 0, heroSlides: 0, storePartners: 0, content: 0, videoShowcases: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [productsRes, categoriesRes, articlesRes, heroSlidesRes, storePartnersRes, contentRes, videoShowcasesRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('id', { count: 'exact', head: true }),
          supabase.from('hero_slides').select('id', { count: 'exact', head: true }),
          supabase.from('store_partners').select('id', { count: 'exact', head: true }),
          supabase.from('site_content').select('id', { count: 'exact', head: true }),
          supabase.from('video_showcases').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          products: productsRes.count || 0,
          categories: categoriesRes.count || 0,
          articles: articlesRes.count || 0,
          heroSlides: heroSlidesRes.count || 0,
          storePartners: storePartnersRes.count || 0,
          content: contentRes.count || 0,
          videoShowcases: videoShowcasesRes.count || 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'bg-blue-500' },
    { label: 'Categories', value: stats.categories, icon: FolderOpen, color: 'bg-green-500' },
    { label: 'Articles', value: stats.articles, icon: Newspaper, color: 'bg-indigo-500' },
    { label: 'Hero Slides', value: stats.heroSlides, icon: ImageIcon, color: 'bg-amber-500' },
    { label: 'Store Partners', value: stats.storePartners, icon: Store, color: 'bg-teal-500' },
    { label: 'Content Blocks', value: stats.content, icon: FileText, color: 'bg-purple-500' },
    { label: 'Video Showcases', value: stats.videoShowcases, icon: Play, color: 'bg-rose-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to Mahkota Taiwan CMS</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loading ? '—' : value}
            </p>
            <p className="text-gray-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/admin/products" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Products</p>
          </Link>
          <Link href="/admin/categories" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <FolderOpen className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Categories</p>
          </Link>
          <Link href="/admin/articles" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <Newspaper className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Articles</p>
          </Link>
          <Link href="/admin/hero-slides" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <ImageIcon className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Hero Slides</p>
          </Link>
          <Link href="/admin/store-partners" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <Store className="w-6 h-6 text-teal-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Store Partners</p>
          </Link>
          <Link href="/admin/content" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <FileText className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Content</p>
          </Link>
          <Link href="/admin/video-showcase" className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center">
            <Play className="w-6 h-6 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Video Showcase</p>
          </Link>
        </div>
      </div>

      {/* Setup Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-amber-800 font-semibold mb-2">⚡ Database Setup</h3>
        <p className="text-amber-700 text-sm mb-3">
          If you see empty data, run the database migration first.
        </p>
        <a href="/api/setup" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
          Run Setup →
        </a>
      </div>
    </div>
  );
}
