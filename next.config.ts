import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
  serverExternalPackages: [
    "sequelize",
    "mysql2",
    "archiver",
    "bcrypt",
    "jsonwebtoken",
    "music-metadata",
    "node-id3",
    "uuid",
  ],
};

export default nextConfig;
