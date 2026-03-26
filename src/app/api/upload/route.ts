import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, getStorageUrl } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const folder = (formData.get('folder') as string) || 'uploads';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from('media').upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = getStorageUrl('media', fileName);
  return NextResponse.json({ url, path: fileName });
}
