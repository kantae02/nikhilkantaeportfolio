import Image from 'next/image';
import type { CSSProperties } from 'react';
import type { Frame, ImageSettings, Photo } from '@/lib/types';

/*
 * Image layers for the featured sections. Shared by the live site and the
 * studio's "Adjust" preview, so what you tune is exactly what visitors see.
 * Each fills its (relatively positioned) parent.
 */

/** object-position for the chosen focus point. */
export const focusPosition = (s: Frame) => `${s.positionX}% ${s.positionY}%`;

/**
 * Clips its children and zooms them around the focus point. Zoom lives on this
 * wrapper (not the <img>) so hover effects on the image itself still work.
 */
export function Framed({ settings, className = '', children }: { settings: Frame; className?: string; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${settings.zoom / 100})`, transformOrigin: focusPosition(settings) }}
      >
        {children}
      </div>
    </div>
  );
}

/** Stage Born backdrop photo, or an empty-stage spotlight when there's no photo. */
export function StageBackdrop({ photo, settings }: { photo?: Photo; settings: ImageSettings }) {
  if (!photo) {
    return (
      <div className="h-full w-full bg-[radial-gradient(ellipse_40%_70%_at_50%_0%,rgba(245,197,24,0.18),transparent_70%),linear-gradient(to_bottom,#0a0a0a,#151515_70%,#0a0a0a)]" />
    );
  }
  return (
    <Framed settings={settings}>
      <Image
        src={photo.url}
        alt=""
        fill
        sizes="100vw"
        className="object-cover saturate-[0.9]"
        style={{ objectPosition: focusPosition(settings), opacity: settings.opacity / 100 }}
      />
    </Framed>
  );
}

/** Grading over the Stage Born photo: soft fades into the film strips plus a shade behind the quote. */
export function StageShade({ shade }: { shade: number }) {
  const a = shade / 100;
  return (
    <>
      <div className="absolute inset-x-0 top-0 h-1/5 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-black/60 to-transparent" />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 55% at center, rgba(0,0,0,${a}), rgba(0,0,0,${a * 0.4}) 60%, rgba(0,0,0,${a * 0.1}))`,
        }}
      />
    </>
  );
}

/**
 * Hero photo with the fades that melt it into the black. On phones it sits
 * behind the name, so it's shown at half the chosen opacity there.
 */
export function HeroBackdrop({ photo, settings, priority }: { photo: Photo; settings: ImageSettings; priority?: boolean }) {
  return (
    <>
      <Framed settings={settings}>
        <Image
          src={photo.url}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover opacity-[calc(var(--hero-opacity)*0.5)] lg:opacity-[var(--hero-opacity)]"
          style={{ objectPosition: focusPosition(settings), '--hero-opacity': settings.opacity / 100 } as CSSProperties}
        />
      </Framed>
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/40 to-transparent lg:via-ink-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
      <div className="absolute inset-0 bg-gradient-to-l from-ink-950/70 via-transparent to-transparent" />
    </>
  );
}
