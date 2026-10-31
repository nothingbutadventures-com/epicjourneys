import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load these from node_modules at runtime instead of bundling them (the Firebase admin library does not bundle cleanly).
  serverExternalPackages: ["firebase-admin"],
  // Opening the app via 127.0.0.1 or the LAN address would otherwise block the dev HMR socket and freeze client navigation.
  allowedDevOrigins: ["127.0.0.1", "*.local"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
