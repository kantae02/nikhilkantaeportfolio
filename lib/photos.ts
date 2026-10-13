import { createSupabasePublicClient, isSupabaseConfigured } from './supabase';
import type { Photo } from './types';

/** Public gallery read used by the homepage. Never throws — an empty gallery beats a 500. */
export async function getPublicPhotos(): Promise<Photo[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await createSupabasePublicClient()
      .from('photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Photo[];
  } catch (err) {
    console.error('[photos] failed to load gallery', err);
    return [];
  }
}
