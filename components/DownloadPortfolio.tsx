import { Download } from 'lucide-react';
import { profile } from '@/lib/profile';

/** Gold outline button that downloads the portfolio PDF. */
export default function DownloadPortfolio({ href, className = '' }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      download={`${profile.fullName} - Portfolio.pdf`}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-3 whitespace-nowrap border border-gold/60 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold sm:px-7 sm:py-4 sm:tracking-[0.25em] transition-colors duration-500 ease-cinematic hover:bg-gold hover:text-black ${className}`}
    >
      <Download className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5" />
      Download portfolio
      <span className="text-[10px] font-medium tracking-[0.2em] opacity-60">PDF</span>
    </a>
  );
}
