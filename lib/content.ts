import { mergeImageSettings } from './image-settings';
import { defaultContent, defaultCredits, defaultVideos } from './profile';
import { createSupabasePublicClient, isSupabaseConfigured } from './supabase';
import type { Credit, SiteContent, Video } from './types';

/*
 * Public reads for the homepage. Like getPublicPhotos, these never throw:
 * if Supabase is unreachable or a migration hasn't run yet, the site falls
 * back to the defaults in lib/profile.ts.
 */

/** Saved content merged over the defaults, so a missing field never blanks the site. */
export function mergeContent(saved: Partial<SiteContent> | null | undefined): SiteContent {
  const s = saved ?? {};
  return {
    taglines: Array.isArray(s.taglines) && s.taglines.length > 0 ? s.taglines : defaultContent.taglines,
    heroMotto: typeof s.heroMotto === 'string' ? s.heroMotto : defaultContent.heroMotto,
    bio: typeof s.bio === 'string' ? s.bio : defaultContent.bio,
    details: Array.isArray(s.details) ? s.details : defaultContent.details,
    skills: Array.isArray(s.skills) ? s.skills : defaultContent.skills,
    stageQuote: typeof s.stageQuote === 'string' ? s.stageQuote : defaultContent.stageQuote,
    contact: { ...defaultContent.contact, ...(s.contact ?? {}) },
    portfolioPdfUrl: typeof s.portfolioPdfUrl === 'string' ? s.portfolioPdfUrl : defaultContent.portfolioPdfUrl,
    imageSettings: mergeImageSettings(s.imageSettings),
  };
}

export async function getSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured) return defaultContent;
  try {
    const { data, error } = await createSupabasePublicClient()
      .from('site_content')
      .select('data')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw error;
    return mergeContent(data?.data as Partial<SiteContent> | undefined);
  } catch (err) {
    console.error('[content] failed to load site content', err);
    return defaultContent;
  }
}

export async function getCredits(): Promise<Credit[]> {
  return listOrDefault<Credit>('credits', defaultCredits, false);
}

export async function getVideos(): Promise<Video[]> {
  return listOrDefault<Video>('videos', defaultVideos, true);
}

/**
 * Ordered rows from a table. Falls back to `fallback` when the table is
 * missing, and also when it is empty if `fallbackWhenEmpty` (the reel must
 * always have something to show; an empty credits list just hides the section).
 */
async function listOrDefault<T>(table: string, fallback: T[], fallbackWhenEmpty: boolean): Promise<T[]> {
  if (!isSupabaseConfigured) return fallback;
  try {
    const { data, error } = await createSupabasePublicClient()
      .from(table)
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as T[];
    return rows.length === 0 && fallbackWhenEmpty ? fallback : rows;
  } catch (err) {
    console.error(`[content] failed to load ${table}`, err);
    return fallback;
  }
}
