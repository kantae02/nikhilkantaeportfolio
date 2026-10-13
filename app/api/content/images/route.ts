import { NextResponse, type NextRequest } from 'next/server';
import { revalidateSite } from '@/lib/revalidate';
import { requireAdmin } from '@/lib/auth';
import { dbError } from '@/lib/collection-api';
import { cleanImageSettings, mergeImageSettings } from '@/lib/image-settings';
import { isFeaturedSlot } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** PATCH /api/content/images — { slot, settings } saves one featured image's position/brightness/shade. */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const slot: unknown = body?.slot;
  if (!isFeaturedSlot(slot)) return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });

  const { data: existing, error: readError } = await supabase.from('site_content').select('data').eq('id', 1).maybeSingle();
  if (readError) return dbError(readError);

  const current = (existing?.data ?? {}) as Record<string, unknown>;
  const settings = cleanImageSettings(slot, body?.settings);
  const data = { ...current, imageSettings: { ...mergeImageSettings(current.imageSettings), [slot]: settings } };

  const { error } = await supabase.from('site_content').upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return dbError(error);

  revalidateSite();
  return NextResponse.json({ settings });
}
