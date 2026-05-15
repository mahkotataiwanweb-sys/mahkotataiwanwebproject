import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Hosts permitted to reach the CMS (/admin and /api/admin, /api/auth).
 * Production: only cms.mahkotatw.com.
 * Local dev: localhost / 127.0.0.1 so `npm run dev` keeps working.
 */
const CMS_HOST = 'cms.mahkotatw.com';

function isCmsHost(host: string): boolean {
  if (host === CMS_HOST) return true;
  if (host === 'localhost' || host === '127.0.0.1') return true;
  return false;
}

function isAdminAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|woff|woff2|ttf)$/i.test(pathname)
  );
}

export function middleware(request: NextRequest) {
  const rawHost = request.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase();
  const { pathname } = request.nextUrl;

  const cmsHost = isCmsHost(host);
  const adminPath = pathname.startsWith('/admin');
  const adminApiPath = pathname.startsWith('/api/admin');
  const authApiPath = pathname.startsWith('/api/auth');

  // Block admin surface on every host except the dedicated CMS subdomain.
  // Hides the CMS from the production frontend, vercel preview URL, etc.
  if (!cmsHost && (adminPath || adminApiPath || authApiPath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // On the CMS host, the public site is hidden — everything except /admin,
  // admin APIs and static assets gets routed to /admin.
  if (cmsHost) {
    if (!adminPath && !adminApiPath && !authApiPath && !pathname.startsWith('/api/') && !isAdminAsset(pathname)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Pass-through for non-admin API calls.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Admin auth gate (only ever reached on cmsHost thanks to the block above).
  if (adminPath) {
    const res = pathname === '/admin/login'
      ? NextResponse.next()
      : (() => {
          const session = request.cookies.get('admin_session');
          if (!session || session.value !== 'authenticated') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
          }
          return NextResponse.next();
        })();
    // Keep search engines out of the CMS even if a URL ever leaks.
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  }

  // Public i18n routes.
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Intercept everything except Next internals and obvious static assets.
     * The middleware itself decides which paths to actually act on.
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|map)$).*)',
  ],
};
