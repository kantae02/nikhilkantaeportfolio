-- ============================================================================
-- Hero image: lets the admin pick the photo behind the name on the first screen.
-- Run with `supabase db push`, or paste into Supabase → SQL Editor → Run.
-- Safe to run more than once. Needs 20261013020000_site_content.sql first.
-- ============================================================================

alter table public.photos
  add column if not exists is_hero boolean not null default false;

create unique index if not exists photos_one_hero_idx
  on public.photos (is_hero) where is_hero;

-- Same as before, plus the 'hero' slot.
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
  elsif slot = 'hero' then
    update photos set is_hero = false where is_hero and id <> photo_id;
    update photos set is_hero = true where id = photo_id;
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
