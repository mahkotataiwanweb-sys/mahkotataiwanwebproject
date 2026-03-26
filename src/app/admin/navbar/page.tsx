'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Menu, ChevronRight, Link2, GripVertical } from 'lucide-react';

interface NavMenuItem {
  id: string;
  parent_id: string | null;
  label_en: string;
  label_id: string;
  label_zh: string;
  url: string;
  sort_order: number;
  is_active: boolean;
}

const defaultForm = {
  label_en: '',
  label_id: '',
  label_zh: '',
  url: '/',
  parent_id: null as string | null,
  sort_order: 0,
  is_active: true,
};

export default function NavbarPage() {
  const [menus, setMenus] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NavMenuItem | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('navbar_menus')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load menus');
    else setMenus(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // Get top-level menus (no parent)
  const topLevelMenus = menus.filter((m) => !m.parent_id);
  // Get children of a parent
  const getChildren = (parentId: string) =>
    menus.filter((m) => m.parent_id === parentId);

  // Build grouped list: parent followed by children
  const groupedMenus: { item: NavMenuItem; isChild: boolean }[] = [];
  topLevelMenus.forEach((parent) => {
    groupedMenus.push({ item: parent, isChild: false });
    getChildren(parent.id).forEach((child) => {
      groupedMenus.push({ item: child, isChild: true });
    });
  });
  // Also add orphan items (parent_id set but parent doesn't exist)
  const allParentIds = new Set(topLevelMenus.map((m) => m.id));
  menus
    .filter((m) => m.parent_id && !allParentIds.has(m.parent_id))
    .forEach((orphan) => {
      groupedMenus.push({ item: orphan, isChild: true });
    });

  const openAddModal = () => {
    setEditing(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (item: NavMenuItem) => {
    setEditing(item);
    setForm({
      label_en: item.label_en,
      label_id: item.label_id,
      label_zh: item.label_zh,
      url: item.url,
      parent_id: item.parent_id,
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
      label_en: form.label_en,
      label_id: form.label_id,
      label_zh: form.label_zh,
      url: form.url,
      parent_id: form.parent_id || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('navbar_menus')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Menu item updated!');
      } else {
        const { error } = await supabase.from('navbar_menus').insert(payload);
        if (error) throw error;
        toast.success('Menu item created!');
      }
      setShowModal(false);
      fetchMenus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save menu item';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    const children = getChildren(id);
    const msg = children.length > 0
      ? `This menu has ${children.length} sub-item(s). Deleting it will also remove them. Continue?`
      : 'Are you sure you want to delete this menu item?';
    if (!confirm(msg)) return;

    try {
      // Delete children first
      if (children.length > 0) {
        const { error: childError } = await supabase
          .from('navbar_menus')
          .delete()
          .eq('parent_id', id);
        if (childError) throw childError;
      }
      // Delete parent
      const { error } = await supabase.from('navbar_menus').delete().eq('id', id);
      if (error) throw error;
      toast.success('Menu item deleted');
      fetchMenus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    }
  };

  const getParentLabel = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = menus.find((m) => m.id === parentId);
    return parent ? parent.label_en : 'Unknown';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Navbar Menu</h1>
          <p className="text-gray-500 text-sm">
            {menus.length} menu item{menus.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {/* Menu Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : menus.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Menu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No menu items yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first navbar menu item to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Label (EN)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">URL</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Parent</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Order</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedMenus.map(({ item, isChild }) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isChild ? (
                          <>
                            <span className="text-gray-300 ml-4">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-gray-700">{item.label_en}</span>
                          </>
                        ) : (
                          <>
                            <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                            <span className="font-medium text-gray-900">{item.label_en}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Link2 className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{item.url}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {getParentLabel(item.parent_id)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                          item.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
                {editing ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
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
                    placeholder="e.g. Products"
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
                    placeholder="e.g. Produk"
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
                    placeholder="e.g. 產品"
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
                  placeholder="/products"
                />
              </div>

              {/* Parent Menu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Menu
                </label>
                <select
                  value={form.parent_id || ''}
                  onChange={(e) =>
                    setForm({ ...form, parent_id: e.target.value || null })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy bg-white"
                >
                  <option value="">None (Top Level)</option>
                  {topLevelMenus
                    .filter((m) => !editing || m.id !== editing.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label_en}
                      </option>
                    ))}
                </select>
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
