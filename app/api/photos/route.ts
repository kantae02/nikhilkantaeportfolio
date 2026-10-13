import { NextResponse, type NextRequest } from 'next/server';
import { revalidateSite } from '@/lib/revalidate';
import { requireAdmin } from '@/lib/auth';
import { createSupabasePublicClient, isSupabaseConfigured, PHOTO_BUCKET } from '@/lib/supabase';
import { isCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Must match the key format UploadForm generates: <category>/<uuid>.<ext>
const STORAGE_PATH_RE = /^(theatre|portfolio|bts)\/[0-9a-f-]{36}\.(jpe?g|png|webp|avif)$/i;

/** GET /api/photos?category=theatre — public list, ordered for the gallery. */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ photos: [] });

  const category = request.nextUrl.searchParams.get('category');
  let query = createSupabasePublicClient()
    .from('photos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (category) {
    if (!isCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photos: data });
}

/**
 * POST /api/photos — register a photo the admin already uploaded to Storage.
 * The browser uploads the file directly to Supabase Storage (avoids Vercel's
 * 4.5 MB request body limit); this route records it in the table.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const storagePath = body?.storage_path;
  const caption = typeof body?.caption === 'string' ? body.caption.trim().slice(0, 300) : '';
  const category = body?.category;

  if (typeof storagePath !== 'string' || !STORAGE_PATH_RE.test(storagePath)) {
    return NextResponse.json({ error: 'Invalid storage_path' }, { status: 400 });
  }
  if (!isCategory(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  // Derive the URL server-side rather than trusting the client.
  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);

  // New photos go to the end of the gallery.
  const { data: last } = await supabase
    .from('photos')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = {
    url: publicUrl,
    storage_path: storagePath,
    caption,
    category,
    sort_order: (last?.sort_order ?? -1) + 1,
    width: positiveInt(body?.width),
    height: positiveInt(body?.height),
  };
  const insert = (values: Record<string, unknown>) => supabase.from('photos').insert(values).select().single();

  let { data, error } = await insert(body?.hidden === true ? { ...row, hidden: true } : row);
  // Before the frame/hidden migration there's no `hidden` column — upload it visible instead.
  if (error?.code === 'PGRST204' && body?.hidden === true) ({ data, error } = await insert(row));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateSite();
  return NextResponse.json({ photo: data }, { status: 201 });
}

/** PATCH /api/photos — reorder. Body: { ids: string[] } in the new display order. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 1000 ||
    !ids.every((id) => typeof id === 'string' && UUID_RE.test(id))
  ) {
    return NextResponse.json({ error: 'Body must be { ids: uuid[] }' }, { status: 400 });
  }

  const results = await Promise.all(
    ids.map((id: string, index: number) =>
      supabase.from('photos').update({ sort_order: index }).eq('id', id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  revalidateSite();
  return NextResponse.json({ ok: true });
}

function positiveInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}
