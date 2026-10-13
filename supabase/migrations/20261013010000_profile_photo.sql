-- ============================================================================
-- Profile photo: lets the admin pick which photo is the About-section portrait.
-- Run with `supabase db push`, or paste into Supabase → SQL Editor → Run.
-- ============================================================================

alter table public.photos
  add column if not exists is_profile boolean not null default false;

-- At most one profile photo.
create unique index if not exists photos_one_profile_idx
  on public.photos (is_profile)
  where is_profile;

-- Atomically moves the profile flag to one photo. SECURITY INVOKER, so the
-- existing RLS update policy (authenticated only) still applies.
create or replace function public.set_profile_photo(photo_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Clear first: the unique index is checked per row, so flipping both in
  -- one UPDATE could briefly see two profile photos.
  update photos set is_profile = false where is_profile and id <> photo_id;
  update photos set is_profile = true where id = photo_id;
  if not found then
    raise exception 'Photo % not found', photo_id using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.set_profile_photo(uuid) from public, anon;
grant execute on function public.set_profile_photo(uuid) to authenticated;
