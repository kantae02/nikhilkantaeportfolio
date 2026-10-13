'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CATEGORY_LABELS, type Photo } from '@/lib/types';

interface LightboxProps {
  photos: Photo[];
  startIndex: number;
  onClose: () => void;
}

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? '30%' : '-30%', opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-30%' : '30%', opacity: 0, scale: 0.96 }),
};

export default function GalleryLightbox({ photos, startIndex, onClose }: LightboxProps) {
  const [[index, direction], setState] = useState<[number, number]>([startIndex, 0]);
  const photo = photos[index];
  // A swipe ends with a click on the backdrop — don't let that close the viewer.
  const justDragged = useRef(false);

  const go = useCallback(
    (step: number) => setState(([i]) => [(i + step + photos.length) % photos.length, step]),
    [photos.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [go, onClose]);

  const onDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 50);
    const swipe = offset.x * velocity.x;
    if (swipe < -8000 || offset.x < -120) go(1);
    else if (swipe > 8000 || offset.x > 120) go(-1);
  };

  if (!photo) return null;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={onClose}
    >
      <div className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6" onClick={(e) => e.stopPropagation()}>
        <span className="font-mono text-xs tracking-[0.3em] text-muted">
          <span className="text-gold">{String(index + 1).padStart(2, '0')}</span> / {String(photos.length).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-gold hover:text-gold"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={photo.id}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            drag={photos.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            onClickCapture={(e) => {
              if (justDragged.current) {
                justDragged.current = false;
                e.stopPropagation();
              }
            }}
            className="absolute inset-0 flex items-center justify-center px-4 sm:px-24"
          >
            <Image
              src={photo.url}
              alt={photo.caption || 'Nikhil Kantae'}
              width={photo.width ?? 1600}
              height={photo.height ?? 2000}
              sizes="100vw"
              priority
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full w-auto max-w-full select-none object-contain shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>

        {photos.length > 1 && (
          <>
            <NavButton side="left" onClick={() => go(-1)} />
            <NavButton side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      <div className="px-6 py-6 text-center sm:py-8" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-gold">{CATEGORY_LABELS[photo.category]}</p>
        {photo.caption && <p className="mx-auto mt-2 max-w-2xl text-sm text-white/80 sm:text-base">{photo.caption}</p>}
      </div>
    </motion.div>
  );
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white backdrop-blur transition-colors hover:border-gold hover:text-gold sm:flex ${
        side === 'left' ? 'left-6' : 'right-6'
      }`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
