import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* additional next config options can go here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        // Ex.: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/**
        pathname: '/v0/b/**',
        // omitindo "search" permite qualquer query string (ex.: ?alt=media&token=...)
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
