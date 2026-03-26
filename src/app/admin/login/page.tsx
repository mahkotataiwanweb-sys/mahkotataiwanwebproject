'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
        setError('Invalid password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <Image src="/images/logo.png" alt="Mahkota Taiwan" width={60} height={60} className="mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold text-navy">Admin Dashboard</h1>
            <p className="text-navy/50 text-sm mt-1">Enter password to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red/10 text-red text-sm p-3 rounded-lg text-center">{error}</div>
            )}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border-2 border-navy/10 bg-cream/50 text-navy placeholder-navy/30 focus:border-red focus:outline-none transition-colors"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-navy text-white rounded-xl font-semibold text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
