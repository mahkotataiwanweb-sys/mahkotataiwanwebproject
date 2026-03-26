import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  GET – Fetch all active gallery images                              */
/* ------------------------------------------------------------------ */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: false })
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST – Create a new gallery image                                  */
/* ------------------------------------------------------------------ */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.image_url || !body.event_name || !body.event_date) {
      return NextResponse.json(
        { error: 'Missing required fields: image_url, event_name, event_date' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const record = {
      image_url: body.image_url,
      event_name: body.event_name,
      event_date: body.event_date,
      description_en: body.description_en || null,
      description_id: body.description_id || null,
      description_zh: body.description_zh || null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('gallery_images')
      .insert([record])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH – Update an existing gallery image                           */
/* ------------------------------------------------------------------ */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { id, ...updates } = body;

    const { data, error } = await supabase
      .from('gallery_images')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE – Delete a gallery image                                    */
/* ------------------------------------------------------------------ */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
