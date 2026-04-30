'use client';

import { useEffect, useState } from 'react';
import { Save, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { supabase } from '@/lib/supabase';
import type { CompanySettings } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminInput,
  AdminTextarea,
  AdminLabel,
  ImageUpload,
  MultilingualField,
  TranslateAllButton,
  EmptyState,
  type MultilingualValue,
} from '@/components/admin/ui';

interface FormState {
  id: string;
  company_name: string;
  tagline: MultilingualValue;
  email: string;
  email2: string;
  phone: string;
  warehouse_address: string;
  office_address: string;
  logo_url: string;
  tiktok_url: string;
  facebook_url: string;
  instagram_url: string;
  line_url: string;
}

function fromSettings(s: CompanySettings): FormState {
  return {
    id: s.id,
    company_name: s.company_name || '',
    tagline: { en: s.tagline_en || '', id: s.tagline_id || '', zh: s.tagline_zh || '' },
    email: s.email || '',
    email2: s.email2 || '',
    phone: s.phone || '',
    warehouse_address: s.warehouse_address || '',
    office_address: s.office_address || '',
    logo_url: s.logo_url || '',
    tiktok_url: s.tiktok_url || '',
    facebook_url: s.facebook_url || '',
    instagram_url: s.instagram_url || '',
    line_url: s.line_url || '',
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('company_settings').select('*').single();
      if (!error && data) setForm(fromSettings(data));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--color-admin-muted)]">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (!form) {
    return (
      <div className="admin-surface">
        <EmptyState
          title="No settings record"
          description="Run /api/setup to seed the company_settings row."
          icon={<Building2 className="w-6 h-6" />}
        />
      </div>
    );
  }

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name,
        tagline_en: form.tagline.en,
        tagline_id: form.tagline.id,
        tagline_zh: form.tagline.zh,
        email: form.email,
        email2: form.email2 || null,
        phone: form.phone,
        warehouse_address: form.warehouse_address,
        office_address: form.office_address,
        logo_url: form.logo_url || null,
        tiktok_url: form.tiktok_url || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        line_url: form.line_url || null,
      };
      const { error } = await supabase.from('company_settings').update(payload).eq('id', form.id);
      if (error) throw error;
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Company Settings"
        subtitle="Profil perusahaan, kontak, dan social media"
        actions={
          <>
            <TranslateAllButton
              fields={[{ base: 'tagline', values: form.tagline, context: 'company tagline' }]}
              onUpdate={(u) => setForm((p) => (p ? { ...p, tagline: u.tagline || p.tagline } : p))}
            />
            <AdminButton variant="primary" loading={saving} onClick={handleSave} iconLeft={<Save className="w-4 h-4" />}>
              Save changes
            </AdminButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General */}
        <div className="admin-surface p-6 lg:col-span-2">
          <h2 className="font-heading text-lg font-bold mb-4 text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">General</h2>
          <div className="space-y-5">
            <ImageUpload
              label="Logo"
              value={form.logo_url}
              onChange={(url) => update('logo_url', url)}
              folder="logo"
              variant="square"
            />
            <div>
              <AdminLabel>Company Name</AdminLabel>
              <AdminInput value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
            </div>
            <MultilingualField
              label="Tagline"
              values={form.tagline}
              onChange={(v) => update('tagline', v)}
              context="company tagline"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="admin-surface p-6">
          <h2 className="font-heading text-lg font-bold mb-4 text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">Contact</h2>
          <div className="space-y-4">
            <div>
              <AdminLabel>Phone</AdminLabel>
              <AdminInput value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+62…" />
            </div>
            <div>
              <AdminLabel>Email (primary)</AdminLabel>
              <AdminInput type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div>
              <AdminLabel>Email (secondary)</AdminLabel>
              <AdminInput type="email" value={form.email2} onChange={(e) => update('email2', e.target.value)} placeholder="optional" />
            </div>
            <div>
              <AdminLabel>Warehouse Address</AdminLabel>
              <AdminTextarea value={form.warehouse_address} onChange={(e) => update('warehouse_address', e.target.value)} rows={3} />
            </div>
            <div>
              <AdminLabel>Office Address</AdminLabel>
              <AdminTextarea value={form.office_address} onChange={(e) => update('office_address', e.target.value)} rows={3} />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="admin-surface p-6">
          <h2 className="font-heading text-lg font-bold mb-4 text-[var(--color-admin-ink)] dark:text-[var(--color-admin-ink-dark)]">Social Media</h2>
          <div className="space-y-4">
            <div>
              <AdminLabel>TikTok URL</AdminLabel>
              <AdminInput value={form.tiktok_url} onChange={(e) => update('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@…" />
            </div>
            <div>
              <AdminLabel>Facebook URL</AdminLabel>
              <AdminInput value={form.facebook_url} onChange={(e) => update('facebook_url', e.target.value)} placeholder="https://facebook.com/…" />
            </div>
            <div>
              <AdminLabel>Instagram URL</AdminLabel>
              <AdminInput value={form.instagram_url} onChange={(e) => update('instagram_url', e.target.value)} placeholder="https://instagram.com/…" />
            </div>
            <div>
              <AdminLabel>LINE URL</AdminLabel>
              <AdminInput value={form.line_url} onChange={(e) => update('line_url', e.target.value)} placeholder="https://line.me/ti/p/@…" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

