import { NextResponse, type NextRequest } from 'next/server';
import { revalidateSite } from '@/lib/revalidate';
import { requireAdmin } from '@/lib/auth';
import { PHOTO_BUCKET } from '@/lib/supabase';
import { cleanFrame } from '@/lib/image-settings';
import { FEATURED_SLOTS, isCategory, isFeaturedSlot, type Photo } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Params = { params: { id: string } };

/**
 * PATCH /api/photos/:id — edit caption, category, `hidden` (keep out of the
 * gallery) and/or `frame` (gallery crop),
 * `{ featured: slot }` to use it for a section (hero / profile / stage), or
 * `{ unfeature: slot }` to stop using it there.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);

  if (body && 'unfeature' in body) {
    const slot: unknown = body.unfeature;
    if (!isFeaturedSlot(slot)) return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });
    const { error } = await supabase
      .from('photos')
      .update({ [FEATURED_SLOTS[slot].flag]: false })
      .eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateSite();
    return NextResponse.json({ ok: true });
  }

  if (body && 'featured' in body) {
    const slot: unknown = body.featured;
    if (!isFeaturedSlot(slot)) {
      return NextResponse.json({ error: "featured must be 'hero', 'profile' or 'stage'" }, { status: 400 });
    }
    let { error } = await supabase.rpc('set_featured_photo', { photo_id: params.id, slot });
    // Before the site_content migration only the profile slot exists.
    if (error?.code === 'PGRST202' && slot === 'profile') {
      ({ error } = await supabase.rpc('set_profile_photo', { photo_id: params.id }));
    }
    if (error) {
      const status = error.code === 'P0002' ? 404 : ['PGRST202', '22023', '42703'].includes(error.code) ? 503 : 500;
      const message =
        error.code === 'PGRST202' || error.code === '22023' || error.code === '42703'
          ? 'This needs the latest database migration (supabase/migrations/…_hero_photo.sql).'
          : error.message;
      return NextResponse.json({ error: message }, { status });
    }
    revalidateSite();
    return NextResponse.json({ ok: true });
  }

  const updates: Partial<Pick<Photo, 'caption' | 'category' | 'hidden' | 'frame'>> = {};

  if (body && 'caption' in body) {
    if (typeof body.caption !== 'string') {
      return NextResponse.json({ error: 'caption must be a string' }, { status: 400 });
    }
    updates.caption = body.caption.trim().slice(0, 300);
  }
  if (body && 'category' in body) {
    if (!isCategory(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    updates.category = body.category;
  }
  if (body && 'hidden' in body) {
    if (typeof body.hidden !== 'boolean') {
      return NextResponse.json({ error: 'hidden must be true or false' }, { status: 400 });
    }
    updates.hidden = body.hidden;
  }
  if (body && 'frame' in body) {
    updates.frame = cleanFrame(body.frame, { positionX: 50, positionY: 50, zoom: 100 });
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('photos')
    .update(updates)
    .eq('id', params.id)
    .select()
    .maybeSingle();

  if (error) {
    // Unknown column → the frame/hidden migration hasn't been run yet.
    const missing = error.code === 'PGRST204' || error.code === '42703';
    return NextResponse.json(
      { error: missing ? 'This needs the latest database migration (supabase/migrations/…_photo_frame_hidden.sql).' : error.message },
      { status: missing ? 503 : 500 },
    );
  }
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  revalidateSite();
  return NextResponse.json({ photo: data });
}

/** DELETE /api/photos/:id — removes the row, then the file in Storage. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const { data: photo, error } = await supabase
    .from('photos')
    .delete()
    .eq('id', params.id)
    .select('storage_path')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Row first, file second: a failed file delete leaves an orphaned object,
  // never a broken image in the gallery.
  const { error: storageError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (storageError) console.error('[photos] storage delete failed', storageError);

  revalidateSite();
  return NextResponse.json({ ok: true });
}
