'use client';

import { useEffect, useState } from 'react';
import { supabase, getStorageUrl } from '@/lib/supabase';
import { CompanySettings } from '@/types/database';
import toast from 'react-hot-toast';
import { Save, Upload, Building2 } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase.from('company_settings').select('*').single();
      if (!error && data) setSettings(data);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { id, created_at, updated_at, ...updateData } = settings;
    void id; void created_at; void updated_at;
    const { error } = await supabase.from('company_settings').update(updateData as any).eq('id', settings.id);
    if (error) toast.error('Failed to save');
    else toast.success('Settings saved!');
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    const fileName = `logo/${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('media').upload(fileName, file);
    if (error) { toast.error('Upload failed'); return; }
    setSettings({ ...settings, logo_url: getStorageUrl('media', fileName) });
    toast.success('Logo uploaded!');
  };

  const update = (field: string, value: string) => {
    if (settings) setSettings({ ...settings, [field]: value });
  };

  if (loading) return <div className="text-gray-400 text-center py-12">Loading...</div>;
  if (!settings) return (
    <div className="text-gray-400 text-center py-12">
      <Building2 className="w-12 h-12 mx-auto mb-3" />
      <p>No settings found. Run setup first.</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Company information &amp; social media</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy-light disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <div className="flex items-center gap-4">
                {settings.logo_url && <Image src={settings.logo_url} alt="" width={48} height={48} className="rounded-lg" />}
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
                  <Upload className="w-4 h-4" /> Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" value={settings.company_name} onChange={(e) => update('company_name', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (EN)</label>
                <input type="text" value={settings.tagline_en} onChange={(e) => update('tagline_en', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (ID)</label>
                <input type="text" value={settings.tagline_id} onChange={(e) => update('tagline_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline (中文)</label>
                <input type="text" value={settings.tagline_zh} onChange={(e) => update('tagline_zh', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={settings.phone} onChange={(e) => update('phone', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Address</label>
              <textarea value={settings.warehouse_address} onChange={(e) => update('warehouse_address', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Address</label>
              <textarea value={settings.office_address} onChange={(e) => update('office_address', e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-navy" />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Social Media</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TikTok URL</label>
              <input type="url" value={settings.tiktok_url || ''} onChange={(e) => update('tiktok_url', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <input type="url" value={settings.facebook_url || ''} onChange={(e) => update('facebook_url', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <input type="url" value={settings.instagram_url || ''} onChange={(e) => update('instagram_url', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-navy" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
