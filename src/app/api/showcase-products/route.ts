import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('showcase_products')
    .select('*')
    .order('category')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();

  const { data, error } = await admin
    .from('showcase_products')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();
  const { id, ...updates } = body;

  updates.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from('showcase_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync detail_image_url back to products table
  if (data && updates.detail_image_url !== undefined) {
    await admin
      .from('products')
      .update({ detail_image_url: updates.detail_image_url || null })
      .eq('name_en', data.name);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const { error } = await admin.from('showcase_products').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
