'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, Images, LoaderCircle, SlidersHorizontal, TriangleAlert, Upload, X } from 'lucide-react';
import { FEATURED_SLOTS, type FeaturedSlot, type ImageSettings, type Photo } from '@/lib/types';
import { ACCEPTED_IMAGE_TYPES, checkImageFile, uploadPhoto } from '@/lib/upload-photo';
import AdminImageAdjuster from './AdminImageAdjuster';
import { focusPosition, Framed } from './backdrops';
import { adminRequest, errorMessage } from './admin-ui';

/*
 * "Featured images" panel at the top of the Photos tab: pick (or upload) the
 * photo used by a specific section — hero, About portrait, Stage Born backdrop.
 */

const SLOT_ORDER: FeaturedSlot[] = ['hero', 'profile', 'stage'];

const SLOT_DETAILS: Record<FeaturedSlot, { aspect: string; fallback: string; tip: string; minWidth: number }> = {
  hero: {
    aspect: 'aspect-video',
    fallback: 'No image — the hero shows just your name.',
    tip: 'Best: a landscape photo, 2000px+ wide, face on the right.',
    minWidth: 1600,
  },
  profile: {
    aspect: 'aspect-[4/5]',
    fallback: 'Not set — uses the first Portfolio photo.',
    tip: 'Best: a portrait headshot, 1000px+ wide.',
    minWidth: 800,
  },
  stage: {
    aspect: 'aspect-video',
    fallback: 'Not set — uses the first Theatre photo.',
    tip: 'Best: a wide stage photo, 1600px+ wide.',
    minWidth: 1200,
  },
};

interface Props {
  photos: Photo[];
  onPhotosChange: Dispatch<SetStateAction<Photo[]>>;
  initialSettings: Record<FeaturedSlot, ImageSettings>;
  stageQuote: string;
}

/** The photo the site actually shows for a slot — the chosen one, else the same fallback as app/page.tsx. */
function effectivePhoto(slot: FeaturedSlot, photos: Photo[]): { photo?: Photo; auto: boolean } {
  const chosen = photos.find((p) => p[FEATURED_SLOTS[slot].flag]);
  if (chosen) return { photo: chosen, auto: false };
  const fallback =
    slot === 'profile'
      ? (photos.find((p) => p.category === 'portfolio') ?? photos[0])
      : slot === 'stage'
        ? photos.find((p) => p.category === 'theatre')
        : undefined;
  return { photo: fallback, auto: !!fallback };
}

