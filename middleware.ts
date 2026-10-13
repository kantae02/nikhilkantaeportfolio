import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Guards every /admin/* route. Unauthenticated visitors are sent to
 * /admin/login; a signed-in admin hitting /admin or /admin/login goes
 * straight to the dashboard. Also keeps the Supabase session cookie fresh.
 *
 * API routes are protected separately via requireAdmin() in lib/auth.ts.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return isLoginPage ? NextResponse.next() : redirectTo(request, '/admin/login');
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = !!user && (!allowedEmail || user.email?.toLowerCase() === allowedEmail);

  if (!isAdmin && !isLoginPage) {
    // Signed in, but not as the admin account → tell the login page why.
    return redirectTo(request, user ? '/admin/login?denied=1' : '/admin/login', response);
  }

  if (isAdmin && (isLoginPage || pathname === '/admin')) {
    return redirectTo(request, '/admin/dashboard', response);
  }

  return response;
}

function redirectTo(request: NextRequest, path: string, carryCookiesFrom?: NextResponse) {
  const target = new URL(path, request.url);
  const redirect = NextResponse.redirect(target);
  // Preserve any refreshed auth cookies on the redirect.
  carryCookiesFrom?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
