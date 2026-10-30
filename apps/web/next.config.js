/** @type {import('next').NextConfig} */
// Where the Next server reaches FastAPI; the browser only ever talks to /backend.
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");

const nextConfig = {
  skipTrailingSlashRedirect: true,
  output: "standalone",
  // Without this, Next walks up looking for a workspace root and nests the
  // standalone output under whatever it finds - locally that produced
  // .next/standalone/iqe/apps/web/server.js, while a Docker build with this
  // directory as the context would produce .next/standalone/server.js. The
  // Dockerfile cannot copy a path that moves. Pinning the root to this app
  // makes the layout the same either way.
  outputFileTracingRoot: __dirname,
  experimental: { optimizePackageImports: ["axios"] },
  async redirects() {
    // Old misspelled route kept working for bookmarks
    return [{ source: "/pms-formates", destination: "/pms-formats", permanent: true }];
  },
  async rewrites() {
    return [
      // The trailing-slash rule must come first. FastAPI declares most routes
      // as "/" under their prefix, so forwarding "/backend/api/v1/regions"
      // makes it answer 307 with an absolute Location on the API's own public
      // host. The browser then blocks that hop as mixed content (https -> http)
      // and drops Authorization on the cross-origin redirect, so the page ends
      // up with no data. Matching the slash here keeps the proxied path exactly
      // as the client sent it, and no redirect happens.
      { source: "/backend/:path*/", destination: `${BACKEND_URL}/:path*/` },
      { source: "/backend/:path*", destination: `${BACKEND_URL}/:path*` },
      // Short links printed as QR codes on reports
      { source: "/v/:code", destination: `${BACKEND_URL}/v/:code` },
    ];
  },
};

module.exports = nextConfig;
