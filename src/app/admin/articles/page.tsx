'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { Article } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload, Newspaper } from 'lucide-react';
import Image from 'next/image';

type ArticleType = 'event' | 'news' | 'lifestyle' | 'recipe';

const typeColors: Record<ArticleType, string> = {
  event: 'bg-blue-100 text-blue-700',
  recipe: 'bg-orange-100 text-orange-700',
  lifestyle: 'bg-green-100 text-green-700',
  news: 'bg-purple-100 text-purple-700',
};

const defaultForm = {
  type: 'event' as ArticleType,
  title_en: '', title_id: '', title_zh: '',
  slug: '',
  excerpt_en: '', excerpt_id: '', excerpt_zh: '',
  content_en: '', content_id: '', content_zh: '',
  image_url: '',
  published_at: new Date().toISOString().split('T')[0],
  is_active: true,
  sort_order: 0,
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [filterType, setFilterType] = useState<ArticleType | 'all'>('all');
  const [form, setForm] = useState({ ...defaultForm });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('articles')
      .select('*')
      .order('sort_order', { ascending: true });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    const { data, error } = await query;
    if (error) toast.error('Failed to load articles');
    else setArticles(data || []);
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openAddModal = () => {
    setEditingArticle(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setForm({
      type: article.type,
      title_en: article.title_en, title_id: article.title_id, title_zh: article.title_zh,
      slug: article.slug,
      excerpt_en: article.excerpt_en, excerpt_id: article.excerpt_id, excerpt_zh: article.excerpt_zh,
      content_en: article.content_en, content_id: article.content_id, content_zh: article.content_zh,
      image_url: article.image_url || '',
      published_at: article.published_at ? article.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
      is_active: article.is_active,
      sort_order: article.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title_en.trim()) {
      toast.error('English title is required');
      return;
    }

    const payload = {
      ...form,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      image_url: form.image_url || null,
    };

    try {
      if (editingArticle) {
        const { error } = await supabase.from('articles').update(payload).eq('id', editingArticle.id);
        if (error) throw error;
        toast.success('Article updated!');
      } else {
        const { error } = await supabase.from('articles').insert(payload);
        if (error) throw error;
        toast.success('Article created!');
      }
      setShowModal(false);
      fetchArticles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save article';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Article deleted'); fetchArticles(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `articles/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    const url = getStorageUrl('media', fileName);
    setForm({ ...form, image_url: url });
    toast.success('Image uploaded!');
  };

  const tabs: { label: string; value: ArticleType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Events', value: 'event' },
    { label: 'Recipes', value: 'recipe' },
    { label: 'Lifestyle', value: 'lifestyle' },
    { label: 'News', value: 'news' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 text-sm">{articles.length} articles total</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors">
          <Plus className="w-4 h-4" /> Add Article
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === tab.value
                ? 'bg-navy text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Article</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <Newspaper className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No articles found
                </td></tr>
              ) : articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {article.image_url ? (
                          <Image src={article.image_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <Newspaper className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{article.title_en}</p>
                        <p className="text-gray-400 text-xs truncate">{article.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${typeColors[article.type]}`}>
                      {article.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${article.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {article.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{article.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(article)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-block mr-1">
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-block">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingArticle ? 'Edit Article' : 'Add Article'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Type + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ArticleType })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy">
                    <option value="event">Event</option>
                    <option value="recipe">Recipe</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="news">News</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-gray-50" placeholder="auto-generated-from-title" />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url && (
                    <Image src={form.image_url} alt="" width={60} height={60} className="rounded-lg object-cover" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <Upload className="w-4 h-4" /> Upload Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Title fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN)</label>
                  <input type="text" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (ID)</label>
                  <input type="text" value={form.title_id} onChange={(e) => setForm({ ...form, title_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title (中文)</label>
                  <input type="text" value={form.title_zh} onChange={(e) => setForm({ ...form, title_zh: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              </div>

              {/* Excerpt fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (EN)</label>
                <textarea value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (ID)</label>
                  <textarea value={form.excerpt_id} onChange={(e) => setForm({ ...form, excerpt_id: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (中文)</label>
                  <textarea value={form.excerpt_zh} onChange={(e) => setForm({ ...form, excerpt_zh: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
                </div>
              </div>

              {/* Content fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (EN)</label>
                <textarea value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (ID)</label>
                <textarea value={form.content_id} onChange={(e) => setForm({ ...form, content_id: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (中文)</label>
                <textarea value={form.content_zh} onChange={(e) => setForm({ ...form, content_zh: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none" />
              </div>

              {/* Published date + toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Published Date</label>
                  <input type="date" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
                {editingArticle ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
