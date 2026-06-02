import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep `ws` (provided to Supabase as the WebSocket transport on Node < 22)
  // as an external server package instead of bundling it.
  serverExternalPackages: ['ws'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.wikimedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
    ],
  },
};

export default withNextIntl(nextConfig);
