import React from 'react';
import Link from 'next/link';
import { Landmark, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Landmark size={22} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                HaloDesa
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Portal pelayanan aspirasi, keluhan, dan pelaporan masyarakat desa
              secara transparan, cepat ditindaklanjuti, dan dapat dipantau langsung
              oleh seluruh warga.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 w-fit">
              <ShieldCheck size={14} />
              <span>Privasi Warga Terlindungi (Opsi Anonim)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Navigasi Layanan
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link
                  href="/lapor"
                  className="hover:text-emerald-400 transition-colors font-medium text-emerald-300"
                >
                  Kirim Aspirasi Baru
                </Link>
              </li>
              <li>
                <Link
                  href="/#transparansi"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Pantau Feed Transparansi
                </Link>
              </li>
              <li>
                <Link
                  href="/#pengumuman"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Papan Informasi & Pengumuman
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-emerald-400 transition-colors text-slate-400"
                >
                  Portal Masuk Aparatur Desa
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Kantor Pemerintah Desa
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Jl. Raya Utama Balai Desa No. 01, Kompleks Balai Desa, Kode Pos
                  55581
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={18} className="text-emerald-500 shrink-0" />
                <span>(0274) 123456 / WA: 0812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={18} className="text-emerald-500 shrink-0" />
                <span>pelayanan@halodesa.id</span>
              </li>
            </ul>
          </div>

          {/* Service Hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Jam Pelayanan Kantor
            </h3>
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Senin - Kamis</span>
                <span className="font-semibold text-emerald-400">08:00 - 15:30 WIB</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Jumat</span>
                <span className="font-semibold text-emerald-400">08:00 - 14:00 WIB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sabtu - Minggu</span>
                <span className="text-rose-400">Libur Layanan Fisik</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                *Pengaduan online melalui HaloDesa aktif 24 jam setiap hari dan diproses di hari kerja.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <p>© {new Date().getFullYear()} HaloDesa. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1 text-slate-300">
            Dikelola dengan <Heart size={13} className="text-rose-500 fill-rose-500 inline" /> untuk Pelayanan Warga Terbaik
          </p>
        </div>
      </div>
    </footer>
  );
};

