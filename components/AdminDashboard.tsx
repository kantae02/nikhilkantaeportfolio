'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clapperboard, ExternalLink, Images, LogOut, ScrollText, UserRound } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_LABELS, type Credit, type Photo, type SiteContent, type Video } from '@/lib/types';
import AdminCredits from './AdminCredits';
import AdminFeaturedImages from './AdminFeaturedImages';
import AdminPhotoGrid from './AdminPhotoGrid';
import AdminProfileForm from './AdminProfileForm';
import AdminVideos from './AdminVideos';
import { MigrationNotice } from './admin-ui';
import UploadForm from './UploadForm';

interface Props {
  email: string;
  initialPhotos: Photo[];
  loadError: string | null;
  initialContent: SiteContent;
  initialCredits: Credit[];
  initialVideos: Video[];
  migrationNeeded: boolean;
}

const TABS = [
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'credits', label: 'Credits', icon: ScrollText },
  { id: 'videos', label: 'Videos', icon: Clapperboard },
] as const;

type Tab = (typeof TABS)[number]['id'];

export default function AdminDashboard(props: Props) {
  const { email, initialPhotos, loadError, initialContent, initialCredits, initialVideos, migrationNeeded } = props;
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [tab, setTab] = useState<Tab>('photos');

  // Remember the tab across reloads (e.g. after running the migration).
  useEffect(() => {
    const saved = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === saved)) setTab(saved as Tab);
  }, []);
  function selectTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, '', `#${next}`);
  }

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] py-6">
        <div>
          <p className="flex items-baseline gap-0.5 text-lg font-bold tracking-[0.2em]">
            NK<span className="h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="ml-3 text-xs font-medium uppercase tracking-[0.3em] text-muted">Studio</span>
          </p>
          <p className="mt-1 text-xs text-muted">{email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white/80 transition-colors hover:border-gold hover:text-gold"
          >
            View site <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 border border-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.15em] text-white/80 transition-colors hover:border-red-400 hover:text-red-300"
          >
            Sign out <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <nav role="tablist" aria-label="Studio sections" className="-mx-5 mt-6 flex gap-1 overflow-x-auto border-b border-white/[0.06] px-5 sm:mx-0 sm:px-0">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${
                active ? 'border-gold text-gold' : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          );
        })}
      </nav>

      {/* Tabs stay mounted so unsaved edits survive switching. */}
      <div hidden={tab !== 'photos'}>
        {loadError && (
          <p role="alert" className="mt-6 border-l-2 border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Could not load photos: {loadError}
          </p>
        )}

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.06] bg-white/[0.06] sm:grid-cols-4">
          <Stat label="Total" value={photos.length} highlight />
          {CATEGORIES.map((c) => (
            <Stat key={c} label={CATEGORY_LABELS[c]} value={photos.filter((p) => p.category === c).length} />
          ))}
        </dl>

        <div className="mt-10">
          <AdminFeaturedImages
            photos={photos}
            onPhotosChange={setPhotos}
            initialSettings={initialContent.imageSettings}
            stageQuote={initialContent.stageQuote}
          />
        </div>

        <section className="mt-14">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-muted">Upload</h2>
          <UploadForm onUploaded={(photo) => setPhotos((prev) => [...prev, photo])} />
        </section>

        <section className="mt-14">
          <AdminPhotoGrid photos={photos} onPhotosChange={setPhotos} />
        </section>
      </div>

      {(['profile', 'credits', 'videos'] as const).map((id) => (
        <section key={id} hidden={tab !== id} className="mt-8">
          {migrationNeeded ? (
            <MigrationNotice />
          ) : id === 'profile' ? (
            <AdminProfileForm initial={initialContent} />
          ) : id === 'credits' ? (
            <AdminCredits initial={initialCredits} />
          ) : (
            <AdminVideos initial={initialVideos} />
          )}
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="bg-ink-950 px-5 py-4">
      <dt className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${highlight ? 'text-gold' : 'text-white'}`}>{value}</dd>
    </div>
  );
}
