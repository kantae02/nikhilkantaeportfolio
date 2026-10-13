'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Photo } from '@/lib/types';
import { galleryFrame } from '@/lib/image-settings';
import { focusPosition, Framed } from './backdrops';
import GalleryLightbox from './GalleryLightbox';
import { EASE_CINEMATIC } from './Reveal';
import SectionHeading from './SectionHeading';

type Filter = 'all' | Category;

export default function Gallery({ index, photos }: { index: string; photos: Photo[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? photos : photos.filter((p) => p.category === filter)),
    [photos, filter],
  );

  // Only offer tabs for categories that actually have photos.
  const filters: Filter[] = ['all', ...CATEGORIES.filter((c) => photos.some((p) => p.category === c))];

  return (
    <section id="gallery" className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            index={index}
            eyebrow="Gallery"
            title={
              <>
                Frames &amp; <span className="text-gold">moments.</span>
              </>
            }
          />

          {photos.length > 0 && (
            <div role="tablist" aria-label="Filter photos" className="flex flex-wrap gap-2">
              {filters.map((f) => {
                const active = f === filter;
                return (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(f)}
                    className={`relative rounded-full px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${
                      active ? 'text-black' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="gallery-filter-pill"
                        className="absolute inset-0 rounded-full bg-gold"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <span className="relative">{f === 'all' ? 'All' : CATEGORY_LABELS[f]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {photos.length === 0 ? (
          <EmptyGallery />
        ) : (
          // Re-keying on filter replays the stagger-in for the new set.
          // Uniform grid: every tile is 4:5 so rows always line up. The lightbox shows each photo uncropped.
          <div key={filter} className="mt-16 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {visible.map((photo, i) => (
              <GalleryItem key={photo.id} photo={photo} index={i} onOpen={() => setOpenIndex(i)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <GalleryLightbox photos={visible} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function GalleryItem({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const frame = galleryFrame(photo); // set with "Adjust frame" in the studio

  return (
    <motion.figure
      className="aspect-[4/5]"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.9, ease: EASE_CINEMATIC, delay: (index % 3) * 0.12 }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open photo${photo.caption ? `: ${photo.caption}` : ''}`}
        className="group relative block h-full w-full overflow-hidden bg-ink-900"
      >
        {!loaded && <div aria-hidden className="shimmer absolute inset-0" />}
        <Framed settings={frame}>
          <Image
            src={photo.url}
            alt={photo.caption || 'Nikhil Kantae'}
            fill
            sizes="(min-width: 1024px) 33vw, 50vw"
            onLoad={() => setLoaded(true)}
            style={{ objectPosition: focusPosition(frame) }}
            className={`object-cover transition-[transform,opacity] duration-[1.2s] ease-cinematic group-hover:scale-110 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </Framed>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span aria-hidden className="absolute left-4 top-4 h-6 w-6 border-l border-t border-gold opacity-0 transition-all duration-500 group-hover:left-3 group-hover:top-3 group-hover:opacity-100" />
        <span aria-hidden className="absolute bottom-4 right-4 h-6 w-6 border-b border-r border-gold opacity-0 transition-all duration-500 group-hover:bottom-3 group-hover:right-3 group-hover:opacity-100" />

        <figcaption className="absolute inset-x-0 bottom-0 translate-y-4 p-6 text-left opacity-0 transition-all duration-500 ease-cinematic group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold">{CATEGORY_LABELS[photo.category]}</span>
          {photo.caption && <span className="mt-1 block text-sm font-medium text-white">{photo.caption}</span>}
        </figcaption>
      </button>
    </motion.figure>
  );
}

function EmptyGallery() {
  return (
    <div className="mt-16 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3" aria-label="Gallery coming soon">
      {['aspect-[4/5]', 'aspect-[4/5]', 'hidden aspect-[4/5] lg:block'].map((classes, i) => (
        <div key={i} className={`shimmer ${classes}`} />
      ))}
    </div>
  );
}
