/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> renders into a PDF and has no alt attribute. */
import path from 'node:path';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { profile } from '../profile';
import { CREDIT_KIND_LABELS, type Credit, type SiteContent } from '../types';
import type { PdfImage } from './images';

/*
 * The downloadable portfolio, built from the same content and photos as the
 * site (served at /portfolio.pdf). Layout follows the original profile PDF:
 * A4 landscape, film-strip edges, dark pages with gold accents.
 */

const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts');
Font.register({
  family: 'Poppins',
  fonts: [
    { src: path.join(FONT_DIR, 'poppins-latin-300-normal.woff'), fontWeight: 300 },
    { src: path.join(FONT_DIR, 'poppins-latin-300-italic.woff'), fontWeight: 300, fontStyle: 'italic' },
    { src: path.join(FONT_DIR, 'poppins-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'poppins-latin-500-normal.woff'), fontWeight: 500 },
    { src: path.join(FONT_DIR, 'poppins-latin-600-normal.woff'), fontWeight: 600 },
    { src: path.join(FONT_DIR, 'poppins-latin-700-normal.woff'), fontWeight: 700 },
    { src: path.join(FONT_DIR, 'poppins-latin-800-normal.woff'), fontWeight: 800 },
  ],
});
Font.registerHyphenationCallback((word) => [word]); // never hyphenate names

// A4 landscape, in points.
export const PAGE_W = 841.89;
export const PAGE_H = 595.28;
const STRIP = 30;
const BODY_H = PAGE_H - STRIP * 2;

const GOLD = '#F5C518';
const INK = '#0d0d0d';
const MUTED = '#9a9a9a';

/** Box sizes the route crops each photo to (see app/portfolio.pdf/route.ts). */
export const BOXES = {
  cover: { w: PAGE_W * 0.48, h: BODY_H },
  details: { w: 300, h: 440 },
  stage: { w: PAGE_W - 120, h: BODY_H - 150 },
};

const TILE_GAP = 10;

/**
 * Character-profile tile size: up to 5 photos sit in one row of tall tiles,
 * 6–8 go in two rows of 4. Widths shrink to fit the page.
 */
export function tileBox(count: number) {
  const perRow = count <= 5 ? Math.max(count, 1) : 4;
  const w = Math.min(182, (PAGE_W - 80 - TILE_GAP * (perRow - 1)) / perRow);
  return { w, h: count <= 5 ? 400 : 196 };
}

export interface PortfolioData {
  content: SiteContent;
  credits: Credit[];
  images: {
    cover?: PdfImage;
    details?: PdfImage;
    stage?: PdfImage;
    tiles: { image?: PdfImage; caption: string }[];
    tileBox: { w: number; h: number };
  };
}

const s = StyleSheet.create({
  page: { backgroundColor: INK, fontFamily: 'Poppins', color: '#ffffff' },
  body: { position: 'absolute', top: STRIP, left: 0, right: 0, height: BODY_H },
  label: { fontSize: 8, letterSpacing: 2.4, textTransform: 'uppercase', color: MUTED },
});

export default function PortfolioDocument({ content, credits, images }: PortfolioData) {
  const roles = content.taglines.map((r) => r.replace(/\.$/, '')).filter(Boolean);
  const details = content.details.filter((d) => d.value.trim());
  const { phone, email, instagram } = content.contact;
  const contactLine = [phone, email, instagram && `@${instagram}`].filter(Boolean).join('   |   ');

  return (
    <Document title={`${profile.fullName} — Portfolio`} author={profile.fullName} subject="Actor portfolio">
      {/* 1. Cover */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <FilmStrips />
        <View style={s.body}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: GOLD }} />
          {images.cover && (
            <Image src={images.cover} style={{ position: 'absolute', right: 0, top: 0, width: BOXES.cover.w, height: BOXES.cover.h }} />
          )}
          <View style={{ position: 'absolute', left: 46, top: 0, bottom: 0, width: 380, justifyContent: 'center' }}>
            <Text style={{ fontSize: 58, fontWeight: 800, lineHeight: 1 }}>{profile.firstName}</Text>
            <Text style={{ fontSize: 70, fontWeight: 800, lineHeight: 1, color: GOLD }}>{profile.lastName}</Text>
            <View style={{ height: 2, width: 330, backgroundColor: '#ffffff', marginTop: 10 }} />
            <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, marginTop: 10, textTransform: 'uppercase' }}>
              {roles.join('  •  ')}
            </Text>
            {content.heroMotto && (
              <Text style={{ fontSize: 10, fontWeight: 300, fontStyle: 'italic', color: '#cfcfcf', marginTop: 16 }}>{content.heroMotto}</Text>
            )}
            {content.bio && (
              <Text style={{ fontSize: 9, fontWeight: 300, fontStyle: 'italic', color: MUTED, marginTop: 6, lineHeight: 1.5, width: 300 }}>
                {truncate(content.bio, 220)}
              </Text>
            )}
          </View>
          {contactLine && (
            <Text style={{ position: 'absolute', left: 46, bottom: 22, fontSize: 8.5, color: MUTED }}>{contactLine}</Text>
          )}
        </View>
      </Page>

      {/* 2. Details */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <FilmStrips />
        <View style={s.body}>
          <View style={{ position: 'absolute', right: 0, top: 0, width: 520, height: 360, backgroundColor: '#1f1a0c', borderBottomLeftRadius: 400 }} />
          {images.details && (
            <View style={{ position: 'absolute', left: 40, top: (BODY_H - BOXES.details.h) / 2, padding: 5, backgroundColor: '#2a2a2a', borderRadius: 10 }}>
              <Image src={images.details} style={{ width: BOXES.details.w, height: BOXES.details.h, borderRadius: 6 }} />
            </View>
          )}
          <View style={{ position: 'absolute', left: images.details ? 400 : 60, right: 40, top: 26 }}>
            <Text style={{ fontSize: 44, fontWeight: 700, color: GOLD, marginBottom: 14 }}>Details</Text>
            {details.map((d, i) => (
              <Row key={`${d.label}-${i}`} label={d.label} value={d.value} compact={details.length > 8} />
            ))}
            {content.skills.length > 0 && <Row label="Skills" value={content.skills.join(', ')} compact={details.length > 8} />}
            <View style={{ height: 1, backgroundColor: '#2a2a2a', marginVertical: 8 }} />
            {phone && <Row label="Contact" value={phone} compact />}
            {email && <Row label="Email" value={email} compact />}
            {instagram && <Row label="Instagram" value={`@${instagram}`} compact />}
          </View>
        </View>
      </Page>

      {/* 3. Stage Born */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <FilmStrips />
        <View style={s.body}>
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 50, fontWeight: 800, lineHeight: 1 }}>
              STAGE <Text style={{ color: GOLD }}>BORN</Text>
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 700, marginTop: 6, letterSpacing: 1 }}>
              <Text style={{ color: GOLD }}>READY FOR </Text>THE BIG SCREEN
            </Text>
          </View>
          <View style={{ position: 'absolute', left: 60, right: 60, top: 104, height: BOXES.stage.h, backgroundColor: '#000000' }}>
            {images.stage && <Image src={images.stage} style={{ width: BOXES.stage.w, height: BOXES.stage.h }} />}
            {content.stageQuote && (
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 10, paddingHorizontal: 40, backgroundColor: 'rgba(10,10,10,0.88)' }}>
                <Text style={{ fontSize: 9.5, fontStyle: 'italic', fontWeight: 300, textAlign: 'center', color: '#e6e6e6', lineHeight: 1.45 }}>
                  “{content.stageQuote}”
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>

      {/* 4. Credits */}
      {credits.length > 0 && (
        <Page size="A4" orientation="landscape" style={[s.page, { paddingTop: STRIP + 28, paddingBottom: STRIP + 24, paddingHorizontal: 56 }]} wrap>
          <FilmStrips fixed />
          <Text style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: GOLD }}>CREDITS</Text>
          <Text style={{ fontSize: 34, fontWeight: 700, marginBottom: 18 }}>
            Stage &amp; <Text style={{ color: GOLD }}>screen.</Text>
          </Text>
          {credits.map((c) => (
            <View key={c.id} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#262626', paddingVertical: 9 }}>
              <Text style={{ width: 60, fontSize: 10, fontWeight: 500, color: GOLD }}>{c.year || '—'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</Text>
                {(c.role || c.company || c.director) && (
                  <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 2 }}>
                    {[c.role && `Role: ${c.role}`, c.company, c.director && `Dir. ${c.director}`].filter(Boolean).join('   ·   ')}
                  </Text>
                )}
              </View>
              <Text style={[s.label, { fontSize: 7, borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }]}>
                {CREDIT_KIND_LABELS[c.kind] ?? c.kind}
              </Text>
            </View>
          ))}
        </Page>
      )}

      {/* 5. Character profile — the gallery, cropped like the site's tiles */}
      {images.tiles.length > 0 && (
        <Page size="A4" orientation="landscape" style={s.page}>
          <FilmStrips />
          <View style={s.body}>
            <Text style={{ position: 'absolute', right: 40, top: 14, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: GOLD }}>
              CHARACTER PROFILE
            </Text>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 62, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: TILE_GAP }}>
              {images.tiles.map((t, i) => {
                const box = images.tileBox;
                return (
                  <View key={i} style={{ width: box.w, height: box.h, backgroundColor: '#1c1c1c' }}>
                    {t.image && <Image src={t.image} style={{ width: box.w, height: box.h }} />}
                    {t.caption && (
                      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: 'rgba(8,8,8,0.78)' }}>
                        <Text style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2, color: GOLD, textTransform: 'uppercase' }}>{t.caption}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </Page>
      )}

      {/* 6. Thank you */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <FilmStrips />
        <View style={[s.body, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 62, fontWeight: 800 }}>THANK YOU</Text>
          <Text style={{ fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: 6, marginTop: 6 }}>
            —  {profile.fullName.toUpperCase()}  —
          </Text>
        </View>
        {contactLine && (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: STRIP + 16, paddingVertical: 9, backgroundColor: GOLD }}>
            <Text style={{ fontSize: 10, fontWeight: 700, color: '#000000', textAlign: 'center' }}>{contactLine}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

function Row({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: compact ? 7 : 11 }}>
      <Text style={{ width: 120, fontSize: compact ? 10 : 11.5, fontWeight: 300, color: MUTED }}>{label}:</Text>
      <Text style={{ flex: 1, fontSize: compact ? 10.5 : 12.5, fontWeight: 700 }}>{value}</Text>
    </View>
  );
}

/** Sprocket-hole strips along the top and bottom edge, like the site's film strip. */
function FilmStrips({ fixed }: { fixed?: boolean }) {
  const holes = Array.from({ length: Math.floor(PAGE_W / 34) + 1 });
  const strip = (top: number) => (
    <View fixed={fixed} style={{ position: 'absolute', left: 0, right: 0, top, height: STRIP, backgroundColor: '#050505', flexDirection: 'row', alignItems: 'center', paddingLeft: 9 }}>
      {holes.map((_, i) => (
        <View key={i} style={{ width: 16, height: 12, borderRadius: 2.5, backgroundColor: '#202020', marginRight: 18 }} />
      ))}
    </View>
  );
  return (
    <>
      {strip(0)}
      {strip(PAGE_H - STRIP)}
    </>
  );
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
