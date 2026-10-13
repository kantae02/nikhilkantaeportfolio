'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { adminRequest, errorMessage, IconButton, SaveIndicator, useSaveState } from './admin-ui';

/*
 * Ordered list editor used by the Credits and Videos tabs: add, edit inline,
 * move up/down and delete. Talks to the routes built by lib/collection-api.ts.
 */

interface Item {
  id: string;
}

interface Props<T extends Item, D> {
  endpoint: string; // e.g. '/api/credits'
  initial: T[];
  noun: string; // 'credit', 'video'
  emptyDraft: D;
  toDraft: (item: T) => D;
  /** Draft → request body, or an error message to show instead. */
  toPayload: (draft: D) => Record<string, unknown> | string;
  renderFields: (draft: D, setDraft: (d: D) => void) => React.ReactNode;
  renderItem: (item: T) => React.ReactNode;
}

export default function AdminCollection<T extends Item, D>(props: Props<T, D>) {
  const { endpoint, initial, noun, emptyDraft, toDraft, toPayload, renderFields, renderItem } = props;
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [save, setSave] = useSaveState();

  async function move(index: number, by: number) {
    const previous = items;
    const next = [...items];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setItems(next);
    setSave({ kind: 'saving' });
    try {
      await adminRequest(endpoint, { method: 'PATCH', body: JSON.stringify({ ids: next.map((i) => i.id) }) });
      setSave({ kind: 'saved' });
    } catch (err) {
      setItems(previous);
      setSave({ kind: 'error', message: errorMessage(err, 'Could not save order') });
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminRequest(`${endpoint}/${pendingDelete.id}`, { method: 'DELETE' });
      setItems((list) => list.filter((i) => i.id !== pendingDelete.id));
      setSave({ kind: 'saved' });
    } catch (err) {
      setSave({ kind: 'error', message: errorMessage(err, 'Could not delete') });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex min-h-5 justify-end">
        <SaveIndicator state={save} />
      </div>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="border border-white/[0.06] bg-ink-900">
            {editing === item.id ? (
              <ItemForm
                initial={toDraft(item)}
                submitLabel="Save"
                toPayload={toPayload}
                renderFields={renderFields}
                onCancel={() => setEditing(null)}
                onSubmit={async (payload) => {
                  const { item: updated } = await adminRequest<{ item: T }>(`${endpoint}/${item.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                  });
                  setItems((list) => list.map((x) => (x.id === item.id ? updated : x)));
                  setEditing(null);
                  setSave({ kind: 'saved' });
                }}
              />
            ) : (
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">{renderItem(item)}</div>
                <div className="flex shrink-0 items-center">
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Edit ${noun}`} onClick={() => setEditing(item.id)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Delete ${noun}`} danger onClick={() => setPendingDelete(item)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {items.length === 0 && editing !== 'new' && (
        <p className="border border-dashed border-white/10 px-6 py-12 text-center text-sm text-muted">No {noun}s yet.</p>
      )}

      <div className="mt-4">
        {editing === 'new' ? (
          <div className="border border-gold/40 bg-ink-900">
            <ItemForm
              initial={emptyDraft}
              submitLabel={`Add ${noun}`}
              toPayload={toPayload}
              renderFields={renderFields}
              onCancel={() => setEditing(null)}
              onSubmit={async (payload) => {
                const { item } = await adminRequest<{ item: T }>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
                setItems((list) => [...list, item]);
                setEditing(null);
                setSave({ kind: 'saved' });
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex w-full items-center justify-center gap-2 border border-dashed border-white/15 py-4 text-xs font-medium uppercase tracking-[0.2em] text-gold transition-colors hover:border-gold"
          >
            <Plus className="h-4 w-4" /> Add {noun}
          </button>
        )}
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title={`Delete this ${noun}?`}
        message="It will be removed from the site. This can't be undone."
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

interface ItemFormProps<D> {
  initial: D;
  submitLabel: string;
  toPayload: (draft: D) => Record<string, unknown> | string;
  renderFields: (draft: D, setDraft: (d: D) => void) => React.ReactNode;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

function ItemForm<D>({ initial, submitLabel, toPayload, renderFields, onSubmit, onCancel }: ItemFormProps<D>) {
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = toPayload(draft);
    if (typeof payload === 'string') return setError(payload);
    setBusy(true);
    setError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(errorMessage(err, 'Could not save'));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
      {renderFields(draft, setDraft)}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white/60 hover:text-white">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-2 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-black hover:opacity-90 disabled:opacity-50"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
