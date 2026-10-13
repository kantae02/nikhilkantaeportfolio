import Image from 'next/image';
import type { Photo, SiteContent } from '@/lib/types';
import { profile } from '@/lib/profile';
import { focusPosition, Framed } from './backdrops';
import DownloadPortfolio from './DownloadPortfolio';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

interface AboutProps {
  index: string;
  photo?: Photo;
  content: SiteContent;
}

export default function About({ index, photo, content }: AboutProps) {
  const details = content.details.filter((d) => d.value.trim());

  return (
    <section id="about" className="relative overflow-hidden py-28 sm:py-40">
      <span aria-hidden className="text-outline pointer-events-none absolute -right-8 top-16 select-none text-[22vw] font-extrabold leading-none lg:text-[16rem]">
        ACT
      </span>

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-12 lg:gap-20">
        <Reveal className="lg:col-span-5">
          <div className="group relative mx-auto max-w-md">
            {/* Gold corner brackets, like a viewfinder */}
            <span aria-hidden className="absolute -left-3 -top-3 z-10 h-12 w-12 border-l-2 border-t-2 border-gold" />
            <span aria-hidden className="absolute -bottom-3 -right-3 z-10 h-12 w-12 border-b-2 border-r-2 border-gold" />

            <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
              {photo ? (
                <Framed settings={content.imageSettings.profile}>
                  <Image
                    src={photo.url}
                    alt={photo.caption || `Portrait of ${profile.fullName}`}
                    fill
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    style={{ objectPosition: focusPosition(content.imageSettings.profile) }}
                    className="object-cover grayscale-[35%] transition duration-[1.4s] ease-cinematic group-hover:scale-105 group-hover:grayscale-0"
                  />
                </Framed>
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#262626,#111)]">
                  <span className="text-8xl font-extrabold tracking-tighter text-white/10">NK</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <SectionHeading
            index={index}
            eyebrow="About"
            title={
              <>
                The face behind <br className="hidden sm:block" />
                <span className="text-gold">the frame.</span>
              </>
            }
          />

          {content.bio && (
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">{content.bio}</p>
            </Reveal>
          )}

          {details.length > 0 && (
            <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-white/5 bg-white/5 sm:grid-cols-2">
              {details.map((item, i) => (
                <Reveal key={`${item.label}-${i}`} delay={0.15 + i * 0.07} y={20} className="bg-ink px-6 py-5">
                  <dt className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold">{item.label}</dt>
                  <dd className="mt-2 text-base font-medium text-white sm:text-lg">{item.value}</dd>
                </Reveal>
              ))}
              {/* Keep the 2-column grid flush when the count is odd. */}
              {details.length % 2 === 1 && <div aria-hidden className="hidden bg-ink sm:block" />}
            </dl>
          )}

          {content.skills.length > 0 && (
            <Reveal delay={0.2} className="mt-10">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold">Skills</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {content.skills.map((skill) => (
                  <li key={skill} className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-white/80">
                    {skill}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {content.portfolioPdfUrl && (
            <Reveal delay={0.25} className="mt-12">
              <DownloadPortfolio href={content.portfolioPdfUrl} />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
