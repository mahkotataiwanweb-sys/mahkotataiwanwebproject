'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Article } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload, Newspaper, Eye, EyeOff, GripVertical, Images } from 'lucide-react';
import Image from 'next/image';

type ArticleType = 'event' | 'news' | 'activity' | 'recipe';

const typeColors: Record<ArticleType, string> = {
  event: 'bg-blue-100 text-blue-700',
  recipe: 'bg-orange-100 text-orange-700',
  activity: 'bg-green-100 text-green-700',
  news: 'bg-purple-100 text-purple-700',
};

const sliderOptions = [
  { label: 'None', value: '' },
  { label: 'Slider 1', value: 'slider_1' },
  { label: 'Slider 2', value: 'slider_2' },
  { label: 'Slider 3', value: 'slider_3' },
  { label: 'Slider 4', value: 'slider_4' },
];

interface ArticleForm {
  type: ArticleType;
  title_en: string;
  title_id: string;
  title_zh: string;
  slug: string;
  description_en: string;
  description_id: string;
  description_zh: string;
  excerpt_en: string;
  excerpt_id: string;
  excerpt_zh: string;
  content_en: string;
  content_id: string;
  content_zh: string;
  image_url: string;
  slider_section: string;
  gallery_images: string[];
  published_at: string;
  is_active: boolean;
  sort_order: number;
}

