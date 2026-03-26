import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');

  let query = supabase
    .from('page_content')
    .select('*')
    .order('section')
    .order('sort_order');

  if (page) {
    query = query.eq('page', page);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();

  const { data, error } = await admin
    .from('page_content')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();

  if (Array.isArray(body)) {
    const results = [];
    for (const item of body) {
      const { id, ...updateData } = item;
      const { data, error } = await admin
        .from('page_content')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      results.push(error ? { id, error: error.message } : data);
    }
    return NextResponse.json(results);
  }

  const { id, ...updateData } = body;
  const { data, error } = await admin
    .from('page_content')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const admin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const { error } = await admin
    .from('page_content')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
