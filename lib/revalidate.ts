import 'server-only';
import { revalidatePath } from 'next/cache';

/** Refresh everything built from studio data: the homepage and the generated portfolio PDF. */
export function revalidateSite() {
  revalidatePath('/');
  revalidatePath('/portfolio.pdf');
}
