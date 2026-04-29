import { NextRequest, NextResponse } from 'next/server';

/**
 * Auto-translate endpoint backed by Claude (Anthropic) for high-quality
 * multi-language translation across the CMS.
 *
 * Body:
 *   { text, from: 'en'|'id'|'zh', to: string|string[], context?: string }
 *
 * Response:
 *   - Single target  → { translated: string, translations: { [code]: string } }
 *   - Multi target   → { translations: { [code]: string } }
 *
 * Falls back to Google Translate if ANTHROPIC_API_KEY is missing or Claude fails.
 */

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  zh: 'Traditional Chinese (繁體中文, Taiwan)',
  'zh-TW': 'Traditional Chinese (繁體中文, Taiwan)',
};

function normalizeLang(code: string): string {
  if (code === 'zh-TW') return 'zh';
  return code;
}

async function translateWithClaude(opts: {
  text: string;
  from: string;
  targets: string[];
  context?: string;
}): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const fromName = LANG_NAMES[opts.from] || opts.from;
  const contextLine = opts.context
    ? `\nContext: This is a "${opts.context}" appearing on the Mahkota Taiwan website (an Indonesian/Taiwanese food brand). Use natural marketing tone, avoid awkward literal translations, preserve brand names and proper nouns.`
    : '\nContext: Text from the Mahkota Taiwan website (an Indonesian/Taiwanese food brand). Use natural marketing tone.';

  const userPrompt = `Translate the following text from ${fromName} into the languages below.${contextLine}

Source text:
"""
${opts.text}
"""

Output STRICT JSON only — no markdown, no commentary. Schema:
{
${opts.targets.map((t) => `  "${t}": "<translation in ${LANG_NAMES[t] || t}>"`).join(',\n')}
}

Rules:
- Preserve line breaks, punctuation, and any HTML/markdown if present.
- Do not translate brand names: "Mahkota Taiwan", "Mahkota".
- For "zh", use Traditional Chinese (繁體中文, Taiwan-style), not Simplified.
- Keep numbers and units as-is.
- Match length and tone of the source — don't pad or shorten.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.2,
      system:
        'You are a professional translator for the Mahkota Taiwan brand. You output ONLY valid JSON when asked, with no extra text. You translate carefully and idiomatically.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${errBody.slice(0, 280)}`);
  }

  const data = await res.json();
  const textBlock = (data?.content || []).find((b: { type: string }) => b.type === 'text');
  if (!textBlock?.text) throw new Error('Empty response from Claude');

  let raw = String(textBlock.text).trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Failed to parse JSON from Claude response');
    parsed = JSON.parse(match[0]);
  }

  const out: Record<string, string> = {};
  for (const t of opts.targets) {
    const v = parsed[t] ?? parsed[normalizeLang(t)];
    if (typeof v === 'string') out[t] = v;
  }
  return out;
}

async function translateWithGoogle(text: string, from: string, to: string): Promise<string> {
  const sl = normalizeLang(from);
  const tl = to === 'zh' ? 'zh-TW' : to;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) return text;
  const data = await res.json();
  return data?.[0]?.map((s: unknown[]) => s[0]).join('') || text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = (body.text || '').toString();
    const from: string = (body.from || 'en').toString();
    const context: string | undefined = body.context;

    if (!text.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }
    if (!body.to) {
      return NextResponse.json({ error: 'Missing target language(s)' }, { status: 400 });
    }

    const targets: string[] = Array.isArray(body.to) ? body.to.map(String) : [String(body.to)];
    if (targets.length === 0) {
      return NextResponse.json({ error: 'No targets provided' }, { status: 400 });
    }

    let translations: Record<string, string> = {};
    let usedFallback = false;

    try {
      translations = await translateWithClaude({ text, from, targets, context });
    } catch (err) {
      console.warn('[translate] Claude failed, falling back to Google:', err);
      usedFallback = true;
      for (const t of targets) {
        translations[t] = await translateWithGoogle(text, from, t).catch(() => text);
      }
    }

    for (const t of targets) {
      if (!translations[t]) translations[t] = text;
    }

    // Single-target shape preserved for backwards compat with old AutoTranslateButton
    if (targets.length === 1) {
      return NextResponse.json({
        translated: translations[targets[0]],
        translations,
        provider: usedFallback ? 'google' : 'claude',
      });
    }
    return NextResponse.json({
      translations,
      provider: usedFallback ? 'google' : 'claude',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Translation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
