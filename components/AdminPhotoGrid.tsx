'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence } from 'framer-motion';
import { Check, CircleCheck, Crop, Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { galleryFrame } from '@/lib/image-settings';
import { CATEGORIES, CATEGORY_LABELS, FEATURED_SLOTS, type Category, type FeaturedSlot, type Photo } from '@/lib/types';
import AdminImageAdjuster from './AdminImageAdjuster';
import { focusPosition, Framed } from './backdrops';
import ConfirmModal from './ConfirmModal';
import { adminRequest as request, errorMessage, SaveIndicator, useSaveState } from './admin-ui';

const FEATURED_ORDER: FeaturedSlot[] = ['hero', 'profile', 'stage'];
const SHORT_LABEL: Record<FeaturedSlot, string> = { hero: 'Hero', profile: 'Profile', stage: 'Stage' };

type PhotoPatch = Partial<Pick<Photo, 'caption' | 'category' | 'hidden' | 'frame'>>;

interface Props {
  photos: Photo[];
  onPhotosChange: Dispatch<SetStateAction<Photo[]>>;
}

export default function AdminPhotoGrid({ photos, onPhotosChange }: Props) {
  const [save, setSave] = useSaveState();
  const [pendingDelete, setPendingDelete] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [framing, setFraming] = useState<Photo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const previous = photos;
    const next = arrayMove(previous, previous.findIndex((p) => p.id === active.id), previous.findIndex((p) => p.id === over.id));
    onPhotosChange(next);
    setSave({ kind: 'saving' });
    try {
      await request('/api/photos', { method: 'PATCH', body: JSON.stringify({ ids: next.map((p) => p.id) }) });
      setSave({ kind: 'saved' });
    } catch (err) {
      onPhotosChange(previous);
      setSave({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save order' });
    }
  }

  async function updatePhoto(id: string, patch: PhotoPatch) {
    const previous = photos;
    onPhotosChange((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setSave({ kind: 'saving' });
    try {
      await request(`/api/photos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setSave({ kind: 'saved' });
    } catch (err) {
      onPhotosChange(previous);
      setSave({ kind: 'error', message: err instanceof Error ? err.message : 'Could not save changes' });
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await request(`/api/photos/${pendingDelete.id}`, { method: 'DELETE' });
      onPhotosChange((list) => list.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setSave({ kind: 'error', message: err instanceof Error ? err.message : 'Could not delete photo' });
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-[0.3em] text-muted">
          Gallery <span className="ml-2 normal-case tracking-normal text-white/40">— drag the handle to reorder</span>
        </h2>
        <SaveIndicator state={save} />
      </div>

      {photos.length === 0 ? (
        <p className="border border-dashed border-white/10 px-6 py-16 text-center text-sm text-muted">
          No photos yet. Upload your first one above.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, i) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  position={i + 1}
                  onUpdate={(patch) => updatePhoto(photo.id, patch)}
                  onFrame={() => setFraming(photo)}
                  onDelete={() => setPendingDelete(photo)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AnimatePresence>
        {framing && (
          <AdminImageAdjuster
            target={{ kind: 'gallery' }}
            photo={framing}
            initial={galleryFrame(framing)}
            onClose={() => setFraming(null)}
            onSaved={({ positionX, positionY, zoom }) => {
              onPhotosChange((list) => list.map((p) => (p.id === framing.id ? { ...p, frame: { positionX, positionY, zoom } } : p)));
              setFraming(null);
              setSave({ kind: 'saved' });
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this photo?"
        message="It will be removed from the gallery and from storage. This can't be undone."
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

interface CardProps {
  photo: Photo;
  position: number;
  onUpdate: (patch: PhotoPatch) => void;
  onFrame: () => void;
  onDelete: () => void;
}

function SortablePhotoCard({ photo, position, onUpdate, onFrame, onDelete }: CardProps) {
  const usedFor = FEATURED_ORDER.filter((slot) => photo[FEATURED_SLOTS[slot].flag]);
  const frame = galleryFrame(photo);
  const hidden = !!photo.hidden;

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative flex flex-col border bg-ink-900 ${
        isDragging
          ? 'z-20 border-gold shadow-[0_20px_60px_-10px_rgba(245,197,24,0.35)]'
          : usedFor.length > 0
            ? 'border-gold ring-1 ring-gold'
            : 'border-white/[0.06]'
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-800">
        {/* Same crop as the public gallery tile. */}
        <Framed settings={frame} className={hidden ? 'opacity-35 grayscale' : ''}>
          <Image
            src={photo.url}
            alt={photo.caption || 'Photo'}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
            style={{ objectPosition: focusPosition(frame) }}
          />
        </Framed>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
        {hidden && (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">
            Hidden from gallery
          </span>
        )}

        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label={`Drag to reorder photo ${position}`}
          className="absolute left-2 top-2 flex h-9 cursor-grab touch-none items-center gap-1 rounded-sm bg-black/60 pl-1 pr-2 text-xs font-medium text-white backdrop-blur active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
          {String(position).padStart(2, '0')}
        </button>

        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate({ hidden: !hidden })}
            aria-label={hidden ? 'Show in gallery' : 'Hide from gallery'}
            aria-pressed={hidden}
            title={hidden ? 'Hidden from gallery — click to show' : 'Shown in gallery — click to hide'}
            className={`flex h-9 w-9 items-center justify-center rounded-sm backdrop-blur transition-colors ${
              hidden ? 'bg-gold text-black hover:opacity-90' : 'bg-black/60 text-white/80 hover:bg-white hover:text-black'
            }`}
          >
            {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete photo"
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-black/60 text-white/80 backdrop-blur transition-colors hover:bg-red-600 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {usedFor.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
            {usedFor.map((slot) => (
              <span
                key={slot}
                className="flex items-center gap-1 rounded-sm bg-gold px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black shadow-lg"
              >
                <CircleCheck className="h-3 w-3" strokeWidth={2.5} /> {SHORT_LABEL[slot]}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <select
          value={photo.category}
          onChange={(e) => onUpdate({ category: e.target.value as Category })}
          aria-label="Category"
          className="w-full border border-white/10 bg-ink-950 px-2 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-gold outline-none focus:border-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <CaptionEditor caption={photo.caption} onSave={(caption) => onUpdate({ caption })} />
        <button
          type="button"
          onClick={onFrame}
          className="mt-auto flex items-center justify-center gap-1.5 border border-white/10 py-1.5 text-[11px] font-medium uppercase tracking-[0.15em] text-gold transition-colors hover:border-gold"
        >
          <Crop className="h-3.5 w-3.5" /> Adjust frame
        </button>
      </div>
    </li>
  );
}

function CaptionEditor({ caption, onSave }: { caption: string; onSave: (caption: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(caption);
  const open = useRef(false); // guards against Enter + blur both committing

  useEffect(() => {
    if (!editing) setDraft(caption);
  }, [caption, editing]);

  function startEditing() {
    open.current = true;
    setEditing(true);
  }

  function commit() {
    if (!open.current) return;
    open.current = false;
    setEditing(false);
    const next = draft.trim();
    if (next !== caption) onSave(next);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              open.current = false;
              setDraft(caption);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 border border-gold bg-ink-950 px-2 py-1.5 text-sm outline-none"
        />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={commit} aria-label="Save caption" className="p-1.5 text-gold">
          <Check className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEditing}
      className="group/caption flex w-full items-start justify-between gap-2 text-left text-sm"
    >
      <span className={caption ? 'text-white/90' : 'italic text-white/30'}>{caption || 'Add a caption'}</span>
      <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover/caption:text-gold" />
    </button>
  );
}

