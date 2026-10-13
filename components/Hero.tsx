'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { profile } from '@/lib/profile';
import type { ImageSettings, Photo } from '@/lib/types';
import { HeroBackdrop } from './backdrops';
import { EASE_CINEMATIC } from './Reveal';

const INTRO_DELAY = 0.9; // letterbox bars open first, then the name rises

const nameContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: INTRO_DELAY } },
};

const letter: Variants = {
  hidden: { y: '115%' },
  show: { y: '0%', transition: { duration: 1, ease: EASE_CINEMATIC } },
};

interface HeroProps {
  taglines: string[];
  motto: string;
  photo?: Photo;
  settings: ImageSettings;
}

export default function Hero({ taglines, motto, photo, settings }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

  return (
    <section ref={ref} id="top" className="relative flex h-[100svh] min-h-[620px] items-center overflow-hidden bg-ink-950">
      {photo && (
        // Hero photo: right side on desktop, full-bleed and dimmed behind the name on phones.
        <motion.div aria-hidden style={{ y: imageY }} className="absolute inset-0 lg:left-[38%]">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.4, delay: 0.4, ease: EASE_CINEMATIC }}
          >
            <HeroBackdrop photo={photo} settings={settings} priority />
          </motion.div>
        </motion.div>
      )}

      {/* Spotlight + light leak + vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-5%,rgba(245,197,24,0.16),transparent_65%)]" />
      <div className="absolute -left-1/4 top-1/3 h-[60vh] w-[60vw] rounded-full bg-gold/[0.04] blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.9)_100%)]" />
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="film-grain" />
      </div>

      {/* Letterbox bars open like a projector starting */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 top-0 z-20 bg-black"
        initial={{ height: '50%' }}
        animate={{ height: '6%' }}
        transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-20 bg-black"
        initial={{ height: '50%' }}
        animate={{ height: '6%' }}
        transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
      />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.p
          className="mb-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[0.5em] text-muted sm:text-xs"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: INTRO_DELAY + 0.2, ease: EASE_CINEMATIC }}
        >
          <span className="h-px w-12 bg-gold" />
          {profile.role} · Portfolio
        </motion.p>

        <motion.h1
          aria-label={profile.fullName}
          variants={nameContainer}
          initial="hidden"
          animate="show"
          className="select-none font-extrabold leading-[0.88] tracking-[-0.03em]"
        >
          <Word text={profile.firstName} className="text-[17vw] text-white sm:text-[14vw] lg:text-[11rem]" />
          <Word
            text={profile.lastName}
            className="text-[17vw] text-gold sm:ml-[8vw] sm:text-[14vw] lg:ml-40 lg:text-[11rem]"
          />
        </motion.h1>

        <motion.p
          className="mt-8 min-h-8 text-base font-light tracking-wide text-white/85 sm:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: INTRO_DELAY + 1.1, duration: 0.6 }}
        >
          <RoleLine roles={taglines} motto={motto} startDelay={(INTRO_DELAY + 1.3) * 1000} />
        </motion.p>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}

function Word({ text, className }: { text: string; className: string }) {
  return (
    <span aria-hidden className={`block overflow-hidden pb-[0.04em] ${className}`}>
      {text.split('').map((char, i) => (
        <motion.span key={i} variants={letter} className="inline-block">
          {char}
        </motion.span>
      ))}
    </span>
  );
}

const SEPARATOR = ' | ';

/**
 * Types the roles once as a single line — "Actor | Theater Artist | Storyteller" —
 * and holds it, so visitors know what you do at first glance. The caret blinks
 * briefly when typing finishes, then fades out.
 */
function RoleLine({ roles, motto, startDelay }: { roles: string[]; motto: string; startDelay: number }) {
  const line = roles
    .map((r) => r.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .join(SEPARATOR);
  const [count, setCount] = useState(0);
  const [caretDone, setCaretDone] = useState(false);

  useEffect(() => {
    setCount(0);
    setCaretDone(false);
    let chars = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      chars += 1;
      setCount(chars);
      if (chars < line.length) timer = setTimeout(tick, 55);
      else timer = setTimeout(() => setCaretDone(true), 2200);
    };
    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [line, startDelay]);

  // Re-split what's typed so far, drawing the separators in gold.
  const parts = line.slice(0, count).split(SEPARATOR);

  return (
    <span aria-label={motto ? `${line}. ${motto}` : line}>
      <span aria-hidden>
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2 text-gold sm:mx-3">|</span>}
            {part}
          </span>
        ))}
        <span className={`caret transition-opacity duration-700 ${caretDone ? 'opacity-0' : ''}`} />
      </span>
      {/* The motto follows once the roles are typed — a quieter signature line. */}
      {motto && (
        <motion.span
          className="mt-3 block text-sm font-light italic tracking-wide text-white/55 sm:text-base"
          initial={{ opacity: 0, y: 8 }}
          animate={count >= line.length && line.length > 0 ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE_CINEMATIC }}
        >
          {motto}
        </motion.span>
      )}
    </span>
  );
}

function ScrollIndicator() {
  return (
    <motion.a
      href="#about"
      aria-label="Scroll to About"
      className="absolute bottom-[3%] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-muted transition-colors hover:text-gold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: INTRO_DELAY + 1.6, duration: 1 }}
    >
      Scroll
      {/* Sits low, over the bottom letterbox bar, clear of the role line. */}
      <span className="relative h-7 w-px overflow-hidden bg-white/15">
        <motion.span
          className="absolute left-0 top-0 h-2.5 w-px bg-gold"
          animate={{ y: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
    </motion.a>
  );
}
