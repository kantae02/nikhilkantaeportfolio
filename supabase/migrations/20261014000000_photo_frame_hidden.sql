-- ============================================================================
-- Gallery framing + hide from gallery.
--   frame  — per-photo crop for the gallery tile: {"positionX", "positionY", "zoom"}
--   hidden — keep a photo out of "Frames & moments" while still letting it be
--            used as the hero image, profile photo or stage backdrop.
-- Run with `supabase db push`, or paste into Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ============================================================================

alter table public.photos
  add column if not exists frame jsonb not null default '{}'::jsonb,
  add column if not exists hidden boolean not null default false;
