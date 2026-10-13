import type { Photo } from './types';

/**
 * Photos from the actor profile PDF, bundled in /public/images.
 * The homepage shows these until photos are uploaded through the admin studio.
 * Order matters: the first Portfolio photo is the About portrait and the
 * first Theatre photo is the Stage Born backdrop.
 */
const photo = (
  id: string,
  caption: string,
  category: Photo['category'],
  width: number,
  height: number,
  sort_order: number,
): Photo => ({
  id: `default-${id}`,
  url: `/images/${id}.jpg`,
  storage_path: '',
  caption,
  category,
  sort_order,
  width,
  height,
  created_at: '2026-10-13T00:00:00Z',
});

export const DEFAULT_PHOTOS: Photo[] = [
  photo('headshot', 'Headshot', 'portfolio', 376, 532, 0),
  photo('stage-born', 'Samahaara Theater', 'theatre', 797, 408, 1),
  photo('the-smile', 'The Smile', 'portfolio', 340, 490, 2),
  photo('the-warrior', 'The Warrior', 'portfolio', 187, 459, 3),
  photo('the-intense', 'The Intense', 'portfolio', 187, 459, 4),
  photo('the-sage', 'The Sage', 'theatre', 187, 459, 5),
];
