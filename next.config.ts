import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Suppress DeprecationWarning: url.parse() behavior is not standardized
if (typeof process !== "undefined") {
  const originalEmit = process.emit;
  // @ts-ignore
  process.emit = (name, data, ...args) => {
    if (
      name === "warning" &&
      typeof data === "object" &&
      data &&
      "name" in data &&
      data.name === "DeprecationWarning" &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.includes("url.parse()")
    ) {
      return false;
    }
    return (originalEmit as any).apply(process, [name, data, ...args]);
  };
}

// 1. Configuração do PWA
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  importScripts: ["/custom-sw.js"],
});

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@google-cloud/monitoring",
    "google-gax",
    "@grpc/grpc-js",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "getstream.io",
      },
      {
        protocol: "https",
        hostname: "www.transparenttextures.com",
        pathname: "/patterns/cubes.png",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
          },
          // {
          //   key: 'Content-Security-Policy',
          //   value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://firebasestorage.googleapis.com https://storage.googleapis.com https://getstream.io https://*.stream-io-api.com https://www.transparenttextures.com https://*.stream-io-cdn.com https://getstream.imgix.net https://i.ytimg.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'self' https://www.youtube.com https://youtube.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.stream-io-api.com https://*.getstream.io wss://*.stream-io-api.com https://lrclib.net; media-src 'self' blob: https://*.stream-io-api.com https://*.getstream.io https://*.stream-io-cdn.com https://lrclib.net https://api.dictionaryapi.dev https://firebasestorage.googleapis.com https://storage.googleapis.com"
          // }
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withPWA(withNextIntl(nextConfig));
