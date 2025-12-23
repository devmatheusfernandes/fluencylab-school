import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* additional next config options can go here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        // Permite qualquer caminho do bucket (ex.: /<bucket>/<path>/**)
        pathname: '/**',
        // omitindo "search" permite qualquer query string (ex.: ?alt=media&token=...)
      },
      {
        protocol: 'https',
        hostname: 'getstream.io',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
