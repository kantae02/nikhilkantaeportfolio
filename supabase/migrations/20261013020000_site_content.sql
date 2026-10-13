-- ============================================================================
-- Phase 2/3: editable site content, credits, videos, portfolio PDF and the
-- Stage Born backdrop picker.
-- Run with `supabase db push`, or paste into Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Featured photos: About portrait (is_profile) and Stage Born backdrop
-- ---------------------------------------------------------------------------
alter table public.photos
  add column if not exists is_profile boolean not null default false,
  add column if not exists is_stage_backdrop boolean not null default false;

create unique index if not exists photos_one_profile_idx
  on public.photos (is_profile) where is_profile;
create unique index if not exists photos_one_stage_backdrop_idx
  on public.photos (is_stage_backdrop) where is_stage_backdrop;

-- Moves a "featured" flag to one photo. SECURITY INVOKER keeps RLS in force.
create or replace function public.set_featured_photo(photo_id uuid, slot text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Clear first: the unique indexes are checked per row.
  if slot = 'profile' then
    update photos set is_profile = false where is_profile and id <> photo_id;
    update photos set is_profile = true where id = photo_id;
  elsif slot = 'stage' then
    update photos set is_stage_backdrop = false where is_stage_backdrop and id <> photo_id;
    update photos set is_stage_backdrop = true where id = photo_id;
  else
    raise exception 'Unknown slot %', slot using errcode = '22023';
  end if;
  if not found then
    raise exception 'Photo % not found', photo_id using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_featured_photo(uuid, text) from public, anon;
grant execute on function public.set_featured_photo(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Site content: one row holding the editable copy (bio, details, contact …)
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  id          smallint primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Credits: plays, films, music videos …
-- ---------------------------------------------------------------------------
create table if not exists public.credits (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  role        text not null default '',
  company     text not null default '',   -- theatre group / production house
  director    text not null default '',
  year        text not null default '',   -- free text: "2024", "2022–23"
  kind        text not null default 'theatre'
              check (kind in ('theatre', 'film', 'short_film', 'web_series', 'music_video', 'ad', 'other')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Videos: YouTube reels / clips. The first one is featured on the site.
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  youtube_id  text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  description text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS — anyone can read, only the authenticated admin can write.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['site_content', 'credits', 'videos'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "Public read" on public.%I', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);

    execute format('drop policy if exists "Admin insert" on public.%I', t);
    execute format('create policy "Admin insert" on public.%I for insert to authenticated with check (true)', t);

    execute format('drop policy if exists "Admin update" on public.%I', t);
    execute format('create policy "Admin update" on public.%I for update to authenticated using (true) with check (true)', t);

    execute format('drop policy if exists "Admin delete" on public.%I', t);
    execute format('create policy "Admin delete" on public.%I for delete to authenticated using (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for documents (the downloadable portfolio PDF)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('actor-files', 'actor-files', true, 20971520, array['application/pdf']) -- 20 MB
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Actor files are publicly readable" on storage.objects;
create policy "Actor files are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'actor-files');

drop policy if exists "Admin can upload actor files" on storage.objects;
create policy "Admin can upload actor files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'actor-files');

drop policy if exists "Admin can update actor files" on storage.objects;
create policy "Admin can update actor files"
  on storage.objects for update to authenticated
  using (bucket_id = 'actor-files') with check (bucket_id = 'actor-files');

drop policy if exists "Admin can delete actor files" on storage.objects;
create policy "Admin can delete actor files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'actor-files');

-- ---------------------------------------------------------------------------
-- Starter rows (only when the tables are empty)
-- ---------------------------------------------------------------------------
insert into public.videos (title, youtube_id, description, sort_order)
select 'Kanneeti Kathaye', 'iivB_m_1Eug', 'Full video song', 0
where not exists (select 1 from public.videos);

insert into public.credits (title, role, company, kind, sort_order)
select * from (values
  ('Kanneeti Kathaye', '', '', 'music_video', 0),
  ('Theatre plays', '', 'Samahaara Theater', 'theatre', 1)
) as seed(title, role, company, kind, sort_order)
where not exists (select 1 from public.credits);
