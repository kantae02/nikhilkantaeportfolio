import Reveal from './Reveal';

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  align?: 'left' | 'center';
}

export default function SectionHeading({ index, eyebrow, title, align = 'left' }: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <Reveal className={centered ? 'text-center' : undefined}>
      <p
        className={`mb-5 flex items-center gap-4 text-xs font-medium uppercase tracking-[0.35em] text-muted ${
          centered ? 'justify-center' : ''
        }`}
      >
        <span className="text-gold">{index}</span>
        <span className="h-px w-10 bg-gold/60" />
        {eyebrow}
      </p>
      <h2 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{title}</h2>
    </Reveal>
  );
}
