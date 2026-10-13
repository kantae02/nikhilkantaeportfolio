import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { Frame, Photo } from '../types';

/** What @react-pdf/renderer's <Image src> accepts for in-memory images. */
export type PdfImage = { data: Buffer; format: 'jpg' };

/** Pixels per PDF point — 2× keeps photos crisp when printed or zoomed. */
const DENSITY = 2;

async function loadBytes(url: string): Promise<Buffer> {
  // Bundled photos (lib/default-photos.ts) live under /public.
  if (url.startsWith('/')) return readFile(path.join(process.cwd(), 'public', url));
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Crops a photo exactly like the site does — object-fit: cover at the frame's
 * focus point, then zoomed around that point — and returns a JPEG sized for a
 * box of `width` × `height` PDF points, dimmed to `brightness` %. Works for any
 * upload format (WebP/AVIF too).
 */
export async function framedImage(photo: Photo, frame: Frame, width: number, height: number, brightness = 100): Promise<PdfImage> {
  const input = sharp(await loadBytes(photo.url)).rotate(); // honour EXIF orientation
  const { width: W = 1, height: H = 1 } = await input.metadata();

  // object-fit: cover — scale so the image covers the box, overflow is cropped.
  const s = Math.max(width / W, height / H);
  const px = frame.positionX / 100;
  const py = frame.positionY / 100;
  const coverLeft = ((W * s - width) * px) / s;
  const coverTop = ((H * s - height) * py) / s;

  // transform: scale(zoom) with transform-origin at the focus point.
  const z = frame.zoom / 100;
  const left = coverLeft + (px * width * (1 - 1 / z)) / s;
  const top = coverTop + (py * height * (1 - 1 / z)) / s;
  const cropW = width / z / s;
  const cropH = height / z / s;

  const clampRect = (x: number, size: number, max: number) => {
    const sz = Math.max(1, Math.min(Math.round(size), max));
    return { start: Math.min(Math.max(0, Math.round(x)), max - sz), size: sz };
  };
  const x = clampRect(left, cropW, W);
  const y = clampRect(top, cropH, H);

  const data = await input
    .extract({ left: x.start, top: y.start, width: x.size, height: y.size })
    .resize(Math.round(width * DENSITY), Math.round(height * DENSITY), { fit: 'fill' })
    .flatten({ background: '#111111' }) // PNG transparency → page colour
    .linear(brightness / 100, 0) // same as the site's image-brightness (opacity over black)
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  return { data, format: 'jpg' };
}

/** Like framedImage, but never throws — a broken image just leaves its box empty. */
export async function tryFramedImage(photo: Photo | undefined, frame: Frame, width: number, height: number, brightness = 100) {
  if (!photo) return undefined;
  try {
    return await framedImage(photo, frame, width, height, brightness);
  } catch (err) {
    console.error('[pdf] image failed', photo.url, err);
    return undefined;
  }
}
