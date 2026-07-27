/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Vercel can proxy the Hub at the edge even when its API-function runtime
    // is unavailable for this project. Local development keeps the API route
    // so its request logging remains available.
    if (process.env.VERCEL) {
      return {
        beforeFiles: [
          {
            source: "/api/music-hub/:path*",
            destination: "http://154.36.187.103:8787/:path*",
          },
        ],
      };
    }
    return [];
  },
}

module.exports = nextConfig
