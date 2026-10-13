import type { Credit, SiteContent, Video } from './types';

/** Fixed identity — used in the hero, footer and page metadata. */
export const profile = {
  firstName: 'NIKHIL',
  lastName: 'KANTAE',
  fullName: 'Nikhil Kantae',
  role: 'Actor',
};

/**
 * Starting copy for everything editable in the studio (Profile tab).
 * The site shows this until the admin saves their own version, and fills
 * any field the saved version is missing. Empty strings are hidden.
 */
export const defaultContent: SiteContent = {
  // Hero line under the name, typed once: "Actor | Theater Artist | Storyteller".
  taglines: ['Actor', 'Theater Artist', 'Storyteller'],
  heroMotto: 'Every role, a new life.',

  bio: 'Stage-trained at Samahaara Theater. Disciplined craft, emotional depth and physical commitment to every role — and ready for the big screen.',

  details: [
    { label: 'Name', value: 'Nikhil Kantae' },
    { label: 'Age', value: '28' },
    { label: 'Playing age', value: '' },
    { label: 'Height', value: "5' 10\"" },
    { label: 'Education', value: 'B.Tech' },
    { label: 'Languages', value: 'Telugu, Hindi & English' },
    { label: 'Based in', value: '' },
  ],

  skills: [],

  stageQuote:
    'With a strong foundation in stage performance through Samahaara Theater, I bring disciplined craft, emotional depth, and physical commitment to every role. Theater taught me to hold a room — film is the next stage.',

  contact: {
    phone: '+91 81434 94582',
    email: 'nikhilesh.mern@gmail.com',
    instagram: 'nikhil.kantae',
  },

  // Generated from the site's own content and photos (app/portfolio.pdf/route.ts).
  portfolioPdfUrl: '/portfolio.pdf',

  imageSettings: {
    hero: { positionX: 50, positionY: 20, zoom: 100, opacity: 85, shade: 0 },
    profile: { positionX: 50, positionY: 0, zoom: 100, opacity: 100, shade: 0 },
    stage: { positionX: 50, positionY: 8, zoom: 100, opacity: 60, shade: 40 },
  },
};

/** Shown until the videos table exists / has rows. */
export const defaultVideos: Video[] = [
  {
    id: 'default-kanneeti-kathaye',
    title: 'Kanneeti Kathaye',
    youtube_id: 'iivB_m_1Eug',
    description: 'Full video song',
    sort_order: 0,
    created_at: '2026-10-13T00:00:00Z',
  },
];

/** Shown until the credits table exists. */
export const defaultCredits: Credit[] = [
  { id: 'default-kk', title: 'Kanneeti Kathaye', role: '', company: '', director: '', year: '', kind: 'music_video', sort_order: 0, created_at: '2026-10-13T00:00:00Z' },
  { id: 'default-samahaara', title: 'Theatre plays', role: '', company: 'Samahaara Theater', director: '', year: '', kind: 'theatre', sort_order: 1, created_at: '2026-10-13T00:00:00Z' },
];

export const instagramUrl = (handle: string) => `https://instagram.com/${handle.replace(/^@/, '')}`;
export const youtubeUrl = (id: string) => `https://youtu.be/${id}`;
