import { DEFAULT_PHOTOS } from './default-photos';
import type { Photo } from './types';

/**
 * Which photo goes where — shared by the homepage and the portfolio PDF so
 * they always match. Chosen in the studio (Photos → Featured images); until
 * then the profile/stage fall back to the first Portfolio / Theatre photo.
 */
export function resolvePhotos(uploaded: Photo[]) {
  // Until the admin uploads photos, use the ones from the profile PDF.
  const photos = uploaded.length > 0 ? uploaded : DEFAULT_PHOTOS;
  return {
    photos,
    gallery: photos.filter((p) => !p.hidden),
    portrait: photos.find((p) => p.is_profile) ?? photos.find((p) => p.category === 'portfolio') ?? photos[0],
    stagePhoto: photos.find((p) => p.is_stage_backdrop) ?? photos.find((p) => p.category === 'theatre'),
    // No fallback: without a chosen image the hero stays type-only.
    heroPhoto: photos.find((p) => p.is_hero),
  };
}
