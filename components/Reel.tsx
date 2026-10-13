'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Video } from '@/lib/types';
import FilmStrip from './FilmStrip';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

const thumbnail = (id: string, size: 'maxresdefault' | 'hqdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;

export default function Reel({ index, videos }: { index: string; videos: Video[] }) {
  const [activeId, setActiveId] = useState(videos[0]?.id);
  const [playing, setPlaying] = useState(false);
  const active = videos.find((v) => v.id === activeId) ?? videos[0];

  if (!active) return null;

  function select(video: Video) {
    setActiveId(video.id);
    setPlaying(true);
    document.getElementById('reel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="reel" className="relative overflow-hidden bg-ink-950 py-28 sm:py-40">
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.05] blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          index={index}
          eyebrow="Featured Work"
          align="center"
          title={<span className="uppercase tracking-tight">{active.title}</span>}
        />
        {active.description && (
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-xl text-center text-muted">{active.description}</p>
          </Reveal>
        )}

        <Reveal delay={0.15} className="mt-16">
          <div className="relative">
            {/* Breathing projector glow */}
            <motion.div
              aria-hidden
              className="absolute -inset-4 rounded-sm bg-gold/25 blur-3xl sm:-inset-8"
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative overflow-hidden rounded-sm bg-black shadow-[0_40px_120px_-30px_rgba(245,197,24,0.45)] ring-1 ring-white/10">
              <FilmStrip />
              <div className="relative aspect-video">
                {playing ? (
                  <iframe
                    key={active.youtube_id}
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${active.youtube_id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(true)}
                    className="group absolute inset-0 h-full w-full"
                    aria-label={`Play ${active.title}`}
                  >
                    <Thumbnail
                      key={active.youtube_id}
                      id={active.youtube_id}
                      className="h-full w-full object-cover opacity-60 transition duration-[1.2s] ease-cinematic group-hover:scale-105 group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85))]" />

                    <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
                      <span className="absolute h-20 w-20 animate-ping rounded-full bg-gold/30 sm:h-24 sm:w-24" />
                      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold text-black shadow-[0_0_60px_rgba(245,197,24,0.6)] transition-transform duration-500 ease-cinematic group-hover:scale-110 sm:h-24 sm:w-24">
                        <Play className="ml-1 h-8 w-8" fill="currentColor" />
                      </span>
                    </span>

                    <span className="absolute bottom-5 left-5 text-left sm:bottom-8 sm:left-8">
                      <span className="block text-[10px] uppercase tracking-[0.4em] text-gold">Now Showing</span>
                      <span className="mt-1 block text-lg font-semibold uppercase tracking-wider text-white sm:text-2xl">
                        {active.title}
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <FilmStrip reverse />
            </div>
          </div>
        </Reveal>

        {videos.length > 1 && (
          <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videos.map((video, i) => {
              const isActive = video.id === active.id;
              return (
                <li key={video.id}>
                  <Reveal delay={0.05 * i} y={20}>
                    <button
                      type="button"
                      onClick={() => select(video)}
                      aria-current={isActive}
                      aria-label={`Play ${video.title}`}
                      className={`group block w-full text-left ${isActive ? '' : 'opacity-70 hover:opacity-100'} transition-opacity`}
                    >
                      <span
                        className={`relative block aspect-video overflow-hidden bg-black ring-1 transition-colors ${
                          isActive ? 'ring-gold' : 'ring-white/10 group-hover:ring-gold/50'
                        }`}
                      >
                        <Thumbnail id={video.youtube_id} small className="h-full w-full object-cover transition duration-700 ease-cinematic group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? 'bg-gold text-black' : 'bg-black/60 text-white'}`}>
                            <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                          </span>
                        </span>
                      </span>
                      <span className={`mt-3 block text-sm font-medium ${isActive ? 'text-gold' : 'text-white/90'}`}>{video.title}</span>
                    </button>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Plain <img>: lets us fall back when YouTube has no maxres thumbnail. */
function Thumbnail({ id, small, className }: { id: string; small?: boolean; className: string }) {
  const [src, setSrc] = useState(thumbnail(id, small ? 'hqdefault' : 'maxresdefault'));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" onError={() => setSrc(thumbnail(id, 'hqdefault'))} className={className} />
  );
}
