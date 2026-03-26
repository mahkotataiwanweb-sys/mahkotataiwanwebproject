import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: text and to' },
        { status: 400 }
      );
    }

    const sourceLang = from || 'en';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      // Fallback: return original text if translation service fails
      return NextResponse.json({ translated: text });
    }

    const data = await res.json();
    const translated = data[0]?.map((s: unknown[]) => s[0]).join('') || text;

    return NextResponse.json({ translated });
  } catch {
    // Graceful fallback - return original text on any error
    try {
      const body = await request.clone().json();
      return NextResponse.json({ translated: body.text || '' });
    } catch {
      return NextResponse.json({ translated: '' });
    }
  }
}
