import 'server-only';
import { revalidateSite } from './revalidate';
import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from './auth';

/*
 * Route handlers shared by the admin-editable lists (credits, videos):
 *   POST   /api/<table>        create (appended to the end)
 *   PATCH  /api/<table>        reorder — { ids: uuid[] }
 *   PATCH  /api/<table>/:id    edit
 *   DELETE /api/<table>/:id    delete
 * Every write runs as the signed-in admin, so RLS applies too.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates a request body. `partial` is true for edits, where every field is optional. */
export type Sanitizer = (body: Record<string, unknown>, partial: boolean) => { data: Record<string, unknown> } | { error: string };

type Params = { params: { id: string } };

export function text(value: unknown, max: number): string | undefined {
  return typeof value === 'string' ? value.trim().slice(0, max) : undefined;
}

/** Drops keys whose value is undefined. */
export function compact(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export function collectionHandlers(table: string, sanitize: Sanitizer) {
  async function POST(request: NextRequest) {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { supabase } = auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body');
    const result = sanitize(body, false);
    if ('error' in result) return badRequest(result.error);

    const { data: last } = await supabase
      .from(table)
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from(table)
      .insert({ ...result.data, sort_order: (last?.sort_order ?? -1) + 1 })
      .select()
      .single();
    if (error) return dbError(error);

    revalidateSite();
    return NextResponse.json({ item: data }, { status: 201 });
  }

  async function PATCH(request: NextRequest) {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { supabase } = auth;

    const ids = (await request.json().catch(() => null))?.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500 || !ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
      return badRequest('Body must be { ids: uuid[] }');
    }

    const results = await Promise.all(ids.map((id: string, index: number) => supabase.from(table).update({ sort_order: index }).eq('id', id)));
    const failed = results.find((r) => r.error);
    if (failed?.error) return dbError(failed.error);

    revalidateSite();
    return NextResponse.json({ ok: true });
  }

  return { POST, PATCH };
}

export function itemHandlers(table: string, sanitize: Sanitizer) {
  async function PATCH(request: NextRequest, { params }: Params) {
    if (!UUID_RE.test(params.id)) return badRequest('Invalid id');
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { supabase } = auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return badRequest('Invalid JSON body');
    const result = sanitize(body, true);
    if ('error' in result) return badRequest(result.error);
    if (Object.keys(result.data).length === 0) return badRequest('Nothing to update');

    const { data, error } = await supabase.from(table).update(result.data).eq('id', params.id).select().maybeSingle();
    if (error) return dbError(error);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    revalidateSite();
    return NextResponse.json({ item: data });
  }

  async function DELETE(_request: NextRequest, { params }: Params) {
    if (!UUID_RE.test(params.id)) return badRequest('Invalid id');
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { supabase } = auth;

    const { data, error } = await supabase.from(table).delete().eq('id', params.id).select('id').maybeSingle();
    if (error) return dbError(error);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    revalidateSite();
    return NextResponse.json({ ok: true });
  }

  return { PATCH, DELETE };
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Turns "table doesn't exist" into a hint to run the migration. */
export function dbError(error: { code?: string; message: string }) {
  const missing = error.code === 'PGRST205' || error.code === '42P01' || error.code === 'PGRST202';
  return NextResponse.json(
    { error: missing ? 'This needs the latest database migration (supabase/migrations/…_site_content.sql).' : error.message },
    { status: missing ? 503 : 500 },
  );
}
