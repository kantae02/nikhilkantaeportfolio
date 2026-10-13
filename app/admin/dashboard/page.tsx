import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/AdminDashboard';
import { getAdminSession } from '@/lib/auth';
import { mergeContent } from '@/lib/content';
import type { Credit, Photo, SiteContent, Video } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Middleware already guards this route; re-check on the server as defence in depth.
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!isAdmin) redirect(user ? '/admin/login?denied=1' : '/admin/login');

  const ordered = (table: string) =>
    supabase.from(table).select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true });

  const [photos, content, credits, videos] = await Promise.all([
    ordered('photos'),
    supabase.from('site_content').select('data').eq('id', 1).maybeSingle(),
    ordered('credits'),
    ordered('videos'),
  ]);

  // The Profile / Credits / Videos tabs need the site_content migration.
  const migrationNeeded = [content, credits, videos].some((r) => r.error?.code === 'PGRST205');

  return (
    <AdminDashboard
      email={user?.email ?? ''}
      initialPhotos={(photos.data ?? []) as Photo[]}
      loadError={photos.error?.message ?? null}
      initialContent={mergeContent(content.data?.data as Partial<SiteContent> | undefined)}
      initialCredits={(credits.data ?? []) as Credit[]}
      initialVideos={(videos.data ?? []) as Video[]}
      migrationNeeded={migrationNeeded}
    />
  );
}
