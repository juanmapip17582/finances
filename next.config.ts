import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Prisma loads its query engine binary dynamically at runtime, so Next's
  // static tracing misses it — without this, the serverless bundle on
  // Vercel doesn't include libquery_engine-rhel-openssl-3.0.x.so.node.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default nextConfig;
