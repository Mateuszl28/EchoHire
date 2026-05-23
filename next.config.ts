import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript stays strict via tsc; ESLint stylistic rules
  // (no-empty-object-type, etc.) shouldn't block Vercel deploys.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
