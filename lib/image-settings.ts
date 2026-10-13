import { defaultContent } from './profile';
import { FEATURED_SLOTS, type FeaturedSlot, type Frame, type ImageSettings, type Photo } from './types';

const clamp = (value: unknown, fallback: number, min = 0, max = 100) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

export const MIN_ZOOM = 100;
export const MAX_ZOOM = 300;

/** One slot's settings, clamped to their ranges with defaults for anything missing. */
export function cleanImageSettings(slot: FeaturedSlot, value: unknown): ImageSettings {
  const d = defaultContent.imageSettings[slot];
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    positionX: clamp(v.positionX, d.positionX),
    positionY: clamp(v.positionY, d.positionY),
    zoom: clamp(v.zoom, d.zoom, MIN_ZOOM, MAX_ZOOM),
    opacity: clamp(v.opacity, d.opacity),
    shade: clamp(v.shade, d.shade),
  };
}

export function mergeImageSettings(saved: unknown): Record<FeaturedSlot, ImageSettings> {
  const s = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>;
  return Object.fromEntries(
    (Object.keys(FEATURED_SLOTS) as FeaturedSlot[]).map((slot) => [slot, cleanImageSettings(slot, s[slot])]),
  ) as Record<FeaturedSlot, ImageSettings>;
}

/** Clearly landscape photos. */
export const isWide = (p: Pick<Photo, 'width' | 'height'>) => !!p.width && !!p.height && p.width / p.height > 1.2;

/** Clamp a frame, filling gaps from `fallback`. */
export function cleanFrame(value: unknown, fallback: Frame): Frame {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    positionX: clamp(v.positionX, fallback.positionX),
    positionY: clamp(v.positionY, fallback.positionY),
    zoom: clamp(v.zoom, fallback.zoom, MIN_ZOOM, MAX_ZOOM),
  };
}

/**
 * A photo's crop in its gallery tile, as full ImageSettings so it can share the
 * framing components and the Adjust dialog. Unset photos default to keeping
 * faces in frame (top) for portraits and the centre for landscapes.
 */
export function galleryFrame(photo: Photo): ImageSettings {
  const fallback: Frame = { positionX: 50, positionY: isWide(photo) ? 50 : 0, zoom: 100 };
  return { ...cleanFrame(photo.frame, fallback), opacity: 100, shade: 0 };
}

export const defaultGalleryFrame = (photo: Photo) => galleryFrame({ ...photo, frame: null });