export default function AdminFeaturedImages({ photos, onPhotosChange, initialSettings, stageQuote }: Props) {
  const [picking, setPicking] = useState<FeaturedSlot | null>(null);
  const [adjusting, setAdjusting] = useState<FeaturedSlot | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState<FeaturedSlot | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FeaturedSlot, string>>>({});

  const setError = (slot: FeaturedSlot, message?: string) => setErrors((e) => ({ ...e, [slot]: message }));

  async function feature(slot: FeaturedSlot, photo: Photo) {
    const flag = FEATURED_SLOTS[slot].flag;
    const previousId = photos.find((p) => p[flag])?.id;
    onPhotosChange((list) => list.map((p) => ({ ...p, [flag]: p.id === photo.id })));
    setError(slot);
    try {
      await adminRequest(`/api/photos/${photo.id}`, { method: 'PATCH', body: JSON.stringify({ featured: slot }) });
    } catch (err) {
      // Undo just the selection (a fresh upload stays in the list).
      onPhotosChange((list) => list.map((p) => ({ ...p, [flag]: p.id === previousId })));
      setError(slot, errorMessage(err, 'Could not save'));
    }
  }

  async function unfeature(slot: FeaturedSlot, photo: Photo) {
    const flag = FEATURED_SLOTS[slot].flag;
    onPhotosChange((list) => list.map((p) => (p.id === photo.id ? { ...p, [flag]: false } : p)));
    setError(slot);
    try {
      await adminRequest(`/api/photos/${photo.id}`, { method: 'PATCH', body: JSON.stringify({ unfeature: slot }) });
    } catch (err) {
      onPhotosChange((list) => list.map((p) => (p.id === photo.id ? { ...p, [flag]: true } : p)));
      setError(slot, errorMessage(err, 'Could not save'));
    }
  }

  async function uploadFor(slot: FeaturedSlot, file: File) {
    const problem = checkImageFile(file);
    if (problem) return setError(slot, `${file.name}: ${problem}`);
    setBusy(slot);
    setError(slot);
    try {
      const { label, category } = FEATURED_SLOTS[slot];
      // Uploaded for this section, so kept out of the gallery (toggle it on a gallery card to show it).
      const photo = await uploadPhoto(file, { caption: label, category, hidden: true });
      onPhotosChange((list) => [...list, photo]);
      await feature(slot, photo);
    } catch (err) {
      setError(slot, errorMessage(err, 'Upload failed'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-muted">Featured images</h2>
      <p className="mb-5 text-sm text-white/40">Choose which photo each section of the site uses.</p>

      <div className="grid gap-4 md:grid-cols-3">
        {SLOT_ORDER.map((slot) => (
          <SlotCard
            key={slot}
            slot={slot}
            {...effectivePhoto(slot, photos)}
            settings={settings[slot]}
            busy={busy === slot}
            error={errors[slot]}
            onChoose={() => setPicking(slot)}
            onAdjust={() => setAdjusting(slot)}
            onUpload={(file) => uploadFor(slot, file)}
            onRemove={(photo) => unfeature(slot, photo)}
          />
        ))}
      </div>

      <AnimatePresence>
        {adjusting && effectivePhoto(adjusting, photos).photo && (
          <AdminImageAdjuster
            target={{ kind: 'slot', slot: adjusting, stageQuote }}
            photo={effectivePhoto(adjusting, photos).photo!}
            initial={settings[adjusting]}
            onClose={() => setAdjusting(null)}
            onSaved={(saved) => {
              setSettings((s) => ({ ...s, [adjusting]: saved }));
              setAdjusting(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {picking && (
          <PhotoPicker
            slot={picking}
            photos={photos}
            onClose={() => setPicking(null)}
            onPick={(photo) => {
              feature(picking, photo);
              setPicking(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

interface SlotCardProps {
  slot: FeaturedSlot;
  photo?: Photo;
  /** True when the site falls back to this photo because none was chosen. */
  auto: boolean;
  settings: ImageSettings;
  busy: boolean;
  error?: string;
  onChoose: () => void;
  onAdjust: () => void;
  onUpload: (file: File) => void;
  onRemove: (photo: Photo) => void;
}

function SlotCard({ slot, photo, auto, settings, busy, error, onChoose, onAdjust, onUpload, onRemove }: SlotCardProps) {
  const input = useRef<HTMLInputElement>(null);
  const { label, section } = FEATURED_SLOTS[slot];
  const { aspect, fallback, tip, minWidth } = SLOT_DETAILS[slot];
  const lowRes = photo?.width != null && photo.width < minWidth;

  return (
    <div className={`flex flex-col border bg-ink-900 ${photo && !auto ? 'border-gold/50' : 'border-white/[0.06]'}`}>
      <div className={`relative ${aspect} overflow-hidden bg-ink-800`}>
        {photo ? (
          <Framed settings={settings}>
            <Image
              src={photo.url}
              alt={photo.caption || label}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
              style={{ objectPosition: focusPosition(settings) }}
            />
          </Framed>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/30">{fallback}</div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <LoaderCircle className="h-6 w-6 animate-spin text-gold" />
          </div>
        )}
        {photo &&
          (auto ? (
            <span className="absolute left-2 top-2 rounded-sm bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white/80 backdrop-blur">
              Auto
            </span>
          ) : (
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-sm bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-black">
              <CircleCheck className="h-3.5 w-3.5" strokeWidth={2.5} /> In use
            </span>
          ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-muted">{section}</p>
          {photo && (
            <p className={`mt-1 truncate text-xs ${auto ? 'text-white/50' : 'text-gold'}`}>
              {photo.caption || 'Untitled photo'}
              {auto && ' — automatic (not chosen yet)'}
            </p>
          )}
        </div>

        {lowRes ? (
          <p className="flex items-start gap-1.5 text-xs text-amber-300">
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
            Only {photo?.width}px wide — may look blurry here. {tip}
          </p>
        ) : (
          <p className="text-xs text-white/35">{tip}</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="mt-auto flex flex-wrap gap-2">
          {photo && (
            <button type="button" onClick={onAdjust} disabled={busy} className={`${slotButton} border-gold/50 bg-gold/10`}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
            </button>
          )}
          <button type="button" onClick={onChoose} disabled={busy} className={slotButton}>
            <Images className="h-3.5 w-3.5" /> Choose
          </button>
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={slotButton}>
            <Upload className="h-3.5 w-3.5" /> Upload new
          </button>
          {photo && !auto && (
            <button
              type="button"
              onClick={() => onRemove(photo)}
              disabled={busy}
              className={`${slotButton} text-white/50 hover:border-red-400 hover:text-red-300`}
            >
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          )}
          <input
            ref={input}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}

const slotButton =
  'flex items-center gap-1.5 border border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-gold transition-colors hover:border-gold disabled:opacity-40';

function PhotoPicker({ slot, photos, onPick, onClose }: { slot: FeaturedSlot; photos: Photo[]; onPick: (p: Photo) => void; onClose: () => void }) {
  const { label, flag } = FEATURED_SLOTS[slot];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose ${label.toLowerCase()}`}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col border border-white/10 bg-ink-950"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">Choose {label.toLowerCase()}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {photos.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No photos yet — use “Upload new” instead.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 overflow-y-auto p-5 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => {
              const current = !!photo[flag];
              return (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => onPick(photo)}
                    className={`group relative block w-full overflow-hidden text-left ring-2 transition ${current ? 'ring-gold' : 'ring-transparent hover:ring-gold/60'}`}
                  >
                    <span className="relative block aspect-[4/5] bg-ink-800">
                      <Image src={photo.url} alt={photo.caption || 'Photo'} fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover object-top transition duration-500 group-hover:scale-105" />
                    </span>
                    {current && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-sm bg-gold px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">
                        <CircleCheck className="h-3 w-3" /> Current
                      </span>
                    )}
                    <span className="block truncate bg-ink-900 px-2 py-1.5 text-xs text-white/80">
                      {photo.caption || 'Untitled'}
                      {photo.width && <span className="ml-1 text-white/35">· {photo.width}px</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </motion.div>
  );
}
