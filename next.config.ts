// Performance optimized
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  images: {
    // Serve modern formats first; the browser picks the smallest one it can decode.
    formats: ['image/avif', 'image/webp'] as ('image/avif' | 'image/webp')[],
    // Tighter widths so Next.js doesn't generate huge 3840px variants for a
    // hero that's never wider than 1920px on the live site.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 240, 300, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'bqlntkvkjhgoipelrvti.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'bqlntkvkjhgoipelrvti.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
