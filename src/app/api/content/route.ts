import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  let query = supabase.from('site_content').select('*').order('section').order('key');
  if (section) query = query.eq('section', section);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();

  if (Array.isArray(body)) {
    const results = [];
    for (const item of body) {
      const { id, ...updateData } = item;
      const { data, error } = await admin.from('site_content').update(updateData as any).eq('id', id).select().single();
      results.push(error ? { id, error: error.message } : data);
    }
    return NextResponse.json(results);
  }

  const { id, ...updateData } = body;
  const { data, error } = await admin.from('site_content').update(updateData as any).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
