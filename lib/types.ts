export const CATEGORIES = ['theatre', 'portfolio', 'bts'] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  theatre: 'Theatre',
  portfolio: 'Portfolio',
  bts: 'Behind the Scenes',
};

export interface Photo {
  id: string;
  url: string;
  storage_path: string;
  caption: string;
  category: Category;
  sort_order: number;
  /** Featured slots (see FEATURED_SLOTS). Optional until the migrations have run. */
  is_hero?: boolean;
  is_profile?: boolean;
  is_stage_backdrop?: boolean;
  /** Kept out of the public gallery (can still be a featured image). Optional until the migration has run. */
  hidden?: boolean;
  /** Crop of the gallery tile; missing values use defaults (see galleryFrame). */
  frame?: Partial<Frame> | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

/** Photos the admin picks for specific sections of the site. */
export const FEATURED_SLOTS = {
  hero: { flag: 'is_hero', label: 'Hero image', section: 'Behind your name on the first screen', category: 'portfolio' },
  profile: { flag: 'is_profile', label: 'Profile photo', section: 'Next to your details in About', category: 'portfolio' },
  stage: { flag: 'is_stage_backdrop', label: 'Stage backdrop', section: 'Behind the Stage Born quote', category: 'theatre' },
} as const satisfies Record<string, { flag: keyof Photo; label: string; section: string; category: Category }>;

export type FeaturedSlot = keyof typeof FEATURED_SLOTS;

export function isFeaturedSlot(value: unknown): value is FeaturedSlot {
  return typeof value === 'string' && value in FEATURED_SLOTS;
}

export const CREDIT_KINDS = ['theatre', 'film', 'short_film', 'web_series', 'music_video', 'ad', 'other'] as const;

export type CreditKind = (typeof CREDIT_KINDS)[number];

export const CREDIT_KIND_LABELS: Record<CreditKind, string> = {
  theatre: 'Theatre',
  film: 'Film',
  short_film: 'Short film',
  web_series: 'Web series',
  music_video: 'Music video',
  ad: 'Commercial',
  other: 'Other',
};

export function isCreditKind(value: unknown): value is CreditKind {
  return typeof value === 'string' && (CREDIT_KINDS as readonly string[]).includes(value);
}

export interface Credit {
  id: string;
  title: string;
  role: string;
  company: string;
  director: string;
  year: string;
  kind: CreditKind;
  sort_order: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  youtube_id: string;
  description: string;
  sort_order: number;
  created_at: string;
}

/** Editable site copy, stored as one JSON row in `site_content`. */
export interface SiteContent {
  /** Hero roles, typed once as "Actor | Theater Artist | Storyteller". */
  taglines: string[];
  /** Short line that fades in under the roles. Empty hides it. */
  heroMotto: string;
  bio: string;
  details: { label: string; value: string }[];
  skills: string[];
  stageQuote: string;
  contact: { phone: string; email: string; instagram: string };
  /** Downloadable portfolio — a Supabase Storage URL or a path under /public. Empty hides the button. */
  portfolioPdfUrl: string;
  /** Framing/brightness of each featured image, set with "Adjust" in the studio. */
  imageSettings: Record<FeaturedSlot, ImageSettings>;
}

/** How a photo is cropped into its frame. Percentages; zoom is 100–300. */
export type Frame = Pick<ImageSettings, 'positionX' | 'positionY' | 'zoom'>;

/** Percentages; zoom is 100–300, everything else 0–100. */
export interface ImageSettings {
  /** Horizontal focus point: 0 = keep the left edge in view, 100 = the right. */
  positionX: number;
  /** Vertical focus point: 0 = show the top of the photo, 100 = the bottom. */
  positionY: number;
  /** 100 = fit the frame; higher crops in around the focus point. */
  zoom: number;
  /** Photo opacity over the black background — lower makes text easier to read. */
  opacity: number;
  /** Extra darkening behind the text (Stage Born only). */
  shade: number;
}
