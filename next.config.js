/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to allow API routes to function while keeping SSG for pages
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
};

module.exports = nextConfig;
