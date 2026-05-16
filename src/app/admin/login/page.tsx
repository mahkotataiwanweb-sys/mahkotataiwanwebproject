'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Password salah. Silakan coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-[#0B1727] via-[#122438] to-[#1A2434]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--color-admin-accent)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#D4A03B] opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 sm:p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-admin-accent)] to-[#D4A03B] flex items-center justify-center mb-4 shadow-lg">
              <Image src="/images/logo.png" alt="Mahkota Taiwan" width={28} height={28} className="brightness-0" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">CMS Console</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50 mt-1.5">Mahkota Taiwan · Admin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs font-medium px-4 py-3 text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--color-admin-accent)] focus:bg-white/12 transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-[var(--color-admin-accent)] to-[#D4A03B] text-[#1A1308] font-semibold text-sm shadow-lg hover:brightness-105 transition-all disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-white/40">
            © {new Date().getFullYear()} Mahkota Taiwan · Internal use only
          </p>
        </div>
      </div>
    </div>
  );
}
