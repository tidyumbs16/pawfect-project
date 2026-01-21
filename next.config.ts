import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ftnpmacfevlvboeohnkc.supabase.co", // 👈 ลิ้งก์ Supabase ของคุณ
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
