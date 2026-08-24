import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    reactCompiler: true,
    allowedDevOrigins: ['192.168.0.201', 'localhost'],
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
