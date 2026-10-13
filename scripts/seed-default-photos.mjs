// Uploads the bundled profile-PDF photos (lib/default-photos.ts → public/images)
// to Supabase Storage and the photos table, so they can be managed in the studio.
// Safe to re-run: files are upserted and rows are matched on storage_path.
//
// Usage: node --env-file=.env.local --experimental-websocket scripts/seed-default-photos.mjs
// (--experimental-websocket is only needed on Node 20; Node 22+ has WebSocket built in.)
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'actor-photos';

// Mirrors DEFAULT_PHOTOS in lib/default-photos.ts (same order = same sort_order).
const PHOTOS = [
  { id: 'headshot', caption: 'Headshot', category: 'portfolio', width: 376, height: 532 },
  { id: 'stage-born', caption: 'Samahaara Theater', category: 'theatre', width: 797, height: 408 },
  { id: 'the-smile', caption: 'The Smile', category: 'portfolio', width: 340, height: 490 },
  { id: 'the-warrior', caption: 'The Warrior', category: 'portfolio', width: 187, height: 459 },
  { id: 'the-intense', caption: 'The Intense', category: 'portfolio', width: 187, height: 459 },
  { id: 'the-sage', caption: 'The Sage', category: 'theatre', width: 187, height: 459 },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

for (const [i, photo] of PHOTOS.entries()) {
  const storagePath = `${photo.category}/${photo.id}.jpg`;
  const file = await readFile(new URL(`../public/images/${photo.id}.jpg`, import.meta.url));

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
  if (uploadError) throw new Error(`${photo.id}: upload failed — ${uploadError.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: rowError } = await supabase.from('photos').upsert(
    {
      url: publicUrl,
      storage_path: storagePath,
      caption: photo.caption,
      category: photo.category,
      sort_order: i,
      width: photo.width,
      height: photo.height,
    },
    { onConflict: 'storage_path' },
  );
  if (rowError) throw new Error(`${photo.id}: insert failed — ${rowError.message}`);

  console.log(`✓ ${storagePath}`);
}

console.log(`Seeded ${PHOTOS.length} photos.`);
