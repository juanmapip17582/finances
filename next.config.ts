import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Turbopack's persistent build cache (on by default since 16.3.0) has been
  // serving stale compiled output on Vercel across deploys — restored from
  // ".next/cache/turbopack" even after source changes. Disabled until that's
  // trustworthy again.
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
