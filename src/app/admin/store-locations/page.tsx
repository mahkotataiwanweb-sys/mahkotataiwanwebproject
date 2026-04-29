'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, MapPin, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

import type { StoreLocation } from '@/types/database';
import {
  AdminButton,
  AdminPageHeader,
  AdminModal,
  AdminInput,
  AdminTextarea,
  AdminLabel,
  AdminSelect,
  AdminTable,
  AdminToggle,
  StatusPill,
  EmptyState,
  type ColumnDef,
} from '@/components/admin/ui';

type StoreType = 'supermarket' | 'minimarket' | 'toko' | 'retail' | 'online';

const STORE_TYPES: { value: StoreType; label: string; pill: string }[] = [
  { value: 'supermarket', label: 'Supermarket', pill: 'admin-pill-info' },
  { value: 'minimarket', label: 'Minimarket', pill: 'admin-pill-success' },
  { value: 'toko', label: 'Toko', pill: 'admin-pill-warn' },
  { value: 'retail', label: 'Retail', pill: 'admin-pill-accent' },
  { value: 'online', label: 'Online', pill: 'admin-pill-danger' },
];

interface FormState {
  id?: string;
  name: string;
  address: string;
  city: string;
  district: string;
  contact: string;
  lat: number;
  lng: number;
  store_type: StoreType;
  is_active: boolean;
}

const emptyForm = (): FormState => ({
  name: '',
  address: '',
  city: '',
  district: '',
  contact: '',
  lat: -6.2,
  lng: 106.816666,
  store_type: 'supermarket',
  is_active: true,
});

export default function StoreLocationsPage() {
  const [items, setItems] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | StoreType>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store-locations?all=1');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      else throw new Error(data?.error || 'Failed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const cities = useMemo(() => Array.from(new Set(items.map((i) => i.city).filter(Boolean))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((s) => {
      if (filterType !== 'all' && s.store_type !== filterType) return false;
      if (filterCity !== 'all' && s.city !== filterCity) return false;
      if (q && ![s.name, s.address, s.city, s.district, s.contact].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, search, filterType, filterCity]);

  const openAdd = () => {
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (s: StoreLocation) => {
    setForm({
      id: s.id,
      name: s.name,
      address: s.address || '',
      city: s.city,
      district: s.district || '',
      contact: s.contact || '',
      lat: s.lat,
      lng: s.lng,
      store_type: s.store_type as StoreType,
      is_active: s.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.city.trim()) {
      toast.error('City is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address || null,
        city: form.city,
        district: form.district || null,
        contact: form.contact || null,
        lat: Number(form.lat),
        lng: Number(form.lng),
        store_type: form.store_type,
        is_active: form.is_active,
      };
      const res = await fetch('/api/store-locations', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.id ? { id: form.id, ...payload } : payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(form.id ? 'Updated' : 'Created');
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: StoreLocation) => {
    if (!confirm(`Delete location "${s.name}"?`)) return;
    const res = await fetch(`/api/store-locations?id=${s.id}`, { method: 'DELETE' });
    if (!res.ok) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      fetchItems();
    }
  };

  const toggleActive = async (s: StoreLocation) => {
    const res = await fetch('/api/store-locations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    if (!res.ok) toast.error('Failed');
    else setItems((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const columns: ColumnDef<StoreLocation>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (s) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{s.name}</p>
          <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)] truncate">{s.address || '—'}</p>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (s) => (
        <div>
          <p className="text-sm">{s.city || '—'}</p>
          {s.district && <p className="text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">{s.district}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (s) => {
        const t = STORE_TYPES.find((x) => x.value === s.store_type);
        return <span className={`admin-pill ${t?.pill || 'admin-pill-neutral'} capitalize`}>{s.store_type}</span>;
      },
    },
    {
      key: 'coords',
      label: 'Coordinates',
      render: (s) => (
        <a
          href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-admin-accent)] hover:underline inline-flex items-center gap-1 font-mono"
          title="Open in Google Maps"
        >
          {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    { key: 'status', label: 'Status', render: (s) => <StatusPill active={s.is_active} onClick={() => toggleActive(s)} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(s)} className="admin-btn-icon admin-btn-icon-edit" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(s)} className="admin-btn-icon admin-btn-icon-delete" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Store Locations"
        subtitle={`${items.length} locations · ${cities.length} cities · ${items.filter((s) => s.is_active).length} active`}
        actions={
          <AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>
            Add Location
          </AdminButton>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="admin-search-wrap">
          <Search className="w-4 h-4 admin-search-icon" />
          <AdminInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
        </div>
        <AdminSelect value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | StoreType)}>
          <option value="all">All types</option>
          {STORE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </AdminSelect>
        <AdminSelect value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </AdminSelect>
      </div>

      <AdminTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            title="No store locations"
            description="Add stores to display on the Where to Buy map."
            icon={<MapPin className="w-6 h-6" />}
            action={<AdminButton variant="accent" iconLeft={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Location</AdminButton>}
          />
        }
      />

      <AdminModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={form.id ? 'Edit Store Location' : 'Add Store Location'}
        size="lg"
        footer={
          <>
            <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>{form.id ? 'Save changes' : 'Create'}</AdminButton>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <AdminLabel required>Store Name</AdminLabel>
            <AdminInput value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Indomaret Sudirman" />
          </div>
          <div>
            <AdminLabel>Address</AdminLabel>
            <AdminTextarea value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel required>City</AdminLabel>
              <AdminInput value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="e.g. Jakarta" />
            </div>
            <div>
              <AdminLabel>District</AdminLabel>
              <AdminInput value={form.district} onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))} placeholder="e.g. Tanah Abang" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Contact</AdminLabel>
              <AdminInput value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} placeholder="phone or note" />
            </div>
            <div>
              <AdminLabel>Type</AdminLabel>
              <AdminSelect value={form.store_type} onChange={(e) => setForm((p) => ({ ...p, store_type: e.target.value as StoreType }))}>
                {STORE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </AdminSelect>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <AdminLabel>Latitude</AdminLabel>
              <AdminInput
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((p) => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                placeholder="-6.2"
              />
            </div>
            <div>
              <AdminLabel>Longitude</AdminLabel>
              <AdminInput
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((p) => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                placeholder="106.816"
              />
            </div>
          </div>
          <div className="rounded-xl bg-[var(--color-admin-surface-2)] dark:bg-[var(--color-admin-surface-2-dark)] border border-[var(--color-admin-border)] dark:border-[var(--color-admin-border-dark)] p-3 text-xs text-[var(--color-admin-muted)] dark:text-[var(--color-admin-muted-dark)]">
            💡 To get coordinates, search the address on{' '}
            <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-[var(--color-admin-accent)] underline">
              Google Maps
            </a>
            , right-click the location, and copy the lat,lng pair.
          </div>
          <AdminToggle checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="Active (visible on map)" />
        </div>
      </AdminModal>
    </div>
  );
}
