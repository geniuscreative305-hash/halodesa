'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  UploadCloud,
  ImageIcon,
  X,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  AlertCircle,
  Loader2,
  Info,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Category } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { compressImage, formatFileSize, CompressionResult } from '@/lib/image-compressor';
import { MOCK_CATEGORIES } from '@/lib/mock-data';

export default function LaporPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [namaPelapor, setNamaPelapor] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [noWa, setNoWa] = useState('');
  const [dusunRt, setDusunRt] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [alamatLokasi, setAlamatLokasi] = useState('');

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // Image compression & upload state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          setCategories(data as Category[]);
          setCategoryId(data[0].id);
          return;
        }
      }
      setCategories(MOCK_CATEGORIES);
      if (MOCK_CATEGORIES.length > 0) {
        setCategoryId(MOCK_CATEGORIES[0].id);
      }
    }
    fetchCategories();
  }, []);

  // Handle image file selection & automatic Canvas compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setErrorMessage('');
      const result = await compressImage(file, 1280, 1280, 0.8);
      setCompressionResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses gambar.';
      setErrorMessage(msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    if (compressionResult?.previewUrl) {
      URL.revokeObjectURL(compressionResult.previewUrl);
    }
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!namaPelapor.trim()) {
      setErrorMessage('Harap isi Nama Lengkap Anda.');
      return;
    }
    if (!noWa.trim()) {
      setErrorMessage('Harap isi Nomor WhatsApp aktif yang dapat dihubungi.');
      return;
    }
    if (!dusunRt.trim()) {
      setErrorMessage('Harap isi Wilayah Dusun / RT / RW tempat kejadian.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Harap pilih kategori laporan.');
      return;
    }
    if (!judul.trim()) {
      setErrorMessage('Harap isi Judul singkat pengaduan / aspirasi.');
      return;
    }
    if (!deskripsi.trim()) {
      setErrorMessage('Harap jelaskan rincian permasalahan.');
      return;
    }
    if (!alamatLokasi.trim()) {
      setErrorMessage('Harap berikan lokasi spesifik atau patokan tempat.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedPhotoUrl: string | null = null;

      // 1. Upload photo if present
      if (compressionResult && isSupabaseConfigured) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `aspirations/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('halodesa-media')
          .upload(filePath, compressionResult.file, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('halodesa-media')
            .getPublicUrl(filePath);
          uploadedPhotoUrl = publicData.publicUrl;
        } else {
          console.warn('Gagal upload gambar ke bucket Supabase, melanjutkan tanpa foto:', uploadError.message);
        }
      }

      // 2. Insert to aspirations table
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('aspirations')
          .insert({
            nama_pelapor: namaPelapor.trim(),
            no_wa: noWa.trim(),
            dusun_rt: dusunRt.trim(),
            is_anonim: isAnonim,
            category_id: Number(categoryId),
            judul: judul.trim(),
            deskripsi: deskripsi.trim(),
            alamat_lokasi: alamatLokasi.trim(),
            foto_bukti_url: uploadedPhotoUrl,
            status: 'menunggu',
          })
          .select('nomor_tiket')
          .single();

        if (error) {
          throw new Error(error.message || 'Gagal menyimpan aspirasi ke database.');
        }

        setSuccessTicket(data?.nomor_tiket || 'HLD-' + new Date().getFullYear() + '-0001');
      } else {
        // Fallback demo simulation
        const fakeYear = new Date().getFullYear();
        const fakeNumber = String(Math.floor(Math.random() * 8999) + 1000);
        const generatedTicket = `HLD-${fakeYear}-${fakeNumber}`;
        setSuccessTicket(generatedTicket);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat mengirim laporan. Silakan coba kembali.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTicket = () => {
    if (!successTicket) return;
    navigator.clipboard.writeText(successTicket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToWhatsApp = () => {
    if (!successTicket) return;
    const text = encodeURIComponent(
      `Halo Kantor Desa, saya telah mengirim laporan via HaloDesa dengan Nomor Tiket: ${successTicket}\nJudul: "${judul}"\nMohon bantuannya untuk ditindaklanjuti. Terima kasih!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Beranda Utama</span>
        </Link>

        {/* Page Title & Guideline Card */}
        <div className="ambient-card-hover bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Formulir Terbuka Warga Desa
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">
                Sampaikan Aspirasi & Pengaduan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Warga desa dapat langsung melapor tanpa perlu mendaftar akun. Kerahasiaan data Anda terlindungi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs hover:bg-slate-100/70 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Shield size={17} />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">Opsi Anonim</strong>
                <span className="text-slate-500 leading-relaxed">Nama Anda disamarkan dari feed publik bila memilih opsi anonim.</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs hover:bg-slate-100/70 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles size={17} />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">Kompresi Cepat</strong>
                <span className="text-slate-500 leading-relaxed">Foto bukti dikompresi otomatis di browser agar hemat kuota internet.</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 shadow-2xs hover:bg-slate-100/70 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 size={17} />
              </div>
              <div>
                <strong className="block text-slate-900 font-bold">Tiket Resmi</strong>
                <span className="text-slate-500 leading-relaxed">Mendapatkan nomor tiket unik untuk melacak status tanggapan desa.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="ambient-card-hover bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 flex items-start gap-3 shadow-2xs">
              <AlertCircle size={18} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Identitas Pelapor */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold shadow-2xs">
                  1
                </span>
                Identitas Pelapor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Pelapor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={namaPelapor}
                    onChange={(e) => setNamaPelapor(e.target.value)}
                    placeholder="Contoh: Joko Susanto"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all shadow-2xs"
                    required
                  />
                </div>

                {/* Nomor WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={noWa}
                    onChange={(e) => setNoWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all font-mono shadow-2xs"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    *Hanya untuk konfirmasi dan pemberitahuan tindak lanjut oleh petugas desa.
                  </p>
                </div>
              </div>

              {/* Checkbox Anonim */}
              <div className="pt-1">
                <label className="relative flex items-start gap-3 p-4 bg-emerald-50/40 hover:bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer transition-all shadow-2xs">
                  <input
                    type="checkbox"
                    checked={isAnonim}
                    onChange={(e) => setIsAnonim(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-600" />
                      Sembunyikan nama saya dari publik (Kirim Sebagai Anonim)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Nama Anda akan ditampilkan sebagai <em>&quot;Warga Desa (Anonim)&quot;</em> pada feed transparansi publik. Aparatur desa tetap dapat memverifikasi laporan Anda secara internal.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 2: Rincian Wilayah & Masalah */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Rincian Aspirasi / Aduan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Wilayah Dusun / RT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Wilayah Dusun / RT / RW <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dusunRt}
                    onChange={(e) => setDusunRt(e.target.value)}
                    placeholder="Contoh: Dusun Krajan, RT 02 / RW 01"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>

                {/* Kategori Laporan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Kategori Laporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Judul Laporan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Judul Singkat Laporan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Jalan Berlubang Parah di Depan Lapangan Voli Dusun"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>

              {/* Deskripsi Masalah */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Deskripsi Lengkap Masalah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan kondisi permasalahan sedetail mungkin, waktu kejadian, dan dampak yang dialami masyarakat..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed"
                  required
                />
              </div>

              {/* Alamat / Patokan Lokasi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Lokasi Spesifik / Patokan Tempat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={alamatLokasi}
                  onChange={(e) => setAlamatLokasi(e.target.value)}
                  placeholder="Contoh: Sebelah utara warung Bu Siti, 50 meter dari tiang listrik gardu utama"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Section 3: Unggah Foto Bukti dengan Kompresi Otomatis */}
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Foto Bukti Kejadian (Opsional)
                </span>
                <span className="text-[11px] font-normal text-emerald-800 normal-case bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Kompresi Canvas Otomatis
                </span>
              </h3>

              {!compressionResult ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-2xl p-7 text-center cursor-pointer transition-all space-y-2.5 group shadow-2xs hover:shadow-xs"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 group-hover:from-emerald-100 group-hover:to-emerald-200 group-hover:text-emerald-800 flex items-center justify-center mx-auto transition-all shadow-2xs group-hover:scale-105">
                    {isCompressing ? (
                      <Loader2 size={24} className="animate-spin text-emerald-600" />
                    ) : (
                      <UploadCloud size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                      {isCompressing ? 'Sedang Mengompresi Foto...' : 'Klik untuk Memilih atau Mengambil Foto Bukti'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Mendukung format JPG, PNG, WEBP dari kamera ponsel Anda. Otomatis diperkecil tanpa mengurangi kejelasan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                  <div className="relative w-32 h-24 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-2xs">
                    <img
                      src={compressionResult.previewUrl}
                      alt="Pratinjau foto bukti"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs space-y-1.5 w-full text-center sm:text-left">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <span className="font-bold text-slate-900 truncate max-w-xs">
                        {compressionResult.file.name}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
                        Hemat {compressionResult.reductionPercentage}%
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Ukuran Asli:{' '}
                      <span className="font-medium text-slate-700">
                        {formatFileSize(compressionResult.originalSize)}
                      </span>{' '}
                      → Terkompresi:{' '}
                      <span className="font-bold text-emerald-700">
                        {formatFileSize(compressionResult.compressedSize)}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Foto siap dikirim dengan cepat dan hemat kuota data.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-2.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 active:scale-95 rounded-xl transition-all shrink-0"
                    title="Hapus foto"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500 text-center sm:text-left">
                Dengan mengirimkan laporan ini, Anda menyatakan informasi yang diberikan adalah benar demi kebaikan bersama.
              </p>

              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sedang Menyimpan Laporan...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Kirim Aspirasi Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal Sukses Pengiriman Laporan */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-200 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Aspirasi Berhasil Dikirim!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Terima kasih atas kepedulian Anda. Laporan telah masuk ke sistem antrean desa dan akan segera ditindaklanjuti.
              </p>
            </div>

            {/* Nomor Tiket Highlight Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Nomor Tiket Aduan Anda
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-wider">
                {successTicket}
              </div>
              <p className="text-[11px] text-slate-400">
                Simpan nomor tiket ini untuk melacak perkembangan status penanganan.
              </p>
            </div>

            {/* Action Buttons: Copy & Share to WA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyTicket}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Salin Nomor Tiket</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-md shadow-emerald-600/20"
              >
                <Share2 size={16} />
                <span>Kirim ke WhatsApp</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

