'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { ImageSettings, Photo } from '@/lib/types';
import { profile } from '@/lib/profile';
import { StageBackdrop, StageShade } from './backdrops';
import FilmStrip from './FilmStrip';
import { EASE_CINEMATIC } from './Reveal';

interface StageBornProps {
  index: string;
  photo?: Photo;
  quote: string;
  settings: ImageSettings;
}

export default function StageBorn({ index, photo, quote, settings }: StageBornProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const words = quote.split(' ');

  return (
    <section ref={ref} id="stage" className="relative overflow-hidden bg-black">
      {/* z-10 keeps the sprocket strips above the parallax backdrop. */}
      <div className="relative z-10">
        <FilmStrip />
      </div>

      {/* overflow-hidden clips the parallax so it never slides over the strips. */}
      <div className="relative flex min-h-[90vh] items-center overflow-hidden py-32">
        {/* Full-bleed theatre backdrop with slow parallax */}
        <motion.div style={{ y: bgY }} className="absolute inset-x-0 -inset-y-[8%]">
          <StageBackdrop photo={photo} settings={settings} />
        </motion.div>
        <StageShade shade={settings.shade} />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.p
            className="mb-10 flex items-center justify-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-white/80 [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
          >
            <span className="text-gold">{index}</span>
            <span className="h-px w-10 bg-gold/60" />
            Stage Born
          </motion.p>

          <motion.span
            aria-hidden
            className="block font-serif text-8xl leading-none text-gold sm:text-9xl"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: EASE_CINEMATIC }}
          >
            &ldquo;
          </motion.span>

          <motion.blockquote
            className="-mt-6 text-xl font-light leading-snug text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.3]"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-100px' }}
            transition={{ staggerChildren: 0.035 }}
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre"
                variants={{
                  hidden: { opacity: 0.08, y: 12, filter: 'blur(6px)' },
                  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_CINEMATIC } },
                }}
              >
                {word}{' '}
              </motion.span>
            ))}
          </motion.blockquote>

          <motion.p
            className="mt-12 text-xs font-semibold uppercase tracking-[0.4em] text-gold"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 1 }}
          >
            — {profile.fullName}
          </motion.p>
        </div>
      </div>

      <div className="relative z-10">
        <FilmStrip reverse />
      </div>
    </section>
  );
}
