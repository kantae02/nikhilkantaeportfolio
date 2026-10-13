import 'server-only';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabase-server';

/** If ADMIN_EMAIL is set, only that account counts as the admin. */
export function isAllowedAdmin(user: User | null): user is User {
  if (!user) return false;
  const allowed = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !allowed || user.email?.toLowerCase() === allowed;
}

/** Returns the verified admin user (or null) plus a session-bound client. */
export async function getAdminSession() {
  const supabase = createSupabaseServerClient();
  // getUser() validates the JWT with Supabase — never trust getSession() on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user, isAdmin: isAllowedAdmin(user) };
}

/** Guard for API routes. Returns either a client to use, or a 401 response. */
export async function requireAdmin() {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }
  return { supabase, user: user as User } as const;
}
