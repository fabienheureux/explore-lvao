import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // No basePath needed for custom domain
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence the warning
  turbopack: {},
  experimental: {
    // Enable WASM support
    webpackBuildWorker: true,
  },
};

export default nextConfig;
