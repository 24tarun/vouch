import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: [
      "localhost:3000",
      "192.168.178.180:3000", // Your local IP
      "tas.tarunh.com",
    ],
  },
};

export default nextConfig;