const defaultForm: ArticleForm = {
  type: 'event',
  title_en: '', title_id: '', title_zh: '',
  slug: '',
  description_en: '', description_id: '', description_zh: '',
  excerpt_en: '', excerpt_id: '', excerpt_zh: '',
  content_en: '', content_id: '', content_zh: '',
  image_url: '',
  slider_section: '',
  gallery_images: [],
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
  const [form, setForm] = useState<ArticleForm>({ ...defaultForm });
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setForm({ ...defaultForm, published_at: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };

  const openEditModal = (article: Article) => {
    setEditingArticle(article);
    setForm({
      type: article.type,
      title_en: article.title_en,
      title_id: article.title_id,
      title_zh: article.title_zh,
      slug: article.slug,
      description_en: article.description_en || '',
      description_id: article.description_id || '',
      description_zh: article.description_zh || '',
      excerpt_en: article.excerpt_en || '',
      excerpt_id: article.excerpt_id || '',
      excerpt_zh: article.excerpt_zh || '',
      content_en: article.content_en || '',
      content_id: article.content_id || '',
      content_zh: article.content_zh || '',
      image_url: article.image_url || '',
      slider_section: article.slider_section || '',
      gallery_images: article.gallery_images || [],
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
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: form.type,
        title_en: form.title_en,
        title_id: form.title_id,
        title_zh: form.title_zh,
        slug: form.slug,
        description_en: form.description_en || null,
        description_id: form.description_id || null,
        description_zh: form.description_zh || null,
        excerpt_en: form.excerpt_en,
        excerpt_id: form.excerpt_id,
        excerpt_zh: form.excerpt_zh,
        content_en: form.content_en,
        content_id: form.content_id,
        content_zh: form.content_zh,
        image_url: form.image_url || null,
        slider_section: form.slider_section || null,
        gallery_images: form.gallery_images.length > 0 ? form.gallery_images : null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

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
    } finally {
      setSaving(false);
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
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'articles');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm(prev => ({ ...prev, image_url: data.url }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    let successCount = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'articles/gallery');
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.error) {
          setForm(prev => ({
            ...prev,
            gallery_images: [...prev.gallery_images, data.url]
          }));
          successCount++;
        }
      } catch {
        // skip failed uploads
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} gallery image${successCount > 1 ? 's' : ''} uploaded!`);
    } else {
      toast.error('Gallery upload failed');
    }
    setUploadingGallery(false);
    // Reset file input
    e.target.value = '';
  };

  const removeGalleryImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const moveGalleryImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.gallery_images.length) return;
    const newImages = [...form.gallery_images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setForm(prev => ({ ...prev, gallery_images: newImages }));
  };

  const toggleActive = async (article: Article) => {
    const { error } = await supabase
      .from('articles')
      .update({ is_active: !article.is_active })
      .eq('id', article.id);
    if (error) toast.error('Failed to update status');
    else {
      toast.success(article.is_active ? 'Article deactivated' : 'Article activated');
      fetchArticles();
    }
  };

  const tabs: { label: string; value: ArticleType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Events', value: 'event' },
    { label: 'Recipes', value: 'recipe' },
    { label: 'Lifestyle', value: 'activity' },
    { label: 'News', value: 'news' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 text-sm">
            {articles.length} articles{filterType !== 'all' ? ` (${filterType})` : ''} · {articles.filter(a => a.is_active).length} active
          </p>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slider</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Order</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <div className="animate-pulse">Loading articles...</div>
                </td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <Newspaper className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No articles found
                </td></tr>
              ) : articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {article.image_url ? (
                          <Image src={article.image_url} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <Newspaper className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[250px]">{article.title_en}</p>
                        <p className="text-gray-400 text-xs truncate max-w-[250px]">{article.slug}</p>
                        {article.gallery_images && article.gallery_images.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-500 mt-0.5">
                            <Images className="w-3 h-3" /> {article.gallery_images.length} gallery images
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${typeColors[article.type]}`}>
                      {article.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {article.slider_section ? (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                        {article.slider_section.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {article.published_at ? new Date(article.published_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(article)}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                        article.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {article.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {article.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{article.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEditModal(article)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-block mr-1" title="Edit">
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-block" title="Delete">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl my-4 p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingArticle ? 'Edit Article' : 'Add Article'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6">
              {/* Section 1: Basic Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">1</span>
                  Basic Info
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as ArticleType }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    >
                      <option value="event">Event</option>
                      <option value="recipe">Recipe</option>
                      <option value="activity">Lifestyle</option>
                      <option value="news">News</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Slug</label>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-gray-50"
                      placeholder="auto-generated-from-title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Slider Section</label>
                    <select
                      value={form.slider_section}
                      onChange={(e) => setForm(prev => ({ ...prev, slider_section: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    >
                      {sliderOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Cover Image */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">2</span>
                  Cover Image
                </h3>
                <div className="flex items-start gap-4">
                  {form.image_url ? (
                    <div className="relative group">
                      <Image src={form.image_url} alt="" width={120} height={80} className="rounded-lg object-cover w-[120px] h-[80px]" unoptimized />
                      <button
                        onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-[120px] h-[80px] rounded-lg bg-gray-100 flex items-center justify-center">
                      <Newspaper className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className={`flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload Cover Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Section 3: Titles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">3</span>
                  Titles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English *</label>
                    <input
                      type="text"
                      value={form.title_en}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        title_en: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="Article title"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Indonesian</label>
                    <input
                      type="text"
                      value={form.title_id}
                      onChange={(e) => setForm(prev => ({ ...prev, title_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="Judul artikel"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">中文</label>
                    <input
                      type="text"
                      value={form.title_zh}
                      onChange={(e) => setForm(prev => ({ ...prev, title_zh: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                      placeholder="文章标题"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Descriptions (short, for cards) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">4</span>
                  Descriptions
                  <span className="text-xs font-normal text-gray-400">(short text shown on article cards)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <textarea
                      value={form.description_en}
                      onChange={(e) => setForm(prev => ({ ...prev, description_en: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="Short description for cards"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Indonesian</label>
                    <textarea
                      value={form.description_id}
                      onChange={(e) => setForm(prev => ({ ...prev, description_id: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="Deskripsi singkat"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">中文</label>
                    <textarea
                      value={form.description_zh}
                      onChange={(e) => setForm(prev => ({ ...prev, description_zh: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="简短描述"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Excerpts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">5</span>
                  Excerpts
                  <span className="text-xs font-normal text-gray-400">(preview text for listing pages)</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <textarea
                      value={form.excerpt_en}
                      onChange={(e) => setForm(prev => ({ ...prev, excerpt_en: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                      placeholder="Preview text for listing pages"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Indonesian</label>
                      <textarea
                        value={form.excerpt_id}
                        onChange={(e) => setForm(prev => ({ ...prev, excerpt_id: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                        placeholder="Teks pratinjau"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">中文</label>
                      <textarea
                        value={form.excerpt_zh}
                        onChange={(e) => setForm(prev => ({ ...prev, excerpt_zh: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-none"
                        placeholder="预览文本"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">6</span>
                  Content
                  <span className="text-xs font-normal text-gray-400">(full article content)</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">English</label>
                    <textarea
                      value={form.content_en}
                      onChange={(e) => setForm(prev => ({ ...prev, content_en: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-y min-h-[120px]"
                      placeholder="Full article content in English..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Indonesian</label>
                    <textarea
                      value={form.content_id}
                      onChange={(e) => setForm(prev => ({ ...prev, content_id: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-y min-h-[120px]"
                      placeholder="Konten artikel lengkap dalam Bahasa Indonesia..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">中文</label>
                    <textarea
                      value={form.content_zh}
                      onChange={(e) => setForm(prev => ({ ...prev, content_zh: e.target.value }))}
                      rows={6}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy resize-y min-h-[120px]"
                      placeholder="完整的中文文章内容..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 7: Gallery Images */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">7</span>
                  Gallery Images
                  <span className="text-xs font-normal text-gray-400">({form.gallery_images.length} images)</span>
                </h3>

                {/* Gallery Grid */}
                {form.gallery_images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {form.gallery_images.map((url, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                        <Image src={url} alt="" fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              onClick={() => moveGalleryImage(index, 'up')}
                              className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs hover:bg-white"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}
                          <button
                            onClick={() => removeGalleryImage(index)}
                            className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            title="Remove"
                          >
                            ×
                          </button>
                          {index < form.gallery_images.length - 1 && (
                            <button
                              onClick={() => moveGalleryImage(index, 'down')}
                              className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-xs hover:bg-white"
                              title="Move right"
                            >
                              →
                            </button>
                          )}
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className={`inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 transition-colors ${uploadingGallery ? 'opacity-50 pointer-events-none' : ''}`}>
                  <Images className="w-4 h-4" />
                  {uploadingGallery ? 'Uploading...' : 'Add Gallery Images'}
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" disabled={uploadingGallery} />
                </label>
              </div>

              {/* Section 8: Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">8</span>
                  Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Published Date</label>
                    <input
                      type="date"
                      value={form.published_at}
                      onChange={(e) => setForm(prev => ({ ...prev, published_at: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    />
                  </div>
                  <div className="flex items-center gap-4 py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingArticle ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
