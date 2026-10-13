import { NextResponse, type NextRequest } from 'next/server';
import { revalidateSite } from '@/lib/revalidate';
import { requireAdmin } from '@/lib/auth';
import { dbError } from '@/lib/collection-api';
import { mergeContent } from '@/lib/content';
import { sanitizeContent } from '@/lib/sanitizers';
import type { SiteContent } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** The Profile-tab fields of saved content, normalised for comparison (image settings are edited elsewhere). */
const profileFields = (data: unknown) => {
  const { imageSettings: _ignored, ...rest } = mergeContent((data ?? {}) as Partial<SiteContent>);
  return JSON.stringify(rest);
};

/**
 * PUT /api/content — replace the editable site copy (Profile tab). Image settings are kept as they are.
 * Body: { content, base } where `base` is the version the form started from; if the saved
 * content has changed since (another tab, a script), the save is refused instead of overwriting it.
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const body = await request.json().catch(() => null);
  const result = sanitizeContent(body?.content);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });

  const { data: existing, error: readError } = await supabase.from('site_content').select('data').eq('id', 1).maybeSingle();
  if (readError) return dbError(readError);

  if (!body?.base || profileFields(body.base) !== profileFields(existing?.data)) {
    return NextResponse.json(
      { error: 'Your Profile was changed somewhere else since this page loaded. Reload the studio to get the latest version, then make your edit again.' },
      { status: 409 },
    );
  }

  const data = { ...result.data, imageSettings: existing?.data?.imageSettings };
  const { error } = await supabase.from('site_content').upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return dbError(error);

  revalidateSite();
  return NextResponse.json({ content: mergeContent(data) });
}
