import { CREDIT_KIND_LABELS, type Credit } from '@/lib/types';
import Reveal from './Reveal';
import SectionHeading from './SectionHeading';

export default function Credits({ index, credits }: { index: string; credits: Credit[] }) {
  return (
    <section id="credits" className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index={index}
          eyebrow="Credits"
          title={
            <>
              Stage &amp; <span className="text-gold">screen.</span>
            </>
          }
        />

        <ol className="mt-16 border-t border-white/[0.08]">
          {credits.map((credit, i) => {
            const meta = [
              credit.role && { label: 'Role', value: credit.role },
              credit.company && { label: credit.kind === 'theatre' ? 'Company' : 'Production', value: credit.company },
              credit.director && { label: 'Director', value: credit.director },
            ].filter(Boolean) as { label: string; value: string }[];

            return (
              <li key={credit.id}>
                <Reveal delay={Math.min(i, 6) * 0.06} y={24}>
                  <div className="group grid grid-cols-[3.5rem_1fr] gap-x-6 gap-y-3 border-b border-white/[0.08] py-7 transition-colors duration-500 hover:bg-white/[0.02] sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:px-4">
                    <span className="pt-1.5 text-sm font-medium tabular-nums text-gold sm:pt-0">{credit.year || '—'}</span>

                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold tracking-tight text-white transition-colors duration-500 group-hover:text-gold sm:text-2xl">
                        {credit.title}
                      </h3>
                      {meta.length > 0 && (
                        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                          {meta.map((m) => (
                            <div key={m.label} className="flex gap-2">
                              <dt className="text-muted">{m.label}</dt>
                              <dd className="text-white/80">{m.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    <span className="col-start-2 justify-self-start rounded-full border border-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/60 sm:col-start-auto sm:justify-self-end">
                      {CREDIT_KIND_LABELS[credit.kind] ?? credit.kind}
                    </span>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
