'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CloudUpload, LoaderCircle, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, checkImageFile, uploadPhoto } from '@/lib/upload-photo';
import { CATEGORIES, CATEGORY_LABELS, type Category, type Photo } from '@/lib/types';

type Status = 'ready' | 'uploading' | 'done' | 'error';

interface QueueItem {
  key: string;
  file: File;
  preview: string;
  caption: string;
  category: Category;
  status: Status;
  error?: string;
}

export default function UploadForm({ onUploaded }: { onUploaded: (photo: Photo) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<Category>('portfolio');
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);

  // Release object URLs on unmount.
  const queueRef = useRef(queue);
  queueRef.current = queue;
  useEffect(() => () => queueRef.current.forEach((q) => URL.revokeObjectURL(q.preview)), []);

  function addFiles(files: FileList | File[]) {
    const accepted: QueueItem[] = [];
    const skipped: string[] = [];
    Array.from(files).forEach((file) => {
      const problem = checkImageFile(file);
      if (problem) skipped.push(`${file.name} — ${problem}`);
      else
        accepted.push({
          key: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          caption: '',
          category: defaultCategory,
          status: 'ready',
        });
    });
    setRejected(skipped);
    setQueue((q) => [...q, ...accepted]);
  }

  function update(key: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function remove(key: string) {
    setQueue((q) => {
      const item = q.find((i) => i.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter((i) => i.key !== key);
    });
  }

  async function uploadAll() {
    setBusy(true);
    const pending = queue.filter((i) => i.status === 'ready' || i.status === 'error');

    // Sequential keeps sort_order assignment deterministic and is gentle on mobile uplinks.
    for (const item of pending) {
      update(item.key, { status: 'uploading', error: undefined });
      try {
        const photo = await uploadPhoto(item.file, { caption: item.caption, category: item.category });
        onUploaded(photo);
        update(item.key, { status: 'done' });
        setTimeout(() => remove(item.key), 1200);
      } catch (err) {
        update(item.key, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
      }
    }
    setBusy(false);
  }

  const pendingCount = queue.filter((i) => i.status === 'ready' || i.status === 'error').length;

  return (
    <div className="border border-white/[0.06] bg-ink-900/60">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`m-4 flex cursor-pointer flex-col items-center justify-center border border-dashed px-6 py-12 text-center transition-colors ${
          dragActive ? 'border-gold bg-gold/5' : 'border-white/15 hover:border-white/30'
        }`}
      >
        <CloudUpload className={`h-10 w-10 ${dragActive ? 'text-gold' : 'text-white/40'}`} strokeWidth={1.4} />
        <p className="mt-4 text-sm font-medium">
          Drop photos here or <span className="text-gold underline underline-offset-4">browse</span>
        </p>
        <p className="mt-1 text-xs text-muted">JPG, PNG, WebP or AVIF · up to 10 MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 pb-4 text-xs">
        <label htmlFor="default-category" className="uppercase tracking-[0.2em] text-muted">
          Default category
        </label>
        <select
          id="default-category"
          value={defaultCategory}
          onChange={(e) => setDefaultCategory(e.target.value as Category)}
          className="border border-white/10 bg-ink-950 px-3 py-1.5 text-white outline-none focus:border-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {rejected.length > 0 && (
        <ul className="mx-4 mb-4 space-y-1 border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {rejected.map((r) => (
            <li key={r}>Skipped {r}</li>
          ))}
        </ul>
      )}

      {queue.length > 0 && (
        <div className="border-t border-white/[0.06] p-4">
          <ul className="space-y-3">
            {queue.map((item) => (
              <li key={item.key} className="flex flex-col gap-3 border border-white/[0.06] bg-ink-950 p-3 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                <img src={item.preview} alt="" className="h-20 w-16 shrink-0 object-cover" />
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    placeholder="Caption (optional)"
                    value={item.caption}
                    maxLength={300}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    onChange={(e) => update(item.key, { caption: e.target.value })}
                    className="flex-1 border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
                  />
                  <select
                    value={item.category}
                    disabled={item.status === 'uploading' || item.status === 'done'}
                    onChange={(e) => update(item.key, { category: e.target.value as Category })}
                    className="border border-white/10 bg-ink-900 px-3 py-2 text-sm outline-none focus:border-gold disabled:opacity-60"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                  <StatusBadge item={item} />
                  {item.status !== 'uploading' && item.status !== 'done' && (
                    <button
                      type="button"
                      onClick={() => remove(item.key)}
                      aria-label="Remove from queue"
                      className="p-2 text-white/40 transition-colors hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={uploadAll}
              disabled={busy || pendingCount === 0}
              className="flex items-center gap-2 bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {busy ? 'Uploading' : `Upload ${pendingCount} photo${pendingCount === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ item }: { item: QueueItem }) {
  if (item.status === 'uploading')
    return (
      <span className="flex items-center gap-1.5 text-xs text-gold">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Uploading
      </span>
    );
  if (item.status === 'done')
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="h-3.5 w-3.5" /> Done
      </span>
    );
  if (item.status === 'error')
    return (
      <span className="max-w-[16rem] text-xs text-red-400" title={item.error}>
        {item.error}
      </span>
    );
  return <span className="text-xs text-muted">Ready</span>;
}
