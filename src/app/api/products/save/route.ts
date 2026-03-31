import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();
  const { id, ...payload } = body;

  try {
    if (id) {
      // Update existing product
      const { data, error } = await admin
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);

      // Also sync detail_image_url to showcase_products
      if (payload.detail_image_url !== undefined && data) {
        await admin
          .from('showcase_products')
          .update({ detail_image_url: payload.detail_image_url || null })
          .eq('name', data.name_en);
      }

      return NextResponse.json(data);
    } else {
      // Insert new product
      const { data, error } = await admin
        .from('products')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return NextResponse.json(data);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
