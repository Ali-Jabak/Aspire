import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma client is only used server-side; exclude from Edge bundling
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
