'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  User,
  Shield,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ImageIcon,
} from 'lucide-react';
import { Aspiration, AspirationLog } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_LOGS } from '@/lib/mock-data';

interface AspirationDetailModalProps {
  aspiration: Aspiration | null;
  onClose: () => void;
}

export const AspirationDetailModal: React.FC<AspirationDetailModalProps> = ({
  aspiration,
  onClose,
}) => {
  const [logs, setLogs] = useState<AspirationLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!aspiration) return;

    // Fetch timeline logs
    const fetchLogs = async () => {
      setLoadingLogs(true);
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('aspiration_logs')
          .select('*, profiles(nama_lengkap, jabatan, role)')
          .eq('aspiration_id', aspiration.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setLogs(data as AspirationLog[]);
        } else {
          // Fallback to mock log if any
          setLogs(MOCK_LOGS[aspiration.id] || []);
        }
      } else {
        setLogs(MOCK_LOGS[aspiration.id] || []);
      }
      setLoadingLogs(false);
    };

    fetchLogs();
  }, [aspiration]);

  if (!aspiration) return null;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(aspiration.nomor_tiket);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWa = () => {
    const text = encodeURIComponent(
      `Halo, saya ingin memantau aspirasi desa dengan Nomor Tiket: ${aspiration.nomor_tiket} ("${aspiration.judul}"). Status terkini: ${aspiration.status.toUpperCase()}.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/90">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold bg-slate-900 text-emerald-300 px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                {aspiration.nomor_tiket}
              </span>
              <StatusBadge status={aspiration.status} size="md" />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                <CategoryIcon
                  iconName={aspiration.categories?.ikon}
                  size={12}
                  className="text-emerald-600"
                />
                {aspiration.categories?.nama_kategori || 'Umum'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {aspiration.judul}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 active:scale-95 transition-all"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <User size={15} className="text-slate-400 shrink-0" />
              <span>Pelapor:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {aspiration.is_anonim ? (
                  <>
                    <Shield size={13} className="text-emerald-600" />
                    Warga Desa (Anonim)
                  </>
                ) : (
                  aspiration.nama_pelapor
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span>Tanggal:</span>
              <span className="font-medium text-slate-800">
                {formatDate(aspiration.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 sm:col-span-2">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              <span>Wilayah & Lokasi:</span>
              <span className="font-medium text-slate-800">
                {aspiration.dusun_rt} — {aspiration.alamat_lokasi}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Deskripsi Masalah / Aduan
            </h4>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
              {aspiration.deskripsi}
            </div>
          </div>

          {/* Foto Bukti Aduan Warga */}
          {aspiration.foto_bukti_url && (
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ImageIcon size={14} />
                Foto Bukti dari Pelapor
              </h4>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72 flex items-center justify-center">
                <img
                  src={aspiration.foto_bukti_url}
                  alt="Foto bukti pengaduan"
                  className="w-full h-auto max-h-72 object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          )}

          {/* Tanggapan Resmi & Timeline Riwayat Desa */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Status & Tanggapan Resmi Pemerintah Desa
            </h4>

            {aspiration.tanggapan_terakhir ? (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                    Catatan Terkini Perangkat Desa:
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    {formatDate(aspiration.updated_at)}
                  </span>
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-line">
                  {aspiration.tanggapan_terakhir}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-center gap-2">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <span>
                  Laporan ini telah masuk antrean sistem dan sedang menunggu telaah
                  serta verifikasi dari petugas kantor desa.
                </span>
              </div>
            )}

            {/* Riwayat Log Timeline */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-600">
                Kronologi Tindak Lanjut:
              </h5>
              {loadingLogs ? (
                <div className="text-xs text-slate-400 py-3 text-center">
                  Memuat riwayat tindak lanjut...
                </div>
              ) : logs.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {logs.map((log) => (
                    <div key={log.id} className="relative group">
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <StatusBadge status={log.status_baru} size="sm" />
                          <span className="text-[11px] text-slate-600">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line">
                          {log.catatan_tanggapan}
                        </p>
                        {log.foto_tindak_lanjut_url && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <span className="text-[11px] font-medium text-slate-500 block mb-1">
                              Foto Dokumentasi Tindak Lanjut:
                            </span>
                            <img
                              src={log.foto_tindak_lanjut_url}
                              alt="Foto bukti tindak lanjut"
                              className="w-full max-h-48 object-cover rounded-lg border border-slate-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                  Belum ada catatan log tambahan dari operator.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTicket}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Salin Tiket</span>
                </>
              )}
            </button>
            <button
              onClick={handleShareWa}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Share2 size={14} />
              <span>Bagikan</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

