'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ?denied=1 → signed in with an account that isn't ADMIN_EMAIL.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('denied') && isSupabaseConfigured) {
      setError('This account does not have admin access.');
      createSupabaseBrowserClient().auth.signOut();
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add the env vars from .env.example.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace('/admin/dashboard');
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,197,24,0.12),transparent_70%)]" />

      <form onSubmit={onSubmit} className="relative w-full max-w-sm border border-white/[0.06] bg-ink-900/80 p-8 backdrop-blur sm:p-10">
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

        <p className="flex items-baseline gap-0.5 text-lg font-bold tracking-[0.2em]">
          NK<span className="h-1.5 w-1.5 rounded-full bg-gold" />
        </p>
        <h1 className="mt-6 text-2xl font-bold">Studio access</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage the gallery.</p>

        <label className="mt-8 block text-[10px] font-medium uppercase tracking-[0.3em] text-muted" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border border-white/10 bg-ink-950 px-4 py-3 text-sm outline-none transition-colors focus:border-gold"
        />

        <label className="mt-5 block text-[10px] font-medium uppercase tracking-[0.3em] text-muted" htmlFor="password">
          Password
        </label>
        <div className="relative mt-2">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-white/10 bg-ink-950 py-3 pl-4 pr-12 text-sm outline-none transition-colors focus:border-gold"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 border-l-2 border-red-500 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 bg-gold py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {loading ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
