'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { instagramUrl } from '@/lib/profile';
import { InstagramIcon } from './icons';
import { EASE_CINEMATIC } from './Reveal';

const ALL_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#reel', label: 'Reel' },
  { href: '#credits', label: 'Credits' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#stage', label: 'Stage' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar({ instagram, showCredits }: { instagram: string; showCredits: boolean }) {
  const LINKS = showCredits ? ALL_LINKS : ALL_LINKS.filter((l) => l.href !== '#credits');
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setHidden(y > previous && y > 160 && !menuOpen);
    setScrolled(y > 40);
  });

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          scrolled && !menuOpen ? 'border-b border-white/5 bg-ink/75 backdrop-blur-md' : 'border-b border-transparent'
        }`}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.45, ease: EASE_CINEMATIC }}
      >
        <motion.nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:h-20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8, ease: EASE_CINEMATIC }}
        >
          <a href="#top" className="group flex items-baseline gap-0.5 text-lg font-bold tracking-[0.2em]" onClick={() => setMenuOpen(false)}>
            NK
            <span className="h-1.5 w-1.5 rounded-full bg-gold transition-transform duration-300 group-hover:scale-150" />
          </a>

          <ul className="hidden items-center gap-10 md:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="group relative text-xs font-medium uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-white"
                >
                  {link.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-500 ease-cinematic group-hover:scale-x-100" />
                </a>
              </li>
            ))}
            {instagram && (
            <li>
              <a href={instagramUrl(instagram)} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-white/70 transition-colors hover:text-gold">
                <InstagramIcon size={18} />
              </a>
            </li>
            )}
          </ul>

          <button
            type="button"
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <motion.span className="block h-px w-6 bg-white" animate={menuOpen ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }} />
            <motion.span className="block h-px w-6 bg-white" animate={menuOpen ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }} />
          </button>
        </motion.nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col justify-center bg-ink-950/95 px-8 backdrop-blur-lg md:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="space-y-6">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: EASE_CINEMATIC }}
                >
                  <a href={link.href} onClick={() => setMenuOpen(false)} className="flex items-baseline gap-4 text-4xl font-bold">
                    <span className="text-xs font-medium text-gold">0{i + 1}</span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
