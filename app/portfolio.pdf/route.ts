import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getCredits, getSiteContent } from '@/lib/content';
import { resolvePhotos } from '@/lib/featured';
import { galleryFrame } from '@/lib/image-settings';
import { getPublicPhotos } from '@/lib/photos';
import { tryFramedImage } from '@/lib/pdf/images';
import PortfolioDocument, { BOXES, tileBox, type PortfolioData } from '@/lib/pdf/PortfolioDocument';
import { profile } from '@/lib/profile';

// Rebuilt at most every 5 minutes, and immediately when the studio saves
// anything (revalidateSite() in lib/revalidate.ts).
export const revalidate = 300;

const MAX_TILES = 8;

/** GET /portfolio.pdf — the downloadable portfolio, generated from the site's live content and photos. */
export async function GET() {
  const [uploaded, content, credits] = await Promise.all([getPublicPhotos(), getSiteContent(), getCredits()]);
  const { gallery, portrait, stagePhoto } = resolvePhotos(uploaded);

  // Details page: another portfolio shot (like the original), else the portrait again.
  const detailsPhoto = gallery.find((p) => p.category === 'portfolio' && p.id !== portrait?.id) ?? portrait;
  const tilePhotos = gallery.filter((p) => p.id !== portrait?.id).slice(0, MAX_TILES);
  const tiles = tileBox(tilePhotos.length);
  const { profile: profileFrame, stage: stageFrame } = content.imageSettings;

  const [cover, details, stage, ...tileImages] = await Promise.all([
    tryFramedImage(portrait, profileFrame, BOXES.cover.w, BOXES.cover.h),
    detailsPhoto && tryFramedImage(detailsPhoto, galleryFrame(detailsPhoto), BOXES.details.w, BOXES.details.h),
    tryFramedImage(stagePhoto, stageFrame, BOXES.stage.w, BOXES.stage.h, stageFrame.opacity),
    ...tilePhotos.map((p) => tryFramedImage(p, galleryFrame(p), tiles.w, tiles.h)),
  ]);

  const data: PortfolioData = {
    content,
    credits,
    images: {
      cover,
      details: details || undefined,
      stage,
      tiles: tilePhotos.map((p, i) => ({ image: tileImages[i], caption: p.caption })),
      tileBox: tiles,
    },
  };

  const pdf = await renderToBuffer(createElement(PortfolioDocument, data) as Parameters<typeof renderToBuffer>[0]);

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${profile.fullName} - Portfolio.pdf"`,
    },
  });
}
