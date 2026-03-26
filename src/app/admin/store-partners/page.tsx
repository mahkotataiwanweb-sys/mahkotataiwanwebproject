'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { StorePartner } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload, Store, ExternalLink } from 'lucide-react';
import Image from 'next/image';

const defaultForm = {
  name: '',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: true,
};

export default function StorePartnersPage() {
  const [partners, setPartners] = useState<StorePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<StorePartner | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_partners')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) toast.error('Failed to load partners');
    else setPartners(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const openAddModal = () => {
    setEditingPartner(null);
    setForm({ ...defaultForm });
    setShowModal(true);
  };

  const openEditModal = (partner: StorePartner) => {
    setEditingPartner(partner);
    setForm({
      name: partner.name,
      logo_url: partner.logo_url || '',
      website_url: partner.website_url || '',
      sort_order: partner.sort_order,
      is_active: partner.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Partner name is required');
      return;
    }

    const payload = {
      ...form,
      logo_url: form.logo_url || null,
      website_url: form.website_url || null,
    };

    try {
      if (editingPartner) {
        const { error } = await supabase.from('store_partners').update(payload).eq('id', editingPartner.id);
        if (error) throw error;
        toast.success('Partner updated!');
      } else {
        const { error } = await supabase.from('store_partners').insert(payload);
        if (error) throw error;
        toast.success('Partner created!');
      }
      setShowModal(false);
      fetchPartners();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save partner';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;
    const { error } = await supabase.from('store_partners').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Partner deleted'); fetchPartners(); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const fileName = `store-partners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    const url = getStorageUrl('media', fileName);
    setForm({ ...form, logo_url: url });
    toast.success('Logo uploaded!');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Partners</h1>
          <p className="text-gray-500 text-sm">{partners.length} partners total</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light transition-colors">
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Partners Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No store partners yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first partner to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Logo */}
              <div className="relative h-32 bg-gray-50 flex items-center justify-center p-4">
                {partner.logo_url ? (
                  <Image src={partner.logo_url} alt={partner.name} width={120} height={80} className="object-contain max-h-full" />
                ) : (
                  <Store className="w-12 h-12 text-gray-300" />
                )}
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${partner.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Order Badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-200 text-gray-600">
                    #{partner.sort_order}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">{partner.name}</h3>
                {partner.website_url && (
                  <a href={partner.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 text-xs mt-1 truncate hover:underline">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    {partner.website_url}
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button onClick={() => openEditModal(partner)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(partner.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingPartner ? 'Edit Partner' : 'Add Partner'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div className="flex items-center gap-4">
                  {form.logo_url && (
                    <Image src={form.logo_url} alt="" width={80} height={60} className="rounded-lg object-contain bg-gray-50 p-2" />
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                    <Upload className="w-4 h-4" /> Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" required placeholder="e.g. Tokopedia" />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input type="text" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="w-20 px-2 py-1 rounded border border-gray-200 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy-light transition-colors">
                {editingPartner ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
