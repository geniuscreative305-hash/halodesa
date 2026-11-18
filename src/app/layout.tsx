import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HaloDesa - Layanan Aspirasi & Pengaduan Masyarakat Desa",
  description:
    "Sistem informasi aspirasi dan pengaduan warga desa secara transparan, cepat, dan tanggap.",
  keywords: [
    "HaloDesa",
    "Aspirasi Desa",
    "Pengaduan Masyarakat",
    "Pemerintah Desa",
    "Pelayanan Publik",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
