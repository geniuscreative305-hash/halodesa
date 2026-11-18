'use client';

import React, { useRef } from 'react';
import { X, Printer, Landmark, FileText, Download, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import { Aspiration } from '@/types/database';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspirations: Aspiration[];
  desaName?: string;
  kecamatanName?: string;
  kabupatenName?: string;
  kadesName?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  aspirations,
  desaName = 'Sukamakmur',
  kecamatanName = 'Sukamaju',
  kabupatenName = 'Bogor',
  kadesName = 'Ahmad Fauzi, S.IP',
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const total = aspirations.length;
  const selesai = aspirations.filter((a) => a.status === 'selesai').length;
  const diproses = aspirations.filter((a) => a.status === 'diproses').length;
  const menunggu = aspirations.filter((a) => a.status === 'menunggu').length;
  const ditolak = aspirations.filter((a) => a.status === 'ditolak').length;

  const handlePrint = () => {
    window.print();
  };

  const formatDateShort = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Toolbar (Disembunyikan saat di-print fisik) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Pratinjau Cetak Rekapitulasi (PDF Resmi)
              </h3>
              <p className="text-xs text-slate-500">
                Laporan siap cetak ber-kop surat resmi pemerintah desa ({total} data laporan)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4.5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
            >
              <Printer size={16} />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-all"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 print:bg-white print:p-0">
          <div
            ref={printAreaRef}
            id="printable-report"
            className="bg-white max-w-[210mm] mx-auto p-8 sm:p-12 shadow-md print:shadow-none print:p-0 print:max-w-none text-slate-900 font-sans"
          >
            {/* KOP SURAT RESMI PEMERINTAH DESA */}
            <header className="border-b-4 border-double border-slate-900 pb-3 mb-6">
              <div className="flex items-center gap-5 justify-center text-center relative">
                {/* Logo Instansi */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-slate-900 rounded-xl flex items-center justify-center text-slate-900 shrink-0">
                  <Landmark size={38} />
                </div>

                {/* Teks Lembaga Pemerintahan */}
                <div className="flex-1 space-y-0.5">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
                    Pemerintah Kabupaten {kabupatenName}
                  </h3>
                  <h4 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700">
                    Kecamatan {kecamatanName}
                  </h4>
                  <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                    Pemerintah Desa {desaName}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-normal">
                    Alamat: Jl. Raya Balai Desa No. 01, Kode Pos 16830 • Portal Layanan HaloDesa
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
                    Laman Resmi: halodesa.id • Pos-el: sekretariat@{desaName.toLowerCase()}.desa.go.id
                  </p>
                </div>
              </div>
            </header>

            {/* JUDUL DOKUMEN & PERIODE */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-base sm:text-lg font-extrabold uppercase underline tracking-wide text-slate-950">
                Laporan Rekapitulasi Aspirasi & Pengaduan Warga
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Per Tanggal: {todayStr} • Dicetak Melalui Sistem Informasi HaloDesa
              </p>
            </div>

            {/* RINGKASAN METRIK KINERJA */}
            <div className="grid grid-cols-4 gap-2 my-5 text-center text-xs border border-slate-300 rounded-xl p-3 bg-slate-50/60 print:bg-white">
              <div className="border-r border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Laporan</span>
                <span className="text-base font-black text-slate-900">{total}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Selesai</span>
                <span className="text-base font-black text-emerald-800">{selesai}</span>
              </div>
              <div className="border-r border-slate-200">
                <span className="text-sky-700 block text-[10px] uppercase font-bold">Diproses</span>
                <span className="text-base font-black text-sky-800">{diproses}</span>
              </div>
              <div>
                <span className="text-amber-700 block text-[10px] uppercase font-bold">Menunggu</span>
                <span className="text-base font-black text-amber-800">{menunggu}</span>
              </div>
            </div>

            {/* TABEL DATA REKAPITULASI RESMI */}
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold border-b border-slate-400">
                    <th className="border border-slate-400 px-2 py-2 text-center w-8">No</th>
                    <th className="border border-slate-400 px-2.5 py-2 w-28">No. Tiket</th>
                    <th className="border border-slate-400 px-2.5 py-2 w-24">Tanggal</th>
                    <th className="border border-slate-400 px-2.5 py-2 w-32">Pelapor & Dusun</th>
                    <th className="border border-slate-400 px-2.5 py-2 w-28">Kategori</th>
                    <th className="border border-slate-400 px-3 py-2">Uraian Aspirasi / Aduan</th>
                    <th className="border border-slate-400 px-2.5 py-2 text-center w-20">Status</th>
                    <th className="border border-slate-400 px-3 py-2 w-44">Tindak Lanjut Desa</th>
                  </tr>
                </thead>
                <tbody>
                  {aspirations.length > 0 ? (
                    aspirations.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-300 align-top">
                        <td className="border border-slate-300 px-2 py-2 text-center font-medium">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-2 font-mono font-bold text-slate-900 text-[11px]">
                          {item.nomor_tiket}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-2 text-[11px] text-slate-700">
                          {formatDateShort(item.created_at)}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-2">
                          <strong className="block text-slate-900">
                            {item.is_anonim ? 'Warga (Anonim)' : item.nama_pelapor}
                          </strong>
                          <span className="text-[10px] text-slate-600 block">{item.dusun_rt}</span>
                        </td>
                        <td className="border border-slate-300 px-2.5 py-2 text-[11px] font-semibold text-slate-800">
                          {item.categories?.nama_kategori || 'Umum'}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 space-y-1">
                          <strong className="block text-slate-900 font-bold leading-tight">
                            {item.judul}
                          </strong>
                          <p className="text-[11px] text-slate-700 leading-snug line-clamp-3">
                            {item.deskripsi}
                          </p>
                        </td>
                        <td className="border border-slate-300 px-2.5 py-2 text-center font-bold text-[10px] uppercase">
                          <span
                            className={`inline-block px-2 py-0.5 rounded border ${
                              item.status === 'selesai'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : item.status === 'diproses'
                                ? 'bg-sky-50 text-sky-800 border-sky-300'
                                : item.status === 'ditolak'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-[11px] text-slate-700 leading-snug italic">
                          {item.tanggapan_terakhir || 'Belum ada tanggapan resmi'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 italic">
                        Tidak ada data laporan aspirasi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* LEMBAR PENGESAHAN & TANDA TANGAN RESMI */}
            <div className="mt-10 pt-4 flex justify-end text-xs text-slate-900 break-inside-avoid">
              <div className="text-center w-64 space-y-1">
                <p>
                  Ditetapkan di: {desaName}
                </p>
                <p>
                  Pada tanggal: {todayStr}
                </p>
                <p className="font-bold pt-2">
                  Mengetahui,
                </p>
                <p className="font-bold uppercase">
                  Kepala Desa {desaName}
                </p>

                {/* Ruang Tanda Tangan & Cap */}
                <div className="h-20" />

                <p className="font-bold uppercase underline">
                  ( {kadesName} )
                </p>
                <p className="text-[10px] text-slate-600 font-mono">
                  NIP. 19850712 201001 1 008
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

