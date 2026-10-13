'use client';

import type { Video } from '@/lib/types';
import { parseYouTubeId } from '@/lib/youtube';
import AdminCollection from './AdminCollection';
import { Field, inputClass } from './admin-ui';

type Draft = { title: string; link: string; description: string };

export default function AdminVideos({ initial }: { initial: Video[] }) {
  return (
    <>
      <p className="mb-2 text-sm text-muted">The first video is featured in the Reel section; the rest appear as thumbnails below it.</p>
      <AdminCollection<Video, Draft>
        endpoint="/api/videos"
        initial={initial}
        noun="video"
        emptyDraft={{ title: '', link: '', description: '' }}
        toDraft={(v) => ({ title: v.title, link: `https://youtu.be/${v.youtube_id}`, description: v.description })}
        toPayload={(d) => {
          if (!d.title.trim()) return 'Add a title';
          const youtube_id = parseYouTubeId(d.link);
          if (!youtube_id) return 'Paste a valid YouTube link (youtube.com/watch?v=… or youtu.be/…)';
          return { title: d.title, youtube_id, description: d.description };
        }}
        renderItem={(v) => (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" className="aspect-video w-28 shrink-0 object-cover ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="truncate font-medium text-white">{v.title}</p>
              <a href={`https://youtu.be/${v.youtube_id}`} target="_blank" rel="noreferrer" className="text-xs text-muted hover:text-gold">
                youtu.be/{v.youtube_id} ↗
              </a>
            </div>
          </div>
        )}
        renderFields={(d, set) => {
          const id = parseYouTubeId(d.link);
          return (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <Field label="YouTube link *" hint="Any YouTube link works — watch, share, Shorts or embed.">
                  <input autoFocus value={d.link} onChange={(e) => set({ ...d, link: e.target.value })} placeholder="https://youtu.be/…" className={inputClass} />
                </Field>
                <Field label="Title *">
                  <input value={d.title} onChange={(e) => set({ ...d, title: e.target.value })} placeholder="Monologue — …" className={inputClass} />
                </Field>
                <Field label="Description">
                  <input value={d.description} onChange={(e) => set({ ...d, description: e.target.value })} placeholder="Optional one-liner shown under the title" className={inputClass} />
                </Field>
              </div>
              {id && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="Video preview" className="aspect-video w-full object-cover ring-1 ring-white/10 sm:w-56" />
              )}
            </div>
          );
        }}
      />
    </>
  );
}
