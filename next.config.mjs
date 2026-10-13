/** @type {import('next').NextConfig} */

// Allow next/image to optimise photos served from the project's Supabase Storage.
const remotePatterns = [
  { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
  { protocol: 'https', hostname: 'i.ytimg.com' },
];

try {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  // Custom domains or a local Supabase instance (http://127.0.0.1:54321).
  if (!url.hostname.endsWith('.supabase.co')) {
    remotePatterns.push({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: url.port,
      pathname: '/storage/v1/object/public/**',
    });
  }
} catch {
  // Env not set yet — the default pattern above still covers hosted Supabase.
}

const nextConfig = {
  images: { remotePatterns },
  experimental: {
    // Generated portfolio PDF (app/portfolio.pdf): keep react-pdf out of the bundle,
    // and ship the fonts + bundled photos it reads from disk.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    outputFileTracingIncludes: {
      '/portfolio.pdf': ['./assets/fonts/**', './public/images/**'],
    },
  },
};

export default nextConfig;
