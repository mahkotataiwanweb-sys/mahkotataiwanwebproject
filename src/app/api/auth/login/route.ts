import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mahkota2024';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  
  if (password === ADMIN_PASSWORD) {
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
  
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
