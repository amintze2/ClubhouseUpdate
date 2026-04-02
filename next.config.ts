import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://alpb-analytics.com https://www.alpb-analytics.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
