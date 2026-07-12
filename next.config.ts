import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/leetcode-graphql",
        destination: "https://leetcode.com/graphql",
      },
    ];
  },
};

export default nextConfig;
