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
  async redirects() {
    return [
      // ── Redirect old Civic News & Jobs pipeline URLs → /schemes ──
      // These were created by the now-deleted civic-news-pipeline and are
      // indexed by Google. 301 passes SEO equity and stops 404 errors.
      {
        source: '/jobs',
        destination: '/schemes',
        permanent: true,
      },
      {
        source: '/jobs/:slug',
        destination: '/schemes',
        permanent: true,
      },
      {
        source: '/news',
        destination: '/schemes',
        permanent: true,
      },
      {
        source: '/news/:slug',
        destination: '/schemes',
        permanent: true,
      },
      // Catch any budget/alert category articles that may have been indexed
      // The /articles/:slug redirect was removed because it was breaking the articles routing.
    ];
  },
};

module.exports = nextConfig;
