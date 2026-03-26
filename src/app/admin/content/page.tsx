'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SiteContent } from '@/types/database';
import toast from 'react-hot-toast';
import { Save, FileText } from 'lucide-react';

export default function ContentPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('site_content').select('*').order('section').order('key');
    if (error) toast.error('Failed to load content');
    else setContent(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const updateField = (id: string, field: string, value: string) => {
    setContent(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const item of content) {
        await supabase.from('site_content').update({
          value_en: item.value_en,
          value_id: item.value_id,
          value_zh: item.value_zh,
        } as any).eq('id', item.id);
      }
      toast.success('All content saved!');
    } catch {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const sections = [...new Set(content.map(c => c.section))];

  if (loading) return <div className="text-gray-400 text-center py-12">Loading content...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500 text-sm">Edit website text in all languages</p>
        </div>
        <button onClick={saveAll} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {content.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No content found. Run database setup first.</p>
        </div>
      ) : sections.map((section) => (
        <div key={section} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{section}</h2>
          <div className="space-y-4">
            {content.filter(c => c.section === section).map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block capitalize">{item.key.replace(/_/g, ' ')}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-gray-400 mb-1 block">🇺🇸 English</span>
                    {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                      <textarea value={item.value_en} onChange={(e) => updateField(item.id, 'value_en', e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy" />
                    ) : (
                      <input type={item.content_type === 'number' ? 'number' : 'text'} value={item.value_en} onChange={(e) => updateField(item.id, 'value_en', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 mb-1 block">🇮🇩 Indonesia</span>
                    {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                      <textarea value={item.value_id} onChange={(e) => updateField(item.id, 'value_id', e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy" />
                    ) : (
                      <input type={item.content_type === 'number' ? 'number' : 'text'} value={item.value_id} onChange={(e) => updateField(item.id, 'value_id', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 mb-1 block">🇹🇼 繁體中文</span>
                    {item.content_type === 'textarea' || item.content_type === 'richtext' ? (
                      <textarea value={item.value_zh} onChange={(e) => updateField(item.id, 'value_zh', e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy" />
                    ) : (
                      <input type={item.content_type === 'number' ? 'number' : 'text'} value={item.value_zh} onChange={(e) => updateField(item.id, 'value_zh', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
