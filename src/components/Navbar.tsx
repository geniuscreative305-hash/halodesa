'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Landmark,
  PlusCircle,
  UserCheck,
  Menu,
  X,
  PhoneCall,
  FileSpreadsheet,
  Megaphone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(Boolean(session));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group active:scale-98 transition-transform">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 group-hover:scale-105 group-hover:shadow-emerald-600/35 transition-all duration-300">
              <Landmark className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  HaloDesa
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
                  </span>
                  Resmi
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal hidden sm:block">
                Layanan Aspirasi & Pengaduan Warga Desa
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'text-emerald-800 bg-emerald-50 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Beranda
            </Link>
            <Link
              href="/#transparansi"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
            >
              Transparansi Aspirasi
            </Link>
            <Link
              href="/#pengumuman"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
            >
              Pengumuman
            </Link>
            <Link
              href="/#kontak-darurat"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
            >
              Kontak Darurat
            </Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/lapor"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4.5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm shadow-emerald-600/30 hover:shadow-md hover:shadow-emerald-600/20"
            >
              <PlusCircle size={16} />
              <span>Kirim Aspirasi</span>
            </Link>

            <Link
              href={isLoggedIn ? '/admin' : '/login'}
              className="inline-flex items-center gap-1.5 border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:scale-95 text-slate-700 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-2xs"
              title={isLoggedIn ? 'Buka Dashboard Admin' : 'Login Perangkat Desa'}
            >
              <UserCheck size={16} className="text-emerald-600" />
              <span>{isLoggedIn ? 'Dashboard Desa' : 'Aparatur Desa'}</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/lapor"
              className="inline-flex items-center gap-1.5 bg-emerald-600 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-xs"
            >
              <PlusCircle size={14} />
              <span>Lapor</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl transition-all"
              aria-label="Buka Menu"
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Landmark size={18} className="text-emerald-600" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/#transparansi"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            <span>Transparansi Aspirasi</span>
          </Link>
          <Link
            href="/#pengumuman"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Megaphone size={18} className="text-emerald-600" />
            <span>Pengumuman Desa</span>
          </Link>
          <Link
            href="/#kontak-darurat"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <PhoneCall size={18} className="text-emerald-600" />
            <span>Kontak Darurat</span>
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/lapor"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm text-center shadow-sm"
            >
              <PlusCircle size={16} />
              <span>Kirim Aspirasi / Aduan</span>
            </Link>
            <Link
              href={isLoggedIn ? '/admin' : '/login'}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium text-sm text-center hover:bg-slate-50"
            >
              <UserCheck size={16} className="text-emerald-600" />
              <span>{isLoggedIn ? 'Masuk ke Dashboard Desa' : 'Login Aparatur Desa'}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

