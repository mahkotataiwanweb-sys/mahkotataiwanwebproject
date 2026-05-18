'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react';

/* ─── floating particle component ─── */
function Particle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: -20,
        background: 'radial-gradient(circle, rgba(212,160,59,0.6) 0%, rgba(212,160,59,0) 70%)',
      }}
      animate={{
        y: [0, -800],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.3],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

/* ─── crown sparkle effect ─── */
function Sparkle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-amber-300"
      style={{ left: '50%', top: '50%' }}
      animate={{
        x: [0, x],
        y: [0, y],
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

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

  const particles = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 0.5,
    x: Math.random() * 100,
    size: 4 + Math.random() * 8,
  }));

  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.3,
    angle: i * 45,
    distance: 60 + Math.random() * 30,
  }));

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#0B1120]">
      {/* ── animated background ── */}
      <div className="absolute inset-0">
        {/* gradient orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(185,28,28,0.15) 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(212,160,59,0.12) 0%, transparent 70%)',
            bottom: '-10%',
            right: '-10%',
          }}
          animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(185,28,28,0.08) 0%, transparent 70%)',
            top: '40%',
            right: '20%',
          }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* floating particles */}
        {particles.map((p, i) => (
          <Particle key={i} {...p} />
        ))}
      </div>

      {/* ── splash / loading screen ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1120]"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          >
            <div className="relative">
              {/* sparkles around logo */}
              {sparkles.map((s, i) => (
                <Sparkle key={i} {...s} />
              ))}

              {/* glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(185,28,28,0.3) 0%, transparent 60%)',
                  transform: 'scale(2)',
                }}
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1.8, 2.2, 1.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* logo */}
              <motion.div
                className="relative w-36 h-36 sm:w-44 sm:h-44"
                initial={{ scale: 0.3, opacity: 0, rotateY: -180 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Mahkota Taiwan"
                  width={176}
                  height={176}
                  priority
                  className="relative z-10 drop-shadow-[0_0_40px_rgba(185,28,28,0.4)]"
                />
              </motion.div>
            </div>

            {/* loading bar */}
            <motion.div
              className="mt-8 h-[3px] rounded-full overflow-hidden bg-white/10"
              style={{ width: 160 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #B91C1C, #D4A03B, #B91C1C)',
                  backgroundSize: '200% 100%',
                }}
                initial={{ width: '0%' }}
                animate={{ width: '100%', backgroundPosition: ['0% 0%', '100% 0%'] }}
                transition={{ width: { duration: 2, ease: 'easeInOut' }, backgroundPosition: { duration: 1.5, repeat: Infinity } }}
              />
            </motion.div>

            <motion.p
              className="mt-4 text-[11px] uppercase tracking-[0.3em] text-white/40 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Loading Console
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── login form ── */}
      <motion.div
        className="relative z-10 min-h-screen flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="w-full max-w-[420px]">
          {/* logo + title */}
          <motion.div
            className="flex flex-col items-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: showSplash ? 20 : 0, opacity: showSplash ? 0 : 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative mb-5">
              {/* outer glow */}
              <div className="absolute inset-0 rounded-full bg-red-700/20 blur-2xl scale-150" />
              <motion.div
                className="relative w-20 h-20"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Mahkota Taiwan"
                  width={80}
                  height={80}
                  className="drop-shadow-[0_0_20px_rgba(185,28,28,0.3)]"
                />
              </motion.div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              CMS Console
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
              <p className="text-[11px] uppercase tracking-[0.25em] text-amber-400/60 font-medium">
                Mahkota Taiwan
              </p>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </motion.div>

          {/* card */}
          <motion.div
            className="rounded-3xl border border-white/[0.08] p-8 sm:p-10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: showSplash ? 30 : 0, opacity: showSplash ? 0 : 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium px-4 py-3 text-center backdrop-blur-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-700/20 to-amber-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity blur-xl" />
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin"
                      className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-700/50 focus:bg-white/[0.08] transition-all duration-300"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 rounded-2xl font-semibold text-sm shadow-lg overflow-hidden disabled:opacity-60 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #B91C1C 0%, #991B1B 50%, #7F1D1D 100%)',
                  color: '#fff',
                }}
                whileHover={{ scale: 1.01, boxShadow: '0 10px 40px rgba(185,28,28,0.3)' }}
                whileTap={{ scale: 0.99 }}
              >
                {/* shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Signing in…' : 'Sign In'}
                </span>
              </motion.button>
            </form>
          </motion.div>

          {/* footer */}
          <motion.p
            className="mt-6 text-center text-[10px] text-white/25 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: showSplash ? 0 : 1 }}
            transition={{ delay: 0.6 }}
          >
            © {new Date().getFullYear()} Mahkota Taiwan · Internal use only
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
