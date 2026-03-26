'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Link2, Layers } from 'lucide-react';

interface FooterLink {
  id: string;
  section: string;
  label_en: string;
  label_id: string;
  label_zh: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

const SECTIONS = ['products', 'moments', 'company'] as const;

const SECTION_LABELS: Record<string, string> = {
  products: 'Products',
  moments: 'Moments',
  company: 'Company',
};

const defaultForm = {
  section: 'products',
  label_en: '',
  label_id: '',
  label_zh: '',
  url: '/',
  sort_order: 0,
  is_active: true,
};

export default function FooterPage() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FooterLink | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [activeTab, setActiveTab] = useState<string>('all');

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load footer links');
    else setLinks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const filteredLinks =
    activeTab === 'all' ? links : links.filter((l) => l.section === activeTab);

  // Group links by section for display
  const groupedBySection: Record<string, FooterLink[]> = {};
  filteredLinks.forEach((link) => {
    if (!groupedBySection[link.section]) groupedBySection[link.section] = [];
    groupedBySection[link.section].push(link);
  });

  const openAddModal = () => {
    setEditing(null);
    setForm({ ...defaultForm, section: activeTab !== 'all' ? activeTab : 'products' });
    setShowModal(true);
  };

  const openEditModal = (item: FooterLink) => {
    setEditing(item);
    setForm({
      section: item.section,
      label_en: item.label_en,
      label_id: item.label_id,
      label_zh: item.label_zh,
      url: item.url,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label_en.trim()) {
      toast.error('English label is required');
      return;
    }

    const payload = {
      section: form.section,
      label_en: form.label_en,
      label_id: form.label_id,
      label_zh: form.label_zh,
      url: form.url,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('footer_links')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Footer link updated!');
      } else {
        const { error } = await supabase.from('footer_links').insert(payload);
        if (error) throw error;
        toast.success('Footer link created!');
      }
      setShowModal(false);
      fetchLinks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save footer link';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer link?')) return;
    try {
      const { error } = await supabase.from('footer_links').delete().eq('id', id);
      if (error) throw error;
      toast.success('Footer link deleted');
      fetchLinks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    ...SECTIONS.map((s) => ({ key: s, label: SECTION_LABELS[s] })),
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Footer Links</h1>
          <p className="text-gray-500 text-sm">
            {links.length} link{links.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Footer Link
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-navy text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
            {tab.key === 'all' ? (
              <span className="ml-1.5 text-xs opacity-70">({links.length})</span>
            ) : (
              <span className="ml-1.5 text-xs opacity-70">
                ({links.filter((l) => l.section === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Links Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredLinks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No footer links yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first footer link to get started</p>
        </div>
      ) : (
        Object.entries(groupedBySection).map(([section, sectionLinks]) => (
          <div key={section} className="mb-6">
            {activeTab === 'all' && (
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {SECTION_LABELS[section] || section}
              </h3>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        Label (EN)
                      </th>
                      {activeTab === 'all' && (
                        <th className="text-left px-4 py-3 font-medium text-gray-500">
                          Section
                        </th>
                      )}
                      <th className="text-left px-4 py-3 font-medium text-gray-500">URL</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Order</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionLinks.map((link) => (
                      <tr
                        key={link.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{link.label_en}</span>
                        </td>
                        {activeTab === 'all' && (
                          <td className="px-4 py-3">
                            <span className="inline-block text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                              {SECTION_LABELS[link.section] || link.section}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Link2 className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[200px]">{link.url}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {link.sort_order}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                              link.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {link.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(link)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(link.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Footer Link' : 'Add Footer Link'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-white"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {SECTION_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Label fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.label_en}
                    onChange={(e) => setForm({ ...form, label_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    placeholder="e.g. About Us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (ID)
                  </label>
                  <input
                    type="text"
                    value={form.label_id}
                    onChange={(e) => setForm({ ...form, label_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    placeholder="e.g. Tentang Kami"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label (中文)
                  </label>
                  <input
                    type="text"
                    value={form.label_zh}
                    onChange={(e) => setForm({ ...form, label_zh: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                    placeholder="e.g. 關於我們"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy"
                  placeholder="/about"
                />
              </div>

              {/* Sort Order & Active */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
                    }
                    className="w-20 px-2 py-1 rounded border border-gray-200 text-sm"
                  />
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
                className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors"
              >
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
