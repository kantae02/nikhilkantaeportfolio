'use client';

import { useEffect, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';

/* Small pieces shared by the studio tabs. */

export type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

/** JSON fetch against our admin API; throws with the server's error message. */
export async function adminRequest<T = Record<string, unknown>>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/** SaveState that drops back to idle shortly after a successful save. */
export function useSaveState() {
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  useEffect(() => {
    if (save.kind !== 'saved') return;
    const t = setTimeout(() => setSave({ kind: 'idle' }), 1800);
    return () => clearTimeout(t);
  }, [save]);
  return [save, setSave] as const;
}

export function SaveIndicator({ state }: { state: SaveState }) {
  if (state.kind === 'saving')
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving…
      </span>
    );
  if (state.kind === 'saved')
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" /> Saved
      </span>
    );
  if (state.kind === 'error') return <span className="text-xs text-red-400">{state.message}</span>;
  return null;
}

export const inputClass =
  'w-full border border-white/10 bg-ink-950 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-gold';

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted">{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint && <span className="mt-1.5 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

export function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/[0.06] bg-ink-900/60 p-5 sm:p-7">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Shown when a tab's table doesn't exist yet. */
export function MigrationNotice() {
  return (
    <p role="alert" className="mb-6 border-l-2 border-amber-400 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
      This tab needs the latest database migration. In Supabase → SQL Editor, run{' '}
      <code className="text-amber-100">supabase/migrations/20261013020000_site_content.sql</code>, then reload.
    </p>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-9 items-center justify-center text-white/50 transition-colors disabled:opacity-20 ${danger ? 'hover:text-red-300' : 'hover:text-gold'}`}
    >
      {children}
    </button>
  );
}
