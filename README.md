# Nikhil Kantae — Actor Portfolio

A cinematic, dark portfolio site with a private admin studio for managing the photo gallery.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (Postgres, Storage, Auth) · Vercel

```
app/
  page.tsx                  Public homepage (ISR, revalidated on every admin change)
  admin/                    Admin studio — guarded by middleware.ts
    login/  dashboard/
  api/photos/route.ts       GET (public list) · POST (register upload) · PATCH (reorder)
  api/photos/[id]/route.ts  PATCH (caption / category) · DELETE
components/                 Hero, About, Reel, Gallery, GalleryLightbox, StageBorn, Contact,
                            Footer, Navbar, CustomCursor, AdminDashboard, AdminPhotoGrid, UploadForm …
lib/
  profile.ts                ← All site copy & contact details. Edit this first.
  supabase.ts               Browser + public (anon) clients
  supabase-server.ts        Cookie-aware server client
  auth.ts                   Admin session helpers / API guard
middleware.ts               Protects /admin/*
supabase/migrations/        SQL schema, storage bucket and RLS policies
```

---

## 1. Install

```bash
npm install
cp .env.example .env.local
```

## 2. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Run the migration.** Open *SQL Editor*, paste the contents of
   `supabase/migrations/20261013000000_init_photos.sql`, and run it. Then do the same with
   `supabase/migrations/20261013010000_profile_photo.sql`,
   `supabase/migrations/20261013020000_site_content.sql`,
   `supabase/migrations/20261013030000_hero_photo.sql` and
   `supabase/migrations/20261014000000_photo_frame_hidden.sql`, in that order.
   (Or with the Supabase CLI: `supabase link --project-ref <ref> && supabase db push`.)
   This creates the `photos` table, the public `actor-photos` storage bucket, and all RLS policies.
3. **Disable public sign-ups** — *Authentication → Sign In / Providers → Email* → turn off
   **"Allow new users to sign up"**. RLS grants write access to *any* authenticated user, so this
   is what makes the admin the only one.
4. **Create the admin user** — *Authentication → Users → Add user → Create new user*, enter your
   email and a strong password, tick **Auto Confirm User**.
5. Copy the keys from *Project Settings → API* into `.env.local`:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key | Safe in the browser; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | **Server-only.** Not used by the app at runtime — keep for scripts |
| `ADMIN_EMAIL` | your admin email | Optional, recommended. Only this account can use the studio |

## 3. Run locally

```bash
npm run dev
```

- Site: http://localhost:3000
- Studio: http://localhost:3000/admin → sign in with the user from step 2.4

## 4. Personalise

Everything is edited in the studio (`/admin`):

| Tab | What it controls |
| --- | --- |
| **Photos** | **Featured images** — choose or upload the *Hero image* (behind your name; none = type-only hero), *Profile photo* (About) and *Stage backdrop* (Stage Born; otherwise the first *Portfolio* / *Theatre* photo). **Adjust** frames each one (zoom, position, brightness). Plus gallery upload, order, captions and categories; per photo, **Adjust frame** sets its gallery crop and the eye icon hides it from the gallery (it can still be a featured image). |
| **Profile** | Hero taglines, bio, About details (empty values are hidden), skills, Stage Born quote, contact info and the downloadable portfolio PDF. |
| **Credits** | Plays, films, music videos … shown in the Credits section (hidden when empty). |
| **Videos** | YouTube videos for the Reel section — the first is featured, the rest appear as thumbnails. |

`lib/profile.ts` holds the fixed name plus the *starting* content the site shows until you save
your own in the studio. The Profile/Credits/Videos tabs need
`supabase/migrations/20261013020000_site_content.sql` to have been run.

To copy the bundled PDF photos into Supabase so the studio can manage them:
`node --env-file=.env.local --experimental-websocket scripts/seed-default-photos.mjs`
(`--experimental-websocket` only on Node 20).

## 5. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. [vercel.com/new](https://vercel.com/new) → import the repo (framework auto-detected as Next.js).
3. Add the environment variables from step 2.5 under *Settings → Environment Variables*.
4. Deploy.
5. Back in Supabase → *Authentication → URL Configuration*, set **Site URL** to your Vercel
   domain.

---

## How it works

**Uploads.** The browser uploads files directly to Supabase Storage using the admin's session
(this avoids Vercel's 4.5 MB request limit), then `POST /api/photos` records the row. The API
derives the public URL server-side and stores the image's width/height so the masonry grid
can reserve space before images load.

**Security layers.**
1. `middleware.ts` redirects anyone who isn't the admin away from `/admin/*`.
2. The dashboard page and every write endpoint re-check the session with `supabase.auth.getUser()`
   (and `ADMIN_EMAIL`, if set).
3. Postgres RLS + Storage policies reject writes from unauthenticated requests even if the API
   were bypassed.

**Caching.** The homepage is statically generated and revalidated every 5 minutes, and
immediately after any upload, edit, reorder or delete (`revalidatePath('/')`).

**Schema note.** Beyond the requested columns, `photos` also has `storage_path` (to delete the
file from Storage) and `width` / `height` (layout stability). `category` is a Postgres enum:
`theatre | portfolio | bts`.

**Optional hardening.** To restrict writes in the database itself to a single email, replace
the `true` expressions in the insert/update/delete policies with
`(auth.jwt() ->> 'email') = 'you@example.com'` (see the comment in the migration).

## Scripts

| | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
