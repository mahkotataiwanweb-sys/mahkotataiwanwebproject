import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// bcryptjs needs Node APIs — keep this route off the Edge runtime.
export const runtime = 'nodejs';

/**
 * Default fallback hash: bcrypt of "mahkota168" (cost 10).
 * Set ADMIN_PASSWORD_HASH in env (Vercel) to override.
 * If the env var still holds a legacy plaintext password (compatibility
 * window during migration), we fall back to a constant-time string compare.
 */
const DEFAULT_HASH = '$2b$10$TwE8BAOJHzVBNtKqj50CAuXYvT5f4vu0coOq9.DXxGkZWiZU36DT.';

function isBcryptHash(s: string): boolean {
  return /^\$2[aby]?\$\d{1,2}\$.{53}$/.test(s);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const password = String(body.password ?? '');
  if (!password) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const secret = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || DEFAULT_HASH;

  let ok = false;
  if (isBcryptHash(secret)) {
    try {
      ok = await bcrypt.compare(password, secret);
    } catch {
      ok = false;
    }
  } else {
    // Legacy plaintext path — kept ONLY so a deploy that still has the old
    // ADMIN_PASSWORD env var doesn't lock the operator out. Once env is
    // migrated to ADMIN_PASSWORD_HASH this branch is unreachable.
    ok = timingSafeEqual(password, secret);
  }

  if (!ok) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}
