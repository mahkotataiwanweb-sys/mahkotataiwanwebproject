import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const session = request.cookies.get('admin_session');
    if (!session || session.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // i18n routes
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|id|zh-TW)/:path*', '/admin/:path*']
};
