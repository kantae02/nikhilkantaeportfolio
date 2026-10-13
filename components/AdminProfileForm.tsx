'use client';

import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, LoaderCircle, Plus, Sparkles, Upload, X } from 'lucide-react';
import { createSupabaseBrowserClient, FILE_BUCKET } from '@/lib/supabase';
import type { SiteContent } from '@/lib/types';
import { adminRequest, errorMessage, Field, IconButton, inputClass, Panel, SaveIndicator, useSaveState } from './admin-ui';

const MAX_PDF_BYTES = 20 * 1024 * 1024;
const AUTO_PDF = '/portfolio.pdf'; // app/portfolio.pdf/route.ts
const ORIGINAL_PDF = '/nikhil-kantae-portfolio.pdf';

export default function AdminProfileForm({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [save, setSave] = useSaveState();
  const dirty = JSON.stringify(content) !== JSON.stringify(saved);

  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setContent((c) => ({ ...c, [key]: value }));
  const setContact = (key: keyof SiteContent['contact'], value: string) =>
    setContent((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSave({ kind: 'saving' });
    try {
      const { content: clean } = await adminRequest<{ content: SiteContent }>('/api/content', {
        method: 'PUT',
        // `base` lets the server refuse the save if someone else changed the Profile meanwhile.
        body: JSON.stringify({ content, base: saved }),
      });
      setContent(clean);
      setSaved(clean);
      setSave({ kind: 'saved' });
    } catch (err) {
      setSave({ kind: 'error', message: errorMessage(err, 'Could not save') });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Panel title="Intro" description="Under your name, the hero types your roles once as a single line: Actor | Theater Artist | Storyteller.">
        <div className="grid gap-5">
          <Field label="Hero roles" hint="One role per line — keep it to 2–4 so it fits on a phone.">
            <textarea
              rows={3}
              value={content.taglines.join('\n')}
              onChange={(e) => set('taglines', e.target.value.split('\n'))}
              className={inputClass}
            />
          </Field>
          <Field label="Hero motto" hint="A short line that fades in under your roles. Leave empty to hide it.">
            <input value={content.heroMotto} onChange={(e) => set('heroMotto', e.target.value)} placeholder="Every role, a new life." className={inputClass} />
          </Field>
          <Field label="Bio" hint="Shown next to your profile photo in the About section.">
            <textarea rows={4} value={content.bio} onChange={(e) => set('bio', e.target.value)} className={inputClass} />
          </Field>
        </div>
      </Panel>

      <Panel title="Details" description="Age, height, languages … Rows with an empty value are hidden on the site.">
        <DetailsEditor details={content.details} onChange={(details) => set('details', details)} />
      </Panel>

      <Panel title="Skills" description="Dance, martial arts, accents, horse riding … shown as tags under your details.">
        <SkillsEditor skills={content.skills} onChange={(skills) => set('skills', skills)} />
      </Panel>

      <Panel title="Stage Born quote" description="The large quote over the theatre backdrop.">
        <textarea rows={4} value={content.stageQuote} onChange={(e) => set('stageQuote', e.target.value)} className={inputClass} />
      </Panel>

      <Panel title="Contact" description="Empty fields are hidden on the site.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Phone">
            <input value={content.contact.phone} onChange={(e) => setContact('phone', e.target.value)} placeholder="+91 …" className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={content.contact.email} onChange={(e) => setContact('email', e.target.value)} className={inputClass} />
          </Field>
          <Field label="Instagram handle">
            <input value={content.contact.instagram} onChange={(e) => setContact('instagram', e.target.value)} placeholder="nikhil.kantae" className={inputClass} />
          </Field>
        </div>
      </Panel>

      <Panel title="Portfolio PDF" description="Visitors can download it from the About and Contact sections.">
        <PdfEditor url={content.portfolioPdfUrl} onChange={(url) => set('portfolioPdfUrl', url)} />
      </Panel>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-end gap-4 border border-white/10 bg-ink-950/90 px-5 py-3 backdrop-blur">
        <SaveIndicator state={save} />
        {dirty && save.kind !== 'saving' && <span className="text-xs text-amber-300">Unsaved changes</span>}
        <button
          type="button"
          onClick={() => setContent(saved)}
          disabled={!dirty || save.kind === 'saving'}
          className="px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white disabled:opacity-30"
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={!dirty || save.kind === 'saving'}
          className="flex items-center gap-2 bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {save.kind === 'saving' && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

function DetailsEditor({ details, onChange }: { details: SiteContent['details']; onChange: (d: SiteContent['details']) => void }) {
  const update = (i: number, patch: Partial<SiteContent['details'][number]>) =>
    onChange(details.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i: number, by: number) => {
    const next = [...details];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {details.map((d, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2">
          <input value={d.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Label" aria-label="Label" className={inputClass} />
          <input value={d.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="Value" aria-label={`${d.label || 'Detail'} value`} className={inputClass} />
          <div className="flex">
            <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="h-4 w-4" />
            </IconButton>
            <IconButton label="Move down" disabled={i === details.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="h-4 w-4" />
            </IconButton>
            <IconButton label="Remove" danger onClick={() => onChange(details.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...details, { label: '', value: '' }])}
        className="mt-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-gold hover:opacity-80"
      >
        <Plus className="h-4 w-4" /> Add detail
      </button>
    </div>
  );
}

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function add() {
    const items = draft
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !skills.includes(s));
    if (items.length) onChange([...skills, ...items]);
    setDraft('');
  }

  return (
    <div>
      {skills.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill} className="flex items-center gap-1 rounded-full border border-white/15 py-1 pl-3 pr-1 text-sm">
              {skill}
              <button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(skills.filter((s) => s !== skill))} className="rounded-full p-1 text-white/50 hover:text-red-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. Kuchipudi, Kalaripayattu, Hyderabadi accent"
          className={inputClass}
        />
        <button type="button" onClick={add} className="shrink-0 border border-white/10 px-4 text-xs font-medium uppercase tracking-[0.15em] text-gold hover:border-gold">
          Add
        </button>
      </div>
      <p className="mt-1.5 text-xs text-white/40">Press Enter or separate several with commas.</p>
    </div>
  );
}

function PdfEditor({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (file.type !== 'application/pdf') return setError('Please choose a PDF file.');
    if (file.size > MAX_PDF_BYTES) return setError('PDF must be 20 MB or smaller.');

    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const path = `portfolio/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(FILE_BUCKET)
        .upload(path, file, { contentType: 'application/pdf', cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      onChange(supabase.storage.from(FILE_BUCKET).getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  }

  const mode = url === AUTO_PDF ? 'auto' : url === ORIGINAL_PDF ? 'original' : url ? 'uploaded' : 'none';
  const choice = (active: boolean) =>
    `flex items-center gap-2 border px-4 py-2.5 text-xs font-medium uppercase tracking-[0.15em] transition-colors disabled:opacity-50 ${
      active ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 text-white/60 hover:text-white'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(AUTO_PDF)} className={choice(mode === 'auto')}>
          <Sparkles className="h-4 w-4" /> Auto-generated <span className="normal-case tracking-normal opacity-70">(recommended)</span>
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          className={choice(mode === 'uploaded')}
        >
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : mode === 'uploaded' ? 'Replace my PDF' : 'Upload my own'}
        </button>
        <button type="button" onClick={() => onChange(ORIGINAL_PDF)} className={choice(mode === 'original')}>
          <FileText className="h-4 w-4" /> Original PDF
        </button>
        <button type="button" onClick={() => onChange('')} className={choice(mode === 'none')}>
          <X className="h-4 w-4" /> No download
        </button>
        <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>

      <p className="text-sm text-white/60">
        {mode === 'auto' &&
          'Built automatically from your site — cover, details, Stage Born, credits, character looks and contact — using the same photos and framing. It updates whenever you save anything in the studio.'}
        {mode === 'uploaded' && 'Visitors download the PDF you uploaded. It won’t change when you edit the site.'}
        {mode === 'original' && 'Visitors download your original profile PDF. It won’t change when you edit the site.'}
        {mode === 'none' && 'The download buttons are hidden.'}
      </p>

      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-gold hover:opacity-80">
          <FileText className="h-4 w-4" /> Preview PDF ↗
        </a>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-white/40">Your choice takes effect when you click Save changes.</p>
    </div>
  );
}
