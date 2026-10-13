import { compact, text, type Sanitizer } from './collection-api';
import { isCreditKind, type SiteContent } from './types';
import { isYouTubeId } from './youtube';
import { FILE_BUCKET } from './supabase';

export const sanitizeCredit: Sanitizer = (body, partial) => {
  const title = text(body.title, 200);
  if (!partial && !title) return { error: 'Title is required' };
  if (partial && title === '') return { error: 'Title cannot be empty' };
  if (body.kind !== undefined && !isCreditKind(body.kind)) return { error: 'Invalid kind' };

  return {
    data: compact({
      title,
      role: text(body.role, 200),
      company: text(body.company, 200),
      director: text(body.director, 200),
      year: text(body.year, 20),
      kind: body.kind,
    }),
  };
};

export const sanitizeVideo: Sanitizer = (body, partial) => {
  const title = text(body.title, 200);
  if (!partial && !title) return { error: 'Title is required' };
  if (partial && title === '') return { error: 'Title cannot be empty' };
  if ((!partial || body.youtube_id !== undefined) && !isYouTubeId(body.youtube_id)) {
    return { error: 'Invalid YouTube video id' };
  }

  return {
    data: compact({
      title,
      youtube_id: body.youtube_id,
      description: text(body.description, 500),
    }),
  };
};

const strings = (value: unknown, maxItems: number, maxLength: number) =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : null;

/** Only our own files: a path under /public, or a public object in the actor-files bucket. */
function isAllowedPdfUrl(value: string) {
  if (value === '') return true;
  if (value.startsWith('/') && !value.startsWith('//')) return /^\/[\w./-]+\.pdf$/i.test(value);
  try {
    const url = new URL(value);
    const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
    return (
      url.origin === supabase.origin &&
      url.pathname.startsWith(`/storage/v1/object/public/${FILE_BUCKET}/`) &&
      url.pathname.toLowerCase().endsWith('.pdf')
    );
  } catch {
    return false;
  }
}

/**
 * Validates the Profile-tab payload. Image settings are saved separately
 * (PATCH /api/content/images), so they're not part of this.
 */
export function sanitizeContent(body: unknown): { data: Omit<SiteContent, 'imageSettings'> } | { error: string } {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body' };
  const b = body as Record<string, unknown>;

  const taglines = strings(b.taglines, 10, 80);
  const skills = strings(b.skills, 40, 60);
  if (!taglines || taglines.length === 0) return { error: 'Add at least one tagline' };
  if (!skills) return { error: 'skills must be a list' };

  if (!Array.isArray(b.details)) return { error: 'details must be a list' };
  const details = b.details
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
    .map((d) => ({ label: text(d.label, 40) ?? '', value: text(d.value, 200) ?? '' }))
    .filter((d) => d.label)
    .slice(0, 20);

  const contact = (b.contact ?? {}) as Record<string, unknown>;
  const pdf = text(b.portfolioPdfUrl, 500) ?? '';
  if (!isAllowedPdfUrl(pdf)) return { error: 'Invalid portfolio PDF link' };

  return {
    data: {
      taglines,
      heroMotto: text(b.heroMotto, 80) ?? '',
      bio: text(b.bio, 2000) ?? '',
      details,
      skills,
      stageQuote: text(b.stageQuote, 600) ?? '',
      contact: {
        phone: text(contact.phone, 40) ?? '',
        email: text(contact.email, 200) ?? '',
        instagram: (text(contact.instagram, 60) ?? '').replace(/^@/, ''),
      },
      portfolioPdfUrl: pdf,
    },
  };
}
