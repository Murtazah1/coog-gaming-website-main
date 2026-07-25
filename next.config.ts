import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "/Users/murtazahusain/Documents/Github/coog-gaming-website-main",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wjtwerfwyqeroxtxgyzp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
