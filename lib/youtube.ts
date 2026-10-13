const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-character video id from any common YouTube link
 * (youtu.be/…, watch?v=…, /shorts/…, /embed/…, /live/…) or a bare id.
 * Returns null when nothing valid is found.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let candidate: string | null = null;

  if (host === 'youtu.be') {
    candidate = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    candidate = url.searchParams.get('v');
    if (!candidate) {
      const [, kind, id] = url.pathname.split('/');
      if (['shorts', 'embed', 'live', 'v'].includes(kind)) candidate = id ?? null;
    }
  }

  return candidate && ID_RE.test(candidate) ? candidate : null;
}

export const isYouTubeId = (value: unknown): value is string => typeof value === 'string' && ID_RE.test(value);
