import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    reactCompiler: true,
    allowedDevOrigins: ['192.168.0.201', 'localhost'],
    experimental: {
      turbopackFileSystemCacheForDev: true,
    },
};

export default nextConfig;
