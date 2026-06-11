import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the tracing root to this project (a stray parent lockfile can confuse
  // Next's workspace-root inference).
  outputFileTracingRoot: process.cwd(),
  // Lint is run explicitly via `npm run lint`; don't fail production builds on it.
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Server Actions are used for all mutations.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
