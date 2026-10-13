import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
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
