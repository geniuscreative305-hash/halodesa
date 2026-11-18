import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static export untuk cPanel (hanya aktif saat `npm run build`)
  ...(isProd ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
  // trailingSlash hanya diperlukan untuk cPanel static export
  trailingSlash: isProd,
  // Mengizinkan akses dev dari network lokal / HP
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.137.1", "192.168.*.*"],
};

export default nextConfig;
