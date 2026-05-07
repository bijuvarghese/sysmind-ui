import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.154"],
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
