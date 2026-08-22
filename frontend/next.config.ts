import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    allowedDevOrigins: ['192.168.0.220', '192.168.64.17', 'localhost'],
    experimental: {
      turbopackFileSystemCacheForDev: true,
    },
    rewrites () {
      return [
        {
          source: "/backend/:path*",
          destination: `http://localhost:4000/api/:path*`,
        },
      ];
    },
};

export default nextConfig;
