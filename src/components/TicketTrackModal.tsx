'use client';

import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { MOCK_ASPIRATIONS } from '@/lib/mock-data';
import { Aspiration } from '@/types/database';
import { AspirationDetailModal } from './AspirationDetailModal';

interface TicketTrackModalProps {
  initialTicket?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketTrackModal: React.FC<TicketTrackModalProps> = ({
  initialTicket = '',
  isOpen,
  onClose,
}) => {
  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundAspiration, setFoundAspiration] = useState<Aspiration | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTicket = ticketInput.trim().toUpperCase();
    if (!cleanTicket) {
      setErrorMsg('Harap masukkan nomor tiket yang ingin dilacak.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setFoundAspiration(null);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('aspirations')
          .select('*, categories(*)')
          .ilike('nomor_tiket', cleanTicket)
          .single();

        if (error || !data) {
          // Check mock
          const matchMock = MOCK_ASPIRATIONS.find(
            (a) => a.nomor_tiket.toUpperCase() === cleanTicket
          );
          if (matchMock) {
            setFoundAspiration(matchMock);
          } else {
            setErrorMsg(
              `Nomor tiket "${cleanTicket}" tidak ditemukan. Pastikan format nomor sudah benar (contoh: HLD-2026-0001).`
            );
          }
        } else {
          setFoundAspiration(data as Aspiration);
        }
      } else {
        const matchMock = MOCK_ASPIRATIONS.find(
          (a) => a.nomor_tiket.toUpperCase() === cleanTicket
        );
        if (matchMock) {
          setFoundAspiration(matchMock);
        } else {
          setErrorMsg(
            `Nomor tiket "${cleanTicket}" tidak ditemukan di database demo. Coba gunakan: HLD-2026-0001 atau HLD-2026-0002.`
          );
        }
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat memeriksa tiket. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Search size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Lacak Status Aduan Warga
                </h3>
                <p className="text-xs text-slate-500">
                  Masukkan nomor tiket resmi pengaduan Anda
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Contoh: HLD-2026-0001"
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider text-sm transition-all"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Search size={14} />
                    <span>Cari</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs text-emerald-800 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} />
              Tips Nomor Tiket:
            </p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Nomor tiket otomatis terbit sesaat setelah Anda mengirim formulir
              laporan di halaman <strong>/lapor</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* If found, open detail modal directly */}
      {foundAspiration && (
        <AspirationDetailModal
          aspiration={foundAspiration}
          onClose={() => {
            setFoundAspiration(null);
            onClose();
          }}
        />
      )}
    </>
  );
};

