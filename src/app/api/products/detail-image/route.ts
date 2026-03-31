import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  const admin = createAdminClient();
  const body = await request.json();
  const { product_id, detail_image_url } = body;

  if (!product_id) {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  }

  try {
    // Get product name for sync
    const { data: product } = await admin
      .from('products')
      .select('name_en')
      .eq('id', product_id)
      .single();

    // 1. Update products table
    const { error: prodErr } = await admin
      .from('products')
      .update({ detail_image_url: detail_image_url || null })
      .eq('id', product_id);
    
    if (prodErr) throw new Error(prodErr.message);

    // 2. Sync to showcase_products table
    if (product) {
      await admin
        .from('showcase_products')
        .update({ detail_image_url: detail_image_url || null })
        .eq('name', product.name_en);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
