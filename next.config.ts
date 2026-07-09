import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dofusdu.de", pathname: "/dofus3/v1/img/**" },
    ],
  },
};

export default nextConfig;
