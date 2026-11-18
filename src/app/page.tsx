'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Filter,
  Megaphone,
  PhoneCall,
  User,
  Shield,
  MapPin,
  Calendar,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { AspirationDetailModal } from '@/components/AspirationDetailModal';
import { TicketTrackModal } from '@/components/TicketTrackModal';
import { Aspiration, Category, Announcement, AspirationStatus, EmergencyContact } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  MOCK_ASPIRATIONS,
  MOCK_CATEGORIES,
  MOCK_ANNOUNCEMENTS,
  EMERGENCY_CONTACTS,
} from '@/lib/mock-data';

export default function HomePage() {
  // State
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(EMERGENCY_CONTACTS as any);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  // Modals
  const [selectedAspiration, setSelectedAspiration] = useState<Aspiration | null>(null);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [heroSearchInput, setHeroSearchInput] = useState('');

  // Fetch data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          // Fetch categories
          const { data: catData } = await supabase
            .from('categories')
            .select('*')
            .order('id', { ascending: true });
          if (catData && catData.length > 0) {
            setCategories(catData as Category[]);
          } else {
            setCategories(MOCK_CATEGORIES);
          }

          // Fetch aspirations
          const { data: aspData } = await supabase
            .from('aspirations')
            .select('*, categories(*)')
            .order('created_at', { ascending: false });
          if (aspData && aspData.length > 0) {
            setAspirations(aspData as Aspiration[]);
          } else {
            setAspirations(MOCK_ASPIRATIONS);
          }

          // Fetch announcements
          const { data: annData } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          if (annData && annData.length > 0) {
            setAnnouncements(annData as Announcement[]);
          } else {
            setAnnouncements(MOCK_ANNOUNCEMENTS);
          }

          // Fetch emergency contacts
          const { data: ecData } = await supabase
            .from('emergency_contacts')
            .select('*')
            .order('id', { ascending: true });
          if (ecData && ecData.length > 0) {
            setEmergencyContacts(ecData as EmergencyContact[]);
          } else {
            setEmergencyContacts(EMERGENCY_CONTACTS as any);
          }
        } catch {
          setCategories(MOCK_CATEGORIES);
          setAspirations(MOCK_ASPIRATIONS);
          setAnnouncements(MOCK_ANNOUNCEMENTS);
          setEmergencyContacts(EMERGENCY_CONTACTS as any);
        }
      } else {
        setCategories(MOCK_CATEGORIES);
        setAspirations(MOCK_ASPIRATIONS);
        setAnnouncements(MOCK_ANNOUNCEMENTS);
        setEmergencyContacts(EMERGENCY_CONTACTS as any);
      }
      setLoading(false);
    }

    loadData();

    // Supabase Realtime Subscription if configured
    if (isSupabaseConfigured) {
      const channelAspirations = supabase
        .channel('realtime_aspirations')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'aspirations' },
          () => loadData()
        )
        .subscribe();

      const channelAnnouncements = supabase
        .channel('realtime_announcements')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'announcements' },
          () => loadData()
        )
        .subscribe();

      const channelContacts = supabase
        .channel('realtime_contacts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'emergency_contacts' },
          () => loadData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channelAspirations);
        supabase.removeChannel(channelAnnouncements);
        supabase.removeChannel(channelContacts);
      };
    }
  }, []);

  // Realtime Statistics counts
  const stats = useMemo(() => {
    const total = aspirations.length;
    const menunggu = aspirations.filter((a) => a.status === 'menunggu').length;
    const diproses = aspirations.filter((a) => a.status === 'diproses').length;
    const selesai = aspirations.filter((a) => a.status === 'selesai').length;
    const ditolak = aspirations.filter((a) => a.status === 'ditolak').length;
    return { total, menunggu, diproses, selesai, ditolak };
  }, [aspirations]);

  // Filtered aspirations for transparency feed
  const filteredAspirations = useMemo(() => {
    return aspirations.filter((item) => {
      // Status filter
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && String(item.category_id) !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.judul.toLowerCase().includes(query);
        const matchTicket = item.nomor_tiket.toLowerCase().includes(query);
        const matchDesc = item.deskripsi.toLowerCase().includes(query);
        const matchLocation = item.alamat_lokasi.toLowerCase().includes(query);
        if (!matchTitle && !matchTicket && !matchDesc && !matchLocation) {
          return false;
        }
      }
      return true;
    });
  }, [aspirations, selectedStatus, selectedCategory, searchQuery]);

  const displayedAspirations = useMemo(() => {
    return filteredAspirations.slice(0, visibleCount);
  }, [filteredAspirations, visibleCount]);

  const handleHeroTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchInput.trim()) {
      setTrackModalOpen(true);
    }
  };

  const formatDateShort = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Supabase connection banner indicator if still unconfigured */}
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-2 text-xs text-amber-900 text-center flex items-center justify-center gap-2">
          <Info size={14} className="text-amber-700 shrink-0" />
          <span>
            Mode Pratinjau Demo Aktif. Data tersambung dengan sampel lokal. Untuk menghubungkan ke database live, masukkan kredensial Supabase Anda di{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-semibold">.env.local</code>.
          </span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white py-16 lg:py-24">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[350px] bg-emerald-500/20 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-400/15 blur-[90px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/15 blur-[90px] pointer-events-none rounded-full" />

        {/* Subtle decorative grid pattern with radial mask */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-100 text-xs font-medium shadow-inner backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Portal Resmi Pengaduan & Aspirasi Masyarakat Desa</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Suara Warga Membangun Desa Lebih <span className="bg-gradient-to-r from-emerald-300 to-teal-100 bg-clip-text text-transparent">Maju & Terbuka</span>
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed font-normal max-w-2xl mx-auto">
              Sampaikan aspirasi, keluhan fasilitas, atau laporan pelayanan desa secara langsung. Tanpa ribet, dapat memilih opsi anonim, dan dipantau tindak lanjutnya secara transparan.
            </p>

            {/* Action CTA & Search Bar Box */}
            <div className="pt-2 max-w-2xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/lapor"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 active:scale-95 text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all hover:-translate-y-0.5 text-base"
                >
                  <PlusCircle size={20} className="text-slate-950" />
                  <span>Kirim Aspirasi / Laporan</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setTrackModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/25 font-semibold px-6 py-3.5 rounded-2xl backdrop-blur-md transition-all text-base shadow-sm"
                >
                  <Search size={18} />
                  <span>Lacak Nomor Tiket</span>
                </button>
              </div>

              {/* Quick Ticket Search Input inside Hero */}
              <form
                onSubmit={handleHeroTrackSubmit}
                className="relative max-w-lg mx-auto pt-2"
              >
                <div className="relative flex items-center group">
                  <input
                    type="text"
                    value={heroSearchInput}
                    onChange={(e) => setHeroSearchInput(e.target.value)}
                    placeholder="Punya nomor tiket? Ketik misal: HLD-2026-0001"
                    className="w-full pl-11 pr-24 py-3.5 bg-white/10 border border-emerald-400/30 rounded-2xl text-white placeholder-emerald-200/60 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-300 focus:bg-white/20 backdrop-blur-md transition-all shadow-inner"
                  />
                  <Search
                    size={18}
                    className="absolute left-4 text-emerald-300/80 pointer-events-none group-focus-within:text-emerald-200 transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Lacak
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Realtime Statistics Banner (Grid 2-4 Kolom Anti-Tumpuk) */}
      <section className="-mt-8 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Total */}
          <div className="ambient-card-hover bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-4 border-t-slate-700 shadow-md shadow-slate-200/50 flex items-center gap-3.5 sm:gap-4 relative overflow-hidden group">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <FileText size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Aduan
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {stats.total}
              </h3>
            </div>
          </div>

          {/* Card 2: Menunggu */}
          <div className="ambient-card-hover bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-4 border-t-amber-500 shadow-md shadow-slate-200/50 flex items-center gap-3.5 sm:gap-4 relative overflow-hidden group">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs group-hover:scale-105 transition-transform">
              <Clock size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <span>Menunggu</span>
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {stats.menunggu}
              </h3>
            </div>
          </div>

          {/* Card 3: Diproses */}
          <div className="ambient-card-hover bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-4 border-t-sky-500 shadow-md shadow-slate-200/50 flex items-center gap-3.5 sm:gap-4 relative overflow-hidden group">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-800 flex items-center justify-center shrink-0 border border-sky-200/60 shadow-2xs group-hover:scale-105 transition-transform">
              <RefreshCw size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-sky-700 uppercase tracking-wider">
                Diproses
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {stats.diproses}
              </h3>
            </div>
          </div>

          {/* Card 4: Selesai */}
          <div className="ambient-card-hover bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-t-4 border-t-emerald-600 shadow-md shadow-slate-200/50 flex items-center gap-3.5 sm:gap-4 relative overflow-hidden group">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Selesai
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {stats.selesai}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: 2-Column Responsive Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Transparency Feed */}
          <div id="transparansi" className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>Feed Transparansi Warga</span>
                  <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {filteredAspirations.length} Laporan
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pantau penanganan aduan masyarakat secara terbuka & real-time
                </p>
              </div>

              {/* Status Filter Tab Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setVisibleCount(6);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                    selectedStatus === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-100/80'
                  }`}
                >
                  <span>Semua</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStatus === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {aspirations.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('menunggu');
                    setVisibleCount(6);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                    selectedStatus === 'menunggu'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-800 border border-amber-200/80 hover:bg-amber-50/60'
                  }`}
                >
                  <span>Menunggu</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStatus === 'menunggu'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stats.menunggu}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('diproses');
                    setVisibleCount(6);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                    selectedStatus === 'diproses'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-sky-800 border border-sky-200/80 hover:bg-sky-50/60'
                  }`}
                >
                  <span>Diproses</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStatus === 'diproses'
                        ? 'bg-sky-500 text-white'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {stats.diproses}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus('selesai');
                    setVisibleCount(6);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 ${
                    selectedStatus === 'selesai'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-800 border border-emerald-200/80 hover:bg-emerald-50/60'
                  }`}
                >
                  <span>Selesai</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedStatus === 'selesai'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {stats.selesai}
                  </span>
                </button>
              </div>
            </div>

            {/* Filter Bar: Category & Search */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full group">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul masalah, nomor tiket, atau lokasi..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Dropdown */}
              <div className="w-full sm:w-60 shrink-0 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setVisibleCount(6);
                  }}
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer shadow-2xs"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nama_kategori}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Aspirations Card Feed */}
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
                <RefreshCw size={26} className="animate-spin mx-auto mb-3 text-emerald-600" />
                <span className="font-medium text-slate-600">Memuat data aspirasi desa terkini...</span>
              </div>
            ) : displayedAspirations.length > 0 ? (
              <div className="space-y-4">
                {displayedAspirations.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => setSelectedAspiration(item)}
                    className="ambient-card-hover bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-300 px-2.5 py-1 rounded-lg shadow-2xs">
                          {item.nomor_tiket}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CategoryIcon
                            iconName={item.categories?.ikon}
                            size={12}
                            className="text-emerald-600"
                          />
                          {item.categories?.nama_kategori || 'Umum'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        {formatDateShort(item.created_at)}
                      </span>
                    </div>

                    {/* Content & Thumbnail Layout */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          {item.judul}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {item.deskripsi}
                        </p>
                      </div>

                      {item.foto_bukti_url && (
                        <div className="w-full sm:w-28 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70 relative shadow-2xs">
                          <img
                            src={item.foto_bukti_url}
                            alt="Bukti Laporan"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>

                    {/* Footer Row of Card */}
                    <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="flex items-center gap-2">
                          {item.is_anonim ? (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Shield size={12} />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs uppercase">
                              {item.nama_pelapor ? item.nama_pelapor[0] : 'W'}
                            </div>
                          )}
                          <span className="text-slate-700 font-medium">
                            {item.is_anonim ? (
                              <span className="text-emerald-800 font-semibold">
                                Warga Desa (Anonim)
                              </span>
                            ) : (
                              item.nama_pelapor
                            )}
                          </span>
                        </div>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span className="hidden sm:flex items-center gap-1 text-slate-600 font-normal">
                          <MapPin size={13} className="text-slate-400" />
                          {item.dusun_rt}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                        <span>Lihat Tanggapan</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </article>
                ))}

                {/* Load More Button */}
                {visibleCount < filteredAspirations.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 6)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Muat Lebih Banyak ({filteredAspirations.length - visibleCount} tersisa)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search size={22} />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Tidak Ditemukan Laporan Sesuai Kriteria
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                  Coba sesuaikan kata kunci pencarian atau ubah filter status dan kategori di atas.
                </p>
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Reset Semua Filter
                </button>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Announcements & Emergency Contacts Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Papan Pengumuman Desa */}
            <div id="pengumuman" className="ambient-card-hover bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 flex items-center justify-center shadow-2xs">
                    <Megaphone size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pengumuman Desa
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Informasi resmi dari kantor balai desa
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-3.5 bg-slate-50/90 hover:bg-slate-100/90 rounded-xl border border-slate-200/70 transition-all hover:-translate-y-0.5 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md shadow-2xs">
                          {ann.kategori_info}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatDateShort(ann.created_at)}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {ann.judul}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                        {ann.konten}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Belum ada pengumuman terbaru saat ini.
                  </p>
                )}
              </div>
            </div>

            {/* Kontak Darurat Desa */}
            <div id="kontak-darurat" className="ambient-card-hover bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 flex items-center justify-center shadow-2xs">
                  <PhoneCall size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Kontak Darurat Desa
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bantuan cepat situasi mendesak warga
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {emergencyContacts.map((contact, idx) => (
                  <a
                    key={idx}
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group active:scale-98 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                          {contact.name}
                        </span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shadow-2xs">
                          {contact.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{contact.role}</p>
                      <p className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
                        {contact.phone}
                      </p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Helper Card for cPanel & Mobile readiness */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded text-emerald-200">
                Standar Kredibel
              </span>
              <h4 className="text-sm font-bold text-white">
                Siap untuk Semua Perangkat & Hosting cPanel
              </h4>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Aplikasi ini dibangun dengan arsitektur Static Export 100% kompatibel dengan Shared Hosting cPanel dan backend Supabase siap integrasi Flutter.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Detail Aspiration Modal */}
      {selectedAspiration && (
        <AspirationDetailModal
          aspiration={selectedAspiration}
          onClose={() => setSelectedAspiration(null)}
        />
      )}

      {/* Ticket Track Modal */}
      <TicketTrackModal
        initialTicket={heroSearchInput}
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
      />
    </div>
  );
}
