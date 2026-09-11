import withPWA from '@ducanh2912/next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Enable SW always so share target works on local network
  disable: false,
  // Merge our custom share-target handler into the generated service worker
  customWorkerSrc: 'worker',
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'allspend-offline',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
})(nextConfig);
