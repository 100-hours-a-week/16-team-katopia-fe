import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    qualities: [70, 75],
    remotePatterns: [
      // 기존 테스트용
      {
        protocol: "https",
        hostname: "picsum.photos",
      },

      // 🔥 FITCHECK 이미지 (CloudFront)
      {
        protocol: "https",
        hostname: "df1ez4kkj7703.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dygyjag00bi04.cloudfront.net",
        pathname: "/**",
      },
      // 🔥 FITCHECK 프로필 이미지 (API 도메인)
      {
        protocol: "https",
        hostname: "fitcheck.kr",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
