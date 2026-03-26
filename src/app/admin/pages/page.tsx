'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, FileText, Upload, Globe, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import AutoTranslateButton from '@/components/admin/AutoTranslateButton';

interface PageContent {
  id: string;
  page: string;
  section: string;
  key: string;
  value_en: string;
  value_id: string;
  value_zh: string;
  content_type: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface NewItemForm {
  section: string;
  key: string;
  content_type: string;
}

const PAGE_TABS = [
  { value: 'about' as const, label: 'About Us' },
  { value: 'contact' as const, label: 'Contact Us' },
];

const CONTENT_TYPES = ['text', 'textarea', 'richtext', 'number', 'image', 'link', 'email', 'phone'];

const formatKeyLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatSectionLabel = (section: string): string => {
  return section
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function PagesEditorPage() {
  const [content, setContent] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<'about' | 'contact'>('about');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>({ section: '', key: '', content_type: 'text' });
  const [addingItem, setAddingItem] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('page', activePage)
      .order('section')
      .order('sort_order');

    if (error) {
      toast.error('Failed to load page content');
    } else {
      setContent(data || []);
    }
    setLoading(false);
  }, [activePage]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const updateField = (id: string, field: string, value: string | number | boolean) => {
    setContent((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const updates = content.map((item) => ({
        id: item.id,
        value_en: item.value_en,
        value_id: item.value_id,
        value_zh: item.value_zh,
        content_type: item.content_type,
        image_url: item.image_url,
        sort_order: item.sort_order,
        is_active: item.is_active,
      }));

      const res = await fetch('/api/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success('All changes saved!');
    } catch {
      toast.error('Failed to save changes');
    }
    setSaving(false);
  };

  const addItem = async () => {
    if (!newItem.section.trim() || !newItem.key.trim()) {
      toast.error('Section and key are required');
      return;
    }

    setAddingItem(true);
    try {
      const maxSortOrder = content
        .filter((c) => c.section === newItem.section)
        .reduce((max, c) => Math.max(max, c.sort_order), -1);

      const res = await fetch('/api/page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: activePage,
          section: newItem.section.toLowerCase().replace(/\s+/g, '_'),
          key: newItem.key.toLowerCase().replace(/\s+/g, '_'),
          value_en: '',
          value_id: '',
          value_zh: '',
          content_type: newItem.content_type,
          image_url: null,
          sort_order: maxSortOrder + 1,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add item');
      }

      toast.success('Content item added!');
      setShowAddModal(false);
      setNewItem({ section: '', key: '', content_type: 'text' });
      fetchContent();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      toast.error(message);
    }
    setAddingItem(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content item?')) return;

    try {
      const res = await fetch(`/api/page-content?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Content item deleted');
      setContent((prev) => prev.filter((item) => item.id !== id));
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', `pages/${activePage}`);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateField(id, 'image_url', data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Image upload failed');
    }
    setUploadingId(null);
  };

  const handleAutoTranslate = (id: string, translations: { id: string; zh: string }) => {
    updateField(id, 'value_id', translations.id);
    updateField(id, 'value_zh', translations.zh);
  };

  const sections = [...new Set(content.map((c) => c.section))];
  const existingSections = [...new Set(content.map((c) => c.section))];

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">
        <div className="animate-pulse">Loading page content...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pages Editor</h1>
          <p className="text-gray-500 text-sm">
            Edit content for About Us and Contact Us pages in all languages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActivePage(tab.value)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activePage === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {content.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500 mb-1">No content found</p>
          <p className="text-sm">
            Click &quot;Add Item&quot; to create content for the {activePage === 'about' ? 'About Us' : 'Contact Us'} page.
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <div
            key={section}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-navy" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {formatSectionLabel(section)}
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {content.filter((c) => c.section === section).length} items
                </span>
              </div>
            </div>

            {/* Content Items */}
            <div className="space-y-4">
              {content
                .filter((c) => c.section === section)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      item.is_active ? 'border-gray-100' : 'border-orange-200 bg-orange-50/30'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          {formatKeyLabel(item.key)}
                        </label>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                          {item.content_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AutoTranslateButton
                          sourceText={item.value_en}
                          onTranslated={(t) => handleAutoTranslate(item.id, t)}
                        />
                        <button
                          onClick={() => updateField(item.id, 'is_active', !item.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            item.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-orange-500 hover:bg-orange-50'
                          }`}
                          title={item.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                        >
                          {item.is_active ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Image upload for image content type */}
                    {item.content_type === 'image' && (
                      <div className="mb-3">
                        <div className="flex items-start gap-4">
                          {item.image_url ? (
                            <div className="relative group">
                              <Image
                                src={item.image_url}
                                alt=""
                                width={80}
                                height={80}
                                className="rounded-lg object-cover w-20 h-20"
                                unoptimized
                              />
                              <button
                                onClick={() => updateField(item.id, 'image_url', '')}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-300 text-xs">No image</span>
                            </div>
                          )}
                          <label
                            className={`flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500 transition-colors ${
                              uploadingId === item.id ? 'opacity-50 pointer-events-none' : ''
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            {uploadingId === item.id ? 'Uploading...' : 'Upload Image'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(item.id, file);
                              }}
                              className="hidden"
                              disabled={uploadingId === item.id}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Language Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* English */}
                      <div>
                        <span className="text-xs text-gray-400 mb-1 block">🇺🇸 English</span>
                        {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                          <textarea
                            value={item.value_en}
                            onChange={(e) => updateField(item.id, 'value_en', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy"
                            placeholder="English text..."
                          />
                        ) : (
                          <input
                            type={item.content_type === 'number' ? 'number' : 'text'}
                            value={item.value_en}
                            onChange={(e) => updateField(item.id, 'value_en', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                            placeholder="English..."
                          />
                        )}
                      </div>

                      {/* Indonesian */}
                      <div>
                        <span className="text-xs text-gray-400 mb-1 block">🇮🇩 Indonesia</span>
                        {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                          <textarea
                            value={item.value_id}
                            onChange={(e) => updateField(item.id, 'value_id', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy"
                            placeholder="Teks Indonesia..."
                          />
                        ) : (
                          <input
                            type={item.content_type === 'number' ? 'number' : 'text'}
                            value={item.value_id}
                            onChange={(e) => updateField(item.id, 'value_id', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                            placeholder="Indonesia..."
                          />
                        )}
                      </div>

                      {/* Chinese */}
                      <div>
                        <span className="text-xs text-gray-400 mb-1 block">🇹🇼 繁體中文</span>
                        {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                          <textarea
                            value={item.value_zh}
                            onChange={(e) => updateField(item.id, 'value_zh', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy"
                            placeholder="中文文字..."
                          />
                        ) : (
                          <input
                            type={item.content_type === 'number' ? 'number' : 'text'}
                            value={item.value_zh}
                            onChange={(e) => updateField(item.id, 'value_zh', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                            placeholder="中文..."
                          />
                        )}
                      </div>
                    </div>

                    {/* Sort order */}
                    <div className="flex items-center gap-2 mt-3">
                      <label className="text-xs text-gray-400">Sort Order:</label>
                      <input
                        type="number"
                        value={item.sort_order}
                        onChange={(e) =>
                          updateField(item.id, 'sort_order', parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-navy"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      {/* Add New Content Item Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Content Item</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page
                </label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  {activePage === 'about' ? 'About Us' : 'Contact Us'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem.section}
                    onChange={(e) =>
                      setNewItem((prev) => ({ ...prev, section: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    placeholder="e.g. hero, form, stats"
                    list="existing-sections"
                  />
                  <datalist id="existing-sections">
                    {existingSections.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                {existingSections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {existingSections.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewItem((prev) => ({ ...prev, section: s }))}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                          newItem.section === s
                            ? 'bg-navy text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={newItem.key}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, key: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                  placeholder="e.g. title, description, subtitle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Type
                </label>
                <select
                  value={newItem.content_type}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, content_type: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addItem}
                disabled={addingItem}
                className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors disabled:opacity-50"
              >
                {addingItem ? 'Adding...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
