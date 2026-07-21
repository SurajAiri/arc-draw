import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Excalidraw ships as ESM — Next.js needs to transpile it
  transpilePackages: ["@excalidraw/excalidraw"],
  // argon2 and pg use native Node.js modules — keep them server-side only
  serverExternalPackages: ["argon2", "pg"],
};

export default nextConfig;
