'use client';

import { MotionConfig } from 'framer-motion';

/** Respects the OS "reduce motion" setting for every Framer animation below it. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
