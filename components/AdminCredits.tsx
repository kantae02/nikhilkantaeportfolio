'use client';

import { CREDIT_KINDS, CREDIT_KIND_LABELS, type Credit, type CreditKind } from '@/lib/types';
import AdminCollection from './AdminCollection';
import { Field, inputClass } from './admin-ui';

type Draft = Pick<Credit, 'title' | 'role' | 'company' | 'director' | 'year' | 'kind'>;

const EMPTY: Draft = { title: '', role: '', company: '', director: '', year: '', kind: 'theatre' };

export default function AdminCredits({ initial }: { initial: Credit[] }) {
  return (
    <AdminCollection<Credit, Draft>
      endpoint="/api/credits"
      initial={initial}
      noun="credit"
      emptyDraft={EMPTY}
      toDraft={({ title, role, company, director, year, kind }) => ({ title, role, company, director, year, kind })}
      toPayload={(d) => (d.title.trim() ? { ...d } : 'Add a title')}
      renderItem={(c) => (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-medium text-white">{c.title}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">{CREDIT_KIND_LABELS[c.kind]}</span>
            {c.year && <span className="text-xs text-muted">{c.year}</span>}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted">
            {[c.role && `as ${c.role}`, c.company, c.director && `dir. ${c.director}`].filter(Boolean).join(' · ') || 'No role or company yet'}
          </p>
        </>
      )}
      renderFields={(d, set) => (
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field label="Title *">
              <input autoFocus value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} placeholder="Play / film / song title" className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Type">
              <select value={d.kind} onChange={(e) => set({ ...d, kind: e.target.value as CreditKind })} className={inputClass}>
                {CREDIT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {CREDIT_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Role">
              <input value={d.role} onChange={(e) => set({ ...d, role: e.target.value })} placeholder="Character / Lead / Ensemble" className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Company / production">
              <input value={d.company} onChange={(e) => set({ ...d, company: e.target.value })} placeholder="Samahaara Theater" className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Director">
              <input value={d.director} onChange={(e) => set({ ...d, director: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Year">
              <input value={d.year} onChange={(e) => set({ ...d, year: e.target.value })} placeholder="2025" className={inputClass} />
            </Field>
          </div>
        </div>
      )}
    />
  );
}
