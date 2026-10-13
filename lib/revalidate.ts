import 'server-only';
import { revalidatePath } from 'next/cache';

/** Refresh everything built from studio data. (/portfolio.pdf is generated per request, so it's always current.) */
export function revalidateSite() {
  revalidatePath('/');
}
