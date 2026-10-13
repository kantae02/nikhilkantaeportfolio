import { createSupabaseBrowserClient, PHOTO_BUCKET } from './supabase';
import type { Category, Photo } from './types';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // matches the bucket's file_size_limit

/** Why a file can't be uploaded, or null if it's fine. */
export function checkImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'unsupported type (use JPG, PNG, WebP or AVIF)';
  if (file.size > MAX_IMAGE_BYTES) return 'larger than 10 MB';
  return null;
}

/**
 * Browser-side upload used by the studio: file straight to Supabase Storage
 * (bypasses Vercel's body-size limit), then registered via POST /api/photos.
 */
export async function uploadPhoto(file: File, opts: { caption: string; category: Category; hidden?: boolean }): Promise<Photo> {
  const supabase = createSupabaseBrowserClient();
  const preview = URL.createObjectURL(file);
  const { width, height } = await readImageSize(preview);
  URL.revokeObjectURL(preview);

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const storagePath = `${opts.category}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, { cacheControl: '31536000', contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const res = await fetch('/api/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storage_path: storagePath, caption: opts.caption, category: opts.category, width, height, hidden: opts.hidden }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]); // don't leave an orphan
    throw new Error(json.error ?? `Upload failed (${res.status})`);
  }
  return json.photo as Photo;
}

export function readImageSize(src: string): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: null, height: null });
    img.src = src;
  });
}
