import { Mail } from 'lucide-react';
import { instagramUrl, profile, youtubeUrl } from '@/lib/profile';
import type { SiteContent } from '@/lib/types';
import FilmStrip from './FilmStrip';
import { InstagramIcon, YouTubeIcon } from './icons';

export default function Footer({ contact, youtubeId }: { contact: SiteContent['contact']; youtubeId?: string }) {
  const socials = [
    ...(contact.instagram
      ? [{ label: 'Instagram', href: instagramUrl(contact.instagram), icon: <InstagramIcon size={18} />, external: true }]
      : []),
    ...(youtubeId ? [{ label: 'YouTube', href: youtubeUrl(youtubeId), icon: <YouTubeIcon size={18} />, external: true }] : []),
    ...(contact.email
      ? [{ label: 'Email', href: `mailto:${contact.email}`, icon: <Mail className="h-[18px] w-[18px]" strokeWidth={1.6} />, external: false }]
      : []),
  ];

  return (
    <footer className="bg-ink-950">
      <FilmStrip />
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <a href="#top" className="flex items-baseline gap-0.5 text-sm font-bold tracking-[0.3em]">
          {profile.firstName} {profile.lastName}
          <span className="h-1 w-1 rounded-full bg-gold" />
        </a>

        <p className="order-last text-xs text-muted sm:order-none">
          © {new Date().getFullYear()} {profile.fullName}. All rights reserved.
        </p>

        <ul className="flex items-center gap-3">
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                aria-label={s.label}
                {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-gold hover:text-gold"
              >
                {s.icon}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
