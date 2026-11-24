import path from "node:path";
import { fileURLToPath } from "node:url";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Invite links carry tokens in the URL; never leak them via the Referer header.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A package-lock.json in a parent directory confuses Next's workspace-root detection.
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)),
  poweredByHeader: false,
  experimental: {
    // Contestant photo uploads go through server actions (default limit is 1 MB).
    // Must stay above MAX_UPLOAD_BYTES in src/lib/photo-processing.js plus form overhead.
    serverActions: { bodySizeLimit: "11mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
