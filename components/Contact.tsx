import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { instagramUrl } from '@/lib/profile';
import type { SiteContent } from '@/lib/types';
import DownloadPortfolio from './DownloadPortfolio';
import { InstagramIcon } from './icons';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

interface ContactProps {
  index: string;
  contact: SiteContent['contact'];
  pdfUrl: string;
}

export default function Contact({ index, contact, pdfUrl }: ContactProps) {
  const { phone, email, instagram } = contact;

  const channels = [
    phone && {
      label: 'Phone',
      value: phone,
      href: `tel:${phone.replace(/[^\d+]/g, '')}`,
      icon: <Phone className="h-5 w-5" strokeWidth={1.6} />,
    },
    email && {
      label: 'Email',
      value: email,
      href: `mailto:${email}`,
      icon: <Mail className="h-5 w-5" strokeWidth={1.6} />,
    },
    instagram && {
      label: 'Instagram',
      value: `@${instagram}`,
      href: instagramUrl(instagram),
      icon: <InstagramIcon size={20} />,
      external: true,
    },
  ].filter(Boolean) as { label: string; value: string; href: string; icon: React.ReactNode; external?: boolean }[];

  return (
    <section id="contact" className="relative overflow-hidden py-28 sm:py-40">
      <div aria-hidden className="absolute bottom-0 left-1/2 h-[50%] w-[70%] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          index={index}
          eyebrow="Contact"
          align="center"
          title={
            <>
              Let&rsquo;s tell a <span className="text-gold">story.</span>
            </>
          }
        />
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-lg text-center text-muted">
            Open to film, theatre, OTT and commercial projects. For castings, collaborations and bookings — reach out.
          </p>
        </Reveal>

        <div className={`mx-auto mt-16 grid gap-5 ${channels.length > 2 ? 'md:grid-cols-3' : channels.length === 2 ? 'max-w-3xl md:grid-cols-2' : 'max-w-md'}`}>
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={0.15 + i * 0.1}>
              <a
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="group relative flex h-full flex-col justify-between overflow-hidden border border-white/[0.06] bg-ink-900 p-8 transition-all duration-500 ease-cinematic hover:-translate-y-1 hover:border-gold/40 hover:bg-ink-800"
              >
                <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-700 ease-cinematic group-hover:scale-x-100" />
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-gold transition-colors group-hover:border-gold/50">
                    {c.icon}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-white/30 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold" />
                </div>
                <div className="mt-12">
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted">{c.label}</p>
                  <p className="mt-2 break-all text-lg font-semibold text-white">{c.value}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        {pdfUrl && (
          <Reveal delay={0.3} className="mt-12 flex justify-center">
            <DownloadPortfolio href={pdfUrl} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
