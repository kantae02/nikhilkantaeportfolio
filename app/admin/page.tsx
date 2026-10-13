import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Middleware normally handles this; kept as a server-side fallback.
export default async function AdminIndex() {
  const { isAdmin } = await getAdminSession();
  redirect(isAdmin ? '/admin/dashboard' : '/admin/login');
}
