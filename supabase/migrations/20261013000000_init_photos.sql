-- ============================================================================
-- Nikhil Kantae portfolio — photos table, storage bucket and RLS policies
-- Run with `supabase db push`, or paste into Supabase → SQL Editor → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.photo_category as enum ('theatre', 'portfolio', 'bts');
exception when duplicate_object then null;
end $$;

create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  url           text not null,                      -- public Storage URL
  storage_path  text not null unique,               -- object key inside the bucket (for deletes)
  caption       text not null default '',
  category      public.photo_category not null default 'portfolio',
  sort_order    integer not null default 0,
  width         integer,                            -- intrinsic size, lets the masonry grid
  height        integer,                            -- reserve space before images load
  created_at    timestamptz not null default now()
);

create index if not exists photos_sort_order_idx on public.photos (sort_order, created_at);
create index if not exists photos_category_idx   on public.photos (category);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   SELECT: anyone       INSERT / UPDATE / DELETE: authenticated (the admin)
-- Sign-ups must be disabled in Supabase Auth so the admin is the only
-- authenticated user — see README.
-- ---------------------------------------------------------------------------
alter table public.photos enable row level security;

drop policy if exists "Photos are publicly viewable" on public.photos;
create policy "Photos are publicly viewable"
  on public.photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin can insert photos" on public.photos;
create policy "Admin can insert photos"
  on public.photos for insert
  to authenticated
  with check (true);

drop policy if exists "Admin can update photos" on public.photos;
create policy "Admin can update photos"
  on public.photos for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin can delete photos" on public.photos;
create policy "Admin can delete photos"
  on public.photos for delete
  to authenticated
  using (true);

-- Optional hardening: pin writes to a single email instead of "any
-- authenticated user". Replace the `true` expressions above with:
--   (auth.jwt() ->> 'email') = 'you@example.com'

-- ---------------------------------------------------------------------------
-- Storage bucket: actor-photos (public read, authenticated write/delete)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'actor-photos',
  'actor-photos',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Actor photos are publicly readable" on storage.objects;
create policy "Actor photos are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'actor-photos');

drop policy if exists "Admin can upload actor photos" on storage.objects;
create policy "Admin can upload actor photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'actor-photos');

drop policy if exists "Admin can update actor photos" on storage.objects;
create policy "Admin can update actor photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'actor-photos')
  with check (bucket_id = 'actor-photos');

drop policy if exists "Admin can delete actor photos" on storage.objects;
create policy "Admin can delete actor photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'actor-photos');
