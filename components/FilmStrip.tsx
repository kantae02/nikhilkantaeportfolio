export default function FilmStrip({ reverse = false }: { reverse?: boolean }) {
  return <div aria-hidden className={`film-strip w-full ${reverse ? 'film-strip-reverse' : ''}`} />;
}
