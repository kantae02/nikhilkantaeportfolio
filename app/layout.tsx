import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Poppins served from the repo (assets/fonts, from @fontsource/poppins) rather than
// downloaded from Google at build time — a flaky connection can't drop it to a fallback.
// The generated portfolio PDF uses the same files.
const poppins = localFont({
  src: [
    { path: '../assets/fonts/poppins-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-300-italic.woff2', weight: '300', style: 'italic' },
    { path: '../assets/fonts/poppins-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../assets/fonts/poppins-latin-800-normal.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nikhil Kantae — Actor',
  description:
    'Official portfolio of Nikhil Kantae — actor for stage and screen. Showreel, theatre work, portfolio photographs and contact.',
  openGraph: {
    title: 'Nikhil Kantae — Actor',
    description: 'Stage-born actor. Showreel, gallery and contact.',
    type: 'profile',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
