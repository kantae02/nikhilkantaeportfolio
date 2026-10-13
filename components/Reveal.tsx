'use client';

import { motion } from 'framer-motion';

export const EASE_CINEMATIC = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/** Scroll-triggered fade + slide-up used by every section. */
export default function Reveal({ children, className, delay = 0, y = 40 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.9, ease: EASE_CINEMATIC, delay }}
    >
      {children}
    </motion.div>
  );
}
