/**
 * Wraps a Supabase Storage public URL with Supabase's image
 * transformation endpoint so the file is resized + recompressed at the
 * origin. Drastically reduces egress vs. serving the original.
 *
 *   Input :  https://<project>.supabase.co/storage/v1/object/public/media/foo.png
 *   Output:  https://<project>.supabase.co/storage/v1/render/image/public/media/foo.png?width=W&quality=Q
 *
 * If the URL is not a Supabase storage URL, or already a transformation
 * URL, returns it unchanged.
 */
export function supabaseImage(
  url: string | null | undefined,
  opts: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {},
): string {
  if (!url) return '';
  if (!url.includes('/storage/v1/object/public/')) return url;
  const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const params = new URLSearchParams();
  if (opts.width) params.set('width', String(opts.width));
  if (opts.height) params.set('height', String(opts.height));
  params.set('quality', String(opts.quality ?? 75));
  if (opts.resize) params.set('resize', opts.resize);
  return `${base}?${params.toString()}`;
}
