'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LoaderCircle, RotateCcw, X } from 'lucide-react';
import { defaultContent, profile } from '@/lib/profile';
import { FEATURED_SLOTS, type FeaturedSlot, type ImageSettings, type Photo } from '@/lib/types';
import { defaultGalleryFrame, MAX_ZOOM, MIN_ZOOM } from '@/lib/image-settings';
import { focusPosition, Framed, HeroBackdrop, StageBackdrop, StageShade } from './backdrops';
import { adminRequest, errorMessage } from './admin-ui';

/*
 * "Adjust" dialog: live preview with framing / brightness sliders, for a
 * featured section (hero, profile, stage) or one photo's gallery tile.
 */

const FRAMING: (keyof ImageSettings)[] = ['zoom', 'positionX', 'positionY'];

const CONTROLS: Record<FeaturedSlot, (keyof ImageSettings)[]> = {
  hero: [...FRAMING, 'opacity'],
  profile: FRAMING,
  stage: [...FRAMING, 'opacity', 'shade'],
};

interface SliderSpec {
  label: string;
  low: string;
  high: string;
  hint: string;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}

const LABELS: Record<keyof ImageSettings, SliderSpec> = {
  zoom: {
    label: 'Zoom',
    low: 'Fit',
    high: '3×',
    hint: 'Crop in closer. Zooming makes a small photo softer.',
    min: MIN_ZOOM,
    max: MAX_ZOOM,
    format: (v) => `${(v / 100).toFixed(2).replace(/\.?0+$/, '')}×`,
  },
  positionX: { label: 'Left ↔ right', low: 'Left', high: 'Right', hint: 'Slide the photo sideways.' },
  positionY: { label: 'Up ↕ down', low: 'Top', high: 'Bottom', hint: 'Slide the photo up or down.' },
  opacity: { label: 'Image brightness', low: 'Dim', high: 'Full', hint: 'Lower it to make the text stand out.' },
  shade: { label: 'Text shade', low: 'None', high: 'Dark', hint: 'Darkens just the area behind the quote.' },
};

export type AdjustTarget = { kind: 'slot'; slot: FeaturedSlot; stageQuote: string } | { kind: 'gallery' };

interface Props {
  target: AdjustTarget;
  photo: Photo;
  initial: ImageSettings;
  onClose: () => void;
  onSaved: (settings: ImageSettings) => void;
}

