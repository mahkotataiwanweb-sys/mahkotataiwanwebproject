'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEditableT } from '@/hooks/useEditableT';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowLeft, Calendar, X, ChevronLeft, ChevronRight, Clock, ArrowUpRight, Images as ImagesIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getLocalizedField } from '@/lib/utils';
import type { Article } from '@/types/database';

gsap.registerPlugin(ScrollTrigger);

/* ───── helpers ───── */

function formatDate(dateStr: string, locale: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(
    locale === 'zh-TW' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
}

/* ─────────────────────────────────────────────
   ArticleDetailPage
───────────────────────────────────────────── */
export default function ArticleDetailPage() {
  const { slug } = useParams();
  const locale = useLocale();
  const t = useEditableT('articles');

  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  /* scroll / parallax */
  const [readProgress, setReadProgress] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);

  /* lightbox */
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const galleryRef = useRef<HTMLDivElement>(null);

  /* ────── fetch ────── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      setArticle(data);

      if (data) {
        const { data: rel } = await supabase
          .from('articles')
          .select('*')
          .eq('type', data.type)
          .eq('is_active', true)
          .neq('id', data.id)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelated((rel as Article[]) || []);
      }
      setLoading(false);
    }
    if (slug) load();
  }, [slug]);

  /* ────── reading progress + parallax ────── */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(total > 0 ? Math.min((window.scrollY / total) * 100, 100) : 0);
      setHeroOffset(window.scrollY * 0.35);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ────── GSAP scroll animations ────── */
  useEffect(() => {
    if (!article || loading) return;
    /* small delay so DOM is painted */
    const t = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-anim]').forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 88%' },
            },
          );
        });

        if (galleryRef.current) {
          gsap.utils.toArray<HTMLElement>('[data-gal]').forEach((el, i) => {
            gsap.fromTo(
              el,
              { opacity: 0, y: 40, scale: 0.94 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.65,
                delay: i * 0.07,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 92%' },
              },
            );
          });
        }
      });
      return () => ctx.revert();
    }, 100);
    return () => clearTimeout(t);
  }, [article, loading]);

  /* ────── lightbox keyboard ────── */
  useEffect(() => {
    if (!lbOpen) return;
    const imgs = article?.gallery_images || [];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLbOpen(false);
      if (e.key === 'ArrowLeft') setLbIdx((p) => (p === 0 ? imgs.length - 1 : p - 1));
      if (e.key === 'ArrowRight') setLbIdx((p) => (p === imgs.length - 1 ? 0 : p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbOpen, article]);

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = lbOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lbOpen]);

  /* ────── loading state ────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8EE] flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-[3px] border-[#C12126] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#003048]/40 text-sm font-medium tracking-wide">{t('loading')}</span>
        </motion.div>
      </div>
    );
  }

  /* ────── 404 ────── */
  if (!article) {
    return (
      <div className="min-h-screen bg-[#FFF8EE] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-24 h-24 rounded-full bg-[#003048]/5 flex items-center justify-center">
          <span className="text-5xl">📄</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-[#003048]">{t('notFound')}</h1>
        <p className="text-[#003048]/50 max-w-sm text-center text-sm">
          {t('notFoundDescription')}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#003048] text-white rounded-full text-sm font-medium hover:bg-[#003048]/90 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t('backToHome')}
        </Link>
      </div>
    );
  }

  /* ────── derived data ────── */
  const title = getLocalizedField(article, 'title', locale);
  const content = getLocalizedField(article, 'content', locale) || '';
  const excerpt = getLocalizedField(article, 'excerpt', locale);
  const galleryImages = article.gallery_images || [];
  const date = formatDate(article.published_at, locale);
  const typeLabel = article.type === 'event' ? t('typeEvent') : article.type === 'lifestyle' ? t('typeActivity') : article.type.charAt(0).toUpperCase() + article.type.slice(1);
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  const paragraphs = content.split('\n').filter((p) => p.trim());

  const backHref =
    article.type === 'event'
      ? `/${locale}/events`
      : article.type === 'lifestyle'
        ? `/${locale}/activity`
        : `/${locale}`;
  const backLabel = article.type === 'event' ? t('backEvents') : article.type === 'lifestyle' ? t('backActivities') : t('backHome');

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <main className="min-h-screen bg-[#FFF8EE]">
      {/* ── Reading progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-[3px]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#C12126] to-[#ff4444]"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ── Floating back button ── */}
      <motion.div
        className="fixed top-5 left-5 z-[55]"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link
          href={backHref}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 backdrop-blur-lg shadow-xl border border-white/30 text-sm font-medium text-[#003048] hover:bg-white transition-all"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
      </motion.div>

      {/* ══════════════ IMMERSIVE HERO ══════════════ */}
      <section className="relative h-[55vh] sm:h-[65vh] lg:h-[78vh] overflow-hidden">
        {/* Parallax image */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${heroOffset}px) scale(${1 + heroOffset * 0.0003})` }}
        >
          {article.image_url ? (
            <Image src={article.image_url} alt={title} fill className="object-cover" priority unoptimized />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#003048] via-[#003048] to-[#001a2c]" />
          )}
        </div>

        {/* overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* decorative grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* bottom fade into cream */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FFF8EE] to-transparent" />

        {/* hero content */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-4xl mx-auto w-full px-6 pb-16 sm:pb-20 lg:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 0.68, 0, 1] }}
            >
              {/* meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="px-4 py-1.5 bg-[#C12126] text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full shadow-lg shadow-[#C12126]/30">
                  {typeLabel}
                </span>
                <span className="flex items-center gap-1.5 text-white/70 text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {date}
                </span>
                <span className="flex items-center gap-1.5 text-white/70 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {readingTime} {t('minRead')}
                </span>
              </div>

              {/* title */}
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.08] mb-5 drop-shadow-xl">
                {title}
              </h1>

              {/* accent line */}
              <motion.div
                className="h-[3px] bg-[#C12126] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════ ARTICLE CONTENT ══════════════ */}
      <article className="max-w-4xl mx-auto px-6 py-12 sm:py-16 lg:py-20">
        {/* Excerpt */}
        {excerpt && (
          <div data-anim className="mb-14 pb-10 border-b border-[#003048]/10">
            <p className="text-lg sm:text-xl lg:text-2xl text-[#003048]/65 leading-relaxed font-light italic">
              &ldquo;{excerpt}&rdquo;
            </p>
          </div>
        )}

        {/* Paragraphs — each animated on scroll */}
        <div className="space-y-6">
          {paragraphs.map((para, i) => (
            <div key={i} data-anim>
              <p className="text-[#003048]/80 leading-[1.85] text-base sm:text-lg">{para}</p>
            </div>
          ))}
        </div>

        {/* ══════════════ GALLERY ══════════════ */}
        {galleryImages.length > 0 && (
          <div className="mt-20 pt-14 border-t border-[#003048]/10" ref={galleryRef}>
            <div data-anim className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-[#C12126]/10 flex items-center justify-center">
                <ImagesIcon className="w-5 h-5 text-[#C12126]" />
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-[#003048]">{t('gallery')}</h2>
                <p className="text-[#003048]/40 text-xs mt-0.5">{galleryImages.length} {t('photos')}</p>
              </div>
            </div>

            {/* Masonry gallery */}
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {galleryImages.map((url, i) => (
                <button
                  key={i}
                  data-gal
                  onClick={() => {
                    setLbIdx(i);
                    setLbOpen(true);
                  }}
                  className="block w-full break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer relative shadow-lg shadow-[#003048]/8 hover:shadow-xl hover:shadow-[#003048]/15 transition-shadow duration-500"
                >
                  <Image
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/0 group-hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 scale-0 group-hover:scale-100">
                      <ArrowUpRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ RELATED ARTICLES ══════════════ */}
        {related.length > 0 && (
          <div className="mt-20 pt-14 border-t border-[#003048]/10">
            <div data-anim className="flex items-center justify-between mb-10">
              <h2 className="font-heading text-2xl font-bold text-[#003048]">{t('relatedArticles')}</h2>
              <Link
                href={backHref}
                className="text-sm text-[#C12126] font-semibold hover:underline flex items-center gap-1 transition"
              >
                {t('viewAll')} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((rel) => (
                <Link key={rel.id} href={`/${locale}/articles/${rel.slug}`} data-anim className="group block">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 shadow-lg shadow-[#003048]/10 ring-1 ring-[#003048]/5">
                    {rel.image_url ? (
                      <Image
                        src={rel.image_url}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#003048] to-[#001a2c]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {/* hover arrow */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/30 backdrop-blur-sm flex items-center justify-center scale-0 group-hover:scale-100 transition-all duration-300">
                      <ArrowUpRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-[#C12126] font-semibold uppercase tracking-wider mb-1.5">
                    {formatDate(rel.published_at, locale)}
                  </p>
                  <h3 className="font-heading font-bold text-[#003048] group-hover:text-[#C12126] transition-colors line-clamp-2 leading-snug">
                    {getLocalizedField(rel, 'title', locale)}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#003048]/40 line-clamp-2">
                    {getLocalizedField(rel, 'excerpt', locale)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* ══════════════ LIGHTBOX ══════════════ */}
      <AnimatePresence>
        {lbOpen && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-2xl flex items-center justify-center"
            onClick={() => setLbOpen(false)}
          >
            {/* close */}
            <button
              onClick={() => setLbOpen(false)}
              className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* counter */}
            <div className="absolute top-5 left-5 text-white/50 text-sm font-mono z-10">
              {lbIdx + 1} / {galleryImages.length}
            </div>

            {/* nav */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLbIdx((p) => (p === 0 ? galleryImages.length - 1 : p - 1));
                  }}
                  className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLbIdx((p) => (p === galleryImages.length - 1 ? 0 : p + 1));
                  }}
                  className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={lbIdx}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
                className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={galleryImages[lbIdx]}
                  alt={`Gallery ${lbIdx + 1}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
