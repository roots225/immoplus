import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" produit un serveur autonome — requis pour l'image Docker
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
