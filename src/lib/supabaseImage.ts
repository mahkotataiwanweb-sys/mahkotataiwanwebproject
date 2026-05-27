/**
 * Returns the Supabase Storage public URL as-is.
 *
 * Previously this function rewrote URLs to use Supabase's Image
 * Transformation endpoint (/storage/v1/render/image/…) which requires
 * a Pro plan.  On the Free plan those URLs return 403, causing hero
 * images (and any other transformed images) to fail to load.
 *
 * Next.js <Image> already optimises remote images through /_next/image,
 * so an additional transformation layer is unnecessary.  For raw <img>
 * tags (GIFs, etc.) we simply serve the original file.
 *
 * If you upgrade to Supabase Pro in the future you can re-enable the
 * transformation by uncommenting the block below.
 */
export function supabaseImage(
  url: string | null | undefined,
  _opts: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {},
): string {
  if (!url) return '';

  // --- Free-plan safe: return the public URL unchanged ---
  return url;

  // --- Uncomment below if you upgrade to Supabase Pro ---
  // if (!url.includes('/storage/v1/object/public/')) return url;
  // const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  // const params = new URLSearchParams();
  // if (_opts.width) params.set('width', String(_opts.width));
  // if (_opts.height) params.set('height', String(_opts.height));
  // params.set('quality', String(_opts.quality ?? 75));
  // if (_opts.resize) params.set('resize', _opts.resize);
  // return `${base}?${params.toString()}`;
}
