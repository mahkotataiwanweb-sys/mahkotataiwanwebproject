'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Article } from '@/types/database';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface RelatedArticle {
  id: string;
  title_en: string;
  title_id: string;
  title_zh: string;
  slug: string;
  image_url: string | null;
  type: string;
  published_at: string;
  excerpt_en: string;
  excerpt_id: string;
  excerpt_zh: string;
}

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const locale = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getField = useCallback((field: string, item?: Record<string, unknown>): string => {
    const source: Record<string, unknown> = (item || article || {}) as Record<string, unknown>;
    if (!source) return '';
    const key = locale === 'zh-TW' ? `${field}_zh` : locale === 'id' ? `${field}_id` : `${field}_en`;
    return (source[key] as string) || (source[`${field}_en`] as string) || '';
  }, [article, locale]);

  useEffect(() => {
    async function fetchArticle() {
      setLoading(true);
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      setArticle(data);

      // Fetch related articles of the same type
      if (data) {
        const { data: related } = await supabase
          .from('articles')
          .select('id, title_en, title_id, title_zh, slug, image_url, type, published_at, excerpt_en, excerpt_id, excerpt_zh')
          .eq('type', data.type)
          .eq('is_active', true)
          .neq('id', data.id)
          .order('published_at', { ascending: false })
          .limit(3);
        setRelatedArticles((related as RelatedArticle[]) || []);
      }

      setLoading(false);
    }
    if (slug) fetchArticle();
  }, [slug]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const images = article?.gallery_images || [];
    if (direction === 'prev') {
      setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
      if (e.key === 'ArrowRight') navigateLightbox('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Article Not Found</h1>
        <p className="text-gray-500">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  const title = getField('title');
  const content = getField('content');
  const excerpt = getField('excerpt');
  const description = getField('description');
  const galleryImages = article.gallery_images || [];
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString(
        locale === 'zh-TW' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      )
    : '';

  const typeLabel = article.type.charAt(0).toUpperCase() + article.type.slice(1);

  // Render content paragraphs with line breaks
  const renderContent = (text: string) => {
    if (!text) return null;
    return text.split('\n').filter(p => p.trim()).map((paragraph, i) => (
      <p key={i} className="text-gray-700 leading-relaxed text-base sm:text-lg">
        {paragraph}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px]">
        {article.image_url ? (
          <>
            <Image
              src={article.image_url}
              alt={title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#1a3a5c]" />
        )}

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20">
                {typeLabel}
              </span>
              {publishedDate && (
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  {publishedDate}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-white/80 text-base sm:text-lg max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Back Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Excerpt / Lead */}
        {excerpt && (
          <div className="mb-8 pb-8 border-b border-gray-200">
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-light italic">
              {excerpt}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="prose prose-lg max-w-none space-y-4">
          {renderContent(content)}
        </div>

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5 text-navy" />
              Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {galleryImages.map((url, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(index)}
                  className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                >
                  <Image
                    src={url}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/${locale}/articles/${related.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {related.image_url ? (
                      <Image
                        src={related.image_url}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#1a3a5c] flex items-center justify-center">
                        <span className="text-white/40 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-navy transition-colors line-clamp-2 text-sm">
                    {getField('title', related as unknown as Record<string, unknown>)}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {related.published_at
                      ? new Date(related.published_at).toLocaleDateString(
                          locale === 'zh-TW' ? 'zh-TW' : locale === 'id' ? 'id-ID' : 'en-US',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )
                      : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Lightbox */}
      {lightboxOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {galleryImages.length}
          </div>

          {/* Navigation */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <Image
              src={galleryImages[lightboxIndex]}
              alt={`Gallery image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