export default function AdminImageAdjuster({ target, photo, initial, onClose, onSaved }: Props) {
  const isSlot = target.kind === 'slot';
  const title = isSlot ? FEATURED_SLOTS[target.slot].label : 'Gallery frame';
  const subtitle = isSlot ? FEATURED_SLOTS[target.slot].section : `How “${photo.caption || 'this photo'}” is cropped in Frames & moments`;
  const controls = isSlot ? CONTROLS[target.slot] : FRAMING;
  const defaults = isSlot ? defaultContent.imageSettings[target.slot] : defaultGalleryFrame(photo);

  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(settings) !== JSON.stringify(initial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (target.kind === 'slot') {
        const { settings: saved } = await adminRequest<{ settings: ImageSettings }>('/api/content/images', {
          method: 'PATCH',
          body: JSON.stringify({ slot: target.slot, settings }),
        });
        onSaved(saved);
      } else {
        const { positionX, positionY, zoom } = settings;
        await adminRequest(`/api/photos/${photo.id}`, { method: 'PATCH', body: JSON.stringify({ frame: { positionX, positionY, zoom } }) });
        onSaved(settings);
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not save'));
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !saving && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Adjust ${title.toLowerCase()}`}
        className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-y-auto border border-white/10 bg-ink-950 lg:h-[min(95vh,48rem)] lg:flex-row lg:overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="flex flex-1 flex-col bg-black p-4 sm:p-6">
          <p className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-muted">
            Live preview
            <span className="normal-case tracking-normal text-white/40">Drag the photo to move it</span>
          </p>
          <div className="flex flex-1 items-center justify-center">
            <DragToPan settings={settings} onChange={setSettings}>
              <Preview target={target} photo={photo} settings={settings} />
            </DragToPan>
          </div>
        </div>

        {/* Controls: header, scrolling sliders, and a footer that's always visible */}
        <div className="flex w-full flex-col border-t border-white/[0.06] lg:min-h-0 lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em]">{title}</h3>
              <p className="mt-1 text-xs text-muted">{subtitle}</p>
            </div>
            <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="p-1 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 px-5 pb-5 sm:px-6 lg:min-h-0 lg:overflow-y-auto">
            <div className="mt-6 space-y-6">
              {controls.map((key) => (
                <Slider
                  key={key}
                  {...LABELS[key]}
                  value={settings[key]}
                  onChange={(value) => setSettings((s) => ({ ...s, [key]: value }))}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSettings(defaults)}
              className="mt-6 flex items-center gap-1.5 text-xs text-white/50 hover:text-gold"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to default
            </button>
          </div>

          <div className="sticky bottom-0 border-t border-white/[0.06] bg-ink-950 px-5 py-4 sm:px-6">
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            {!error && (
              <p className="mb-3 text-xs text-white/40">{dirty ? 'Unsaved changes — Save to put them live.' : 'No changes yet.'}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 border border-white/10 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!dirty || saving}
                className="flex flex-1 items-center justify-center gap-2 bg-gold py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-black hover:opacity-90 disabled:opacity-40"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Slider({
  label,
  low,
  high,
  hint,
  min = 0,
  max = 100,
  format = (v) => `${v}%`,
  value,
  onChange,
}: SliderSpec & { value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/80">{label}</span>
        <span className="text-xs tabular-nums text-gold">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full cursor-pointer accent-gold"
      />
      <span className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.15em] text-white/30">
        <span>{low}</span>
        <span>{high}</span>
      </span>
      <span className="mt-1.5 block text-xs text-white/40">{hint}</span>
    </label>
  );
}

/** Scaled-down mock of the real section, built from the same layers as the site. */
function Preview({ target, photo, settings }: { target: AdjustTarget; photo: Photo; settings: ImageSettings }) {
  if (target.kind === 'gallery') {
    // Same tile as the public gallery (4:5), with neighbours hinted for scale.
    return (
      <div className="flex w-full items-center justify-center gap-3">
        <div aria-hidden className="hidden aspect-[4/5] w-[18%] bg-white/[0.04] sm:block" />
        <div className="relative aspect-[4/5] w-full max-w-[min(22rem,60vh)] overflow-hidden bg-ink-900 ring-1 ring-gold/40">
          <Framed settings={settings}>
            <Image src={photo.url} alt="" fill sizes="360px" className="object-cover" style={{ objectPosition: focusPosition(settings) }} />
          </Framed>
        </div>
        <div aria-hidden className="hidden aspect-[4/5] w-[18%] bg-white/[0.04] sm:block" />
      </div>
    );
  }

  const { slot, stageQuote } = target;
  if (slot === 'profile') {
    return (
      <div className="relative aspect-[4/5] w-full max-w-[min(20rem,55vh)] overflow-hidden bg-ink-900">
        <span aria-hidden className="absolute -left-0 -top-0 z-10 h-10 w-10 border-l-2 border-t-2 border-gold" />
        <Framed settings={settings}>
          <Image src={photo.url} alt="" fill sizes="320px" className="object-cover grayscale-[35%]" style={{ objectPosition: focusPosition(settings) }} />
        </Framed>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      </div>
    );
  }

  if (slot === 'hero') {
    return (
      <div className="relative aspect-video w-full overflow-hidden bg-ink-950 ring-1 ring-white/10">
        <div className="absolute inset-0 left-[38%]">
          <HeroBackdrop photo={photo} settings={settings} />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.9)_100%)]" />
        <div className="relative flex h-full flex-col justify-center px-[6%]">
          <p className="mb-[2%] flex items-center gap-2 text-[clamp(6px,0.8vw,10px)] uppercase tracking-[0.5em] text-muted">
            <span className="h-px w-6 bg-gold" /> {profile.role} · Portfolio
          </p>
          <p className="font-extrabold leading-[0.88] tracking-[-0.03em]">
            <span className="block text-[clamp(28px,6.5vw,84px)] text-white">{profile.firstName}</span>
            <span className="ml-[12%] block text-[clamp(28px,6.5vw,84px)] text-gold">{profile.lastName}</span>
          </p>
        </div>
      </div>
    );
  }

  const snippet = stageQuote.split(' ').slice(0, 22).join(' ') + (stageQuote.split(' ').length > 22 ? ' …' : '');
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black ring-1 ring-white/10">
      <StageBackdrop photo={photo} settings={settings} />
      <StageShade shade={settings.shade} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[10%] text-center">
        <p className="text-[clamp(6px,0.8vw,10px)] uppercase tracking-[0.35em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
          <span className="text-gold">05</span> — Stage Born
        </p>
        <span aria-hidden className="mt-[2%] font-serif text-[clamp(28px,5vw,64px)] leading-none text-gold">&ldquo;</span>
        <p className="text-[clamp(12px,1.9vw,26px)] font-light leading-snug text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">{snippet}</p>
      </div>
    </div>
  );
}

/**
 * Lets the admin drag the preview to reframe: the photo follows the pointer,
 * which moves the focus point the opposite way.
 */
function DragToPan({
  settings,
  onChange,
  children,
}: {
  settings: ImageSettings;
  onChange: (update: (s: ImageSettings) => ImageSettings) => void;
  children: React.ReactNode;
}) {
  const start = useRef<{ x: number; y: number; px: number; py: number; w: number; h: number } | null>(null);

  return (
    <div
      className="w-full cursor-grab touch-none select-none active:cursor-grabbing [&>*]:mx-auto"
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { x: e.clientX, y: e.clientY, px: settings.positionX, py: settings.positionY, w: rect.width, h: rect.height };
      }}
      onPointerMove={(e) => {
        const s0 = start.current;
        if (!s0) return;
        // Dragging the full width of the preview pans across the whole photo.
        const dx = ((e.clientX - s0.x) / s0.w) * 100;
        const dy = ((e.clientY - s0.y) / s0.h) * 100;
        const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
        onChange((s) => ({ ...s, positionX: clamp(s0.px - dx), positionY: clamp(s0.py - dy) }));
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
    >
      {children}
    </div>
  );
}
