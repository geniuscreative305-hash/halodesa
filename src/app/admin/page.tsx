'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Landmark,
  LogOut,
  FileSpreadsheet,
  Megaphone,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  Phone,
  User,
  Shield,
  MapPin,
  Calendar,
  UploadCloud,
  ImageIcon,
  X,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Building,
  Printer,
  Pencil,
  PhoneCall,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PrintReportModal } from '@/components/PrintReportModal';
import {
  Aspiration,
  Category,
  Announcement,
  AspirationStatus,
  AspirationLog,
  Profile,
  EmergencyContact,
} from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { compressImage, formatFileSize, CompressionResult } from '@/lib/image-compressor';
import { exportAspirationsToCsv } from '@/lib/export-csv';
import {
  MOCK_ASPIRATIONS,
  MOCK_CATEGORIES,
  MOCK_ANNOUNCEMENTS,
  MOCK_LOGS,
  EMERGENCY_CONTACTS,
} from '@/lib/mock-data';

export default function AdminDashboardPage() {
  const router = useRouter();
  const followUpFileInputRef = useRef<HTMLInputElement>(null);

  // Auth & Session state
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'aspirations' | 'announcements' | 'contacts'>('aspirations');

  // Data states
  const [aspirations, setAspirations] = useState<Aspiration[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters for Aspirations Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Follow-Up Modal States
  const [selectedAspiration, setSelectedAspiration] = useState<Aspiration | null>(null);
  const [newStatus, setNewStatus] = useState<AspirationStatus>('diproses');
  const [catatanTanggapan, setCatatanTanggapan] = useState('');
  const [isCompressingFollowUp, setIsCompressingFollowUp] = useState(false);
  const [followUpPhotoResult, setFollowUpPhotoResult] = useState<CompressionResult | null>(null);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [aspirationLogs, setAspirationLogs] = useState<AspirationLog[]>([]);

  // Announcement Modal States
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [announcementJudul, setAnnouncementJudul] = useState('');
  const [announcementKategori, setAnnouncementKategori] = useState('Pelayanan');
  const [announcementKonten, setAnnouncementKonten] = useState('');
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');

  // Edit Announcement States
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editAnnouncementJudul, setEditAnnouncementJudul] = useState('');
  const [editAnnouncementKategori, setEditAnnouncementKategori] = useState('Pelayanan');
  const [editAnnouncementKonten, setEditAnnouncementKonten] = useState('');
  const [isSubmittingEditAnn, setIsSubmittingEditAnn] = useState(false);
  const [editAnnError, setEditAnnError] = useState('');

  // Print PDF Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Emergency Contacts States
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(EMERGENCY_CONTACTS as any);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactBadge, setContactBadge] = useState('Siaga');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  // 1. Check Auth Session
  useEffect(() => {
    async function checkAuth() {
      if (isSupabaseConfigured) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          router.push('/login');
          return;
        }
        setCurrentUser(data.session.user);

        // Fetch operator profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (profileData) {
          setCurrentProfile(profileData as Profile);
        } else {
          setCurrentProfile({
            id: data.session.user.id,
            nama_lengkap: data.session.user.email?.split('@')[0] || 'Operator Desa',
            jabatan: 'Aparatur Pelayanan Desa',
            role: 'operator_desa',
          });
        }
      } else {
        // Fallback for demo mode
        const demoAuth = localStorage.getItem('halodesa_demo_logged_in');
        if (!demoAuth) {
          router.push('/login');
          return;
        }
        setCurrentProfile({
          id: 'demo-operator-id',
          nama_lengkap: 'Ahmad Fauzi, S.Kom',
          jabatan: 'Operator Sistem Informasi Desa',
          role: 'operator_desa',
        });
      }
      setIsVerifyingSession(false);
    }

    checkAuth();
  }, [router]);

  // 2. Fetch Data
  const loadAllData = async () => {
    setIsLoadingData(true);
    if (isSupabaseConfigured) {
      try {
        const [catRes, aspRes, annRes, ecRes] = await Promise.all([
          supabase.from('categories').select('*').order('id', { ascending: true }),
          supabase.from('aspirations').select('*, categories(*)').order('created_at', { ascending: false }),
          supabase.from('announcements').select('*').order('created_at', { ascending: false }),
          supabase.from('emergency_contacts').select('*').order('id', { ascending: true }),
        ]);

        if (catRes.data) setCategories(catRes.data as Category[]);
        else setCategories(MOCK_CATEGORIES);

        if (aspRes.data) setAspirations(aspRes.data as Aspiration[]);
        else setAspirations(MOCK_ASPIRATIONS);

        if (annRes.data) setAnnouncements(annRes.data as Announcement[]);
        else setAnnouncements(MOCK_ANNOUNCEMENTS);

        if (ecRes.data && ecRes.data.length > 0) setEmergencyContacts(ecRes.data as EmergencyContact[]);
        else setEmergencyContacts(EMERGENCY_CONTACTS as any);
      } catch {
        setCategories(MOCK_CATEGORIES);
        setAspirations(MOCK_ASPIRATIONS);
        setAnnouncements(MOCK_ANNOUNCEMENTS);
      }
    } else {
      setCategories(MOCK_CATEGORIES);
      setAspirations(MOCK_ASPIRATIONS);
      setAnnouncements(MOCK_ANNOUNCEMENTS);
    }
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (!isVerifyingSession) {
      loadAllData();
    }
  }, [isVerifyingSession]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const total = aspirations.length;
    const menunggu = aspirations.filter((a) => a.status === 'menunggu').length;
    const diproses = aspirations.filter((a) => a.status === 'diproses').length;
    const selesai = aspirations.filter((a) => a.status === 'selesai').length;
    const ditolak = aspirations.filter((a) => a.status === 'ditolak').length;
    return { total, menunggu, diproses, selesai, ditolak };
  }, [aspirations]);

  // Filtered Aspirations
  const filteredAspirations = useMemo(() => {
    return aspirations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && String(item.category_id) !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTicket = item.nomor_tiket.toLowerCase().includes(q);
        const mTitle = item.judul.toLowerCase().includes(q);
        const mName = item.nama_pelapor.toLowerCase().includes(q);
        const mLoc = item.alamat_lokasi.toLowerCase().includes(q);
        if (!mTicket && !mTitle && !mName && !mLoc) return false;
      }
      return true;
    });
  }, [aspirations, statusFilter, categoryFilter, searchQuery]);

  // Handle Logout
  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('halodesa_demo_logged_in');
      localStorage.removeItem('halodesa_demo_user');
    }
    router.push('/login');
  };

  // Open Follow-Up Modal
  const handleOpenFollowUp = async (aspiration: Aspiration) => {
    setSelectedAspiration(aspiration);
    setNewStatus(aspiration.status);
    setCatatanTanggapan('');
    setFollowUpPhotoResult(null);
    setFollowUpError('');

    // Fetch existing logs for this aspiration
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('aspiration_logs')
        .select('*, profiles(*)')
        .eq('aspiration_id', aspiration.id)
        .order('created_at', { ascending: false });
      if (data) setAspirationLogs(data as AspirationLog[]);
    } else {
      setAspirationLogs(MOCK_LOGS[aspiration.id] || []);
    }
  };

  // Handle Follow-Up Photo Selection & Canvas Compression
  const handleFollowUpPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingFollowUp(true);
      setFollowUpError('');
      const res = await compressImage(file, 1280, 1280, 0.8);
      setFollowUpPhotoResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal kompresi foto';
      setFollowUpError(msg);
    } finally {
      setIsCompressingFollowUp(false);
    }
  };

  // Save Follow-Up Response
  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAspiration) return;
    if (!catatanTanggapan.trim()) {
      setFollowUpError('Harap tuliskan catatan tanggapan resmi pemerintah desa.');
      return;
    }

    setIsSubmittingFollowUp(true);
    setFollowUpError('');

    try {
      let uploadedPhotoUrl: string | null = null;

      // Upload follow-up photo if provided
      if (followUpPhotoResult && isSupabaseConfigured) {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}_followup_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `responses/${fileName}`;

        const { error: uploadErr } = await supabase.storage
          .from('halodesa-media')
          .upload(filePath, followUpPhotoResult.file, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadErr) {
          const { data: publicData } = supabase.storage
            .from('halodesa-media')
            .getPublicUrl(filePath);
          uploadedPhotoUrl = publicData.publicUrl;
        }
      }

      if (isSupabaseConfigured) {
        // 1. Update aspiration
        const { error: updateErr } = await supabase
          .from('aspirations')
          .update({
            status: newStatus,
            tanggapan_terakhir: catatanTanggapan.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAspiration.id);

        if (updateErr) throw updateErr;

        // 2. Insert log
        await supabase.from('aspiration_logs').insert({
          aspiration_id: selectedAspiration.id,
          operator_id: currentProfile?.id || null,
          status_baru: newStatus,
          catatan_tanggapan: catatanTanggapan.trim(),
          foto_tindak_lanjut_url: uploadedPhotoUrl,
        });
      }

      // Optimistic UI update
      setAspirations((prev) =>
        prev.map((a) =>
          a.id === selectedAspiration.id
            ? {
                ...a,
                status: newStatus,
                tanggapan_terakhir: catatanTanggapan.trim(),
                updated_at: new Date().toISOString(),
              }
            : a
        )
      );

      // Close modal
      setSelectedAspiration(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui status aspirasi.';
      setFollowUpError(msg);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementJudul.trim() || !announcementKonten.trim()) {
      setAnnouncementError('Harap lengkapi judul dan isi pengumuman.');
      return;
    }

    setIsSubmittingAnnouncement(true);
    setAnnouncementError('');

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('announcements')
          .insert({
            judul: announcementJudul.trim(),
            kategori_info: announcementKategori,
            konten: announcementKonten.trim(),
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setAnnouncements((prev) => [data as Announcement, ...prev]);
        }
      } else {
        const newAnn: Announcement = {
          id: 'ann-' + Date.now(),
          judul: announcementJudul.trim(),
          kategori_info: announcementKategori,
          konten: announcementKonten.trim(),
          created_at: new Date().toISOString(),
        };
        setAnnouncements((prev) => [newAnn, ...prev]);
      }

      setIsAddAnnouncementOpen(false);
      setAnnouncementJudul('');
      setAnnouncementKonten('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan pengumuman.';
      setAnnouncementError(msg);
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    if (isSupabaseConfigured) {
      await supabase.from('announcements').delete().eq('id', id);
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  // Open Edit Announcement Modal
  const handleOpenEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditAnnouncementJudul(ann.judul);
    setEditAnnouncementKategori(ann.kategori_info);
    setEditAnnouncementKonten(ann.konten);
    setEditAnnError('');
  };

  // Save Edit Announcement
  const handleSaveEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    if (!editAnnouncementJudul.trim() || !editAnnouncementKonten.trim()) {
      setEditAnnError('Harap lengkapi judul dan isi pengumuman.');
      return;
    }
    setIsSubmittingEditAnn(true);
    setEditAnnError('');
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('announcements')
          .update({
            judul: editAnnouncementJudul.trim(),
            kategori_info: editAnnouncementKategori,
            konten: editAnnouncementKonten.trim(),
          })
          .eq('id', editingAnnouncement.id);
        if (error) throw error;
      }
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingAnnouncement.id
            ? { ...a, judul: editAnnouncementJudul.trim(), kategori_info: editAnnouncementKategori, konten: editAnnouncementKonten.trim() }
            : a
        )
      );
      setEditingAnnouncement(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan perubahan pengumuman.';
      setEditAnnError(msg);
    } finally {
      setIsSubmittingEditAnn(false);
    }
  };

  // Open Add/Edit Contact Modal
  const handleOpenAddContact = () => {
    setEditingContact(null);
    setContactName('');
    setContactRole('');
    setContactPhone('');
    setContactBadge('Siaga');
    setContactError('');
    setIsAddContactOpen(true);
  };

  const handleOpenEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactRole(contact.role);
    setContactPhone(contact.phone);
    setContactBadge(contact.badge);
    setContactError('');
    setIsAddContactOpen(true);
  };

  // Save Contact (Add or Edit)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactRole.trim() || !contactPhone.trim()) {
      setContactError('Harap lengkapi semua field (nama, jabatan, dan nomor telepon).');
      return;
    }
    setIsSubmittingContact(true);
    setContactError('');
    try {
      if (editingContact) {
        // UPDATE
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from('emergency_contacts')
            .update({ name: contactName.trim(), role: contactRole.trim(), phone: contactPhone.trim(), badge: contactBadge })
            .eq('id', editingContact.id);
          if (error) throw error;
        }
        setEmergencyContacts((prev) =>
          prev.map((c) =>
            c.id === editingContact.id
              ? { ...c, name: contactName.trim(), role: contactRole.trim(), phone: contactPhone.trim(), badge: contactBadge }
              : c
          )
        );
      } else {
        // INSERT
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('emergency_contacts')
            .insert({ name: contactName.trim(), role: contactRole.trim(), phone: contactPhone.trim(), badge: contactBadge })
            .select()
            .single();
          if (error) throw error;
          if (data) setEmergencyContacts((prev) => [...prev, data as EmergencyContact]);
        } else {
          const newContact: EmergencyContact = {
            id: Date.now(),
            name: contactName.trim(),
            role: contactRole.trim(),
            phone: contactPhone.trim(),
            badge: contactBadge,
          };
          setEmergencyContacts((prev) => [...prev, newContact]);
        }
      }
      setIsAddContactOpen(false);
      setEditingContact(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kontak darurat.';
      setContactError(msg);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id: number | string) => {
    if (!confirm('Hapus kontak darurat ini?')) return;
    if (isSupabaseConfigured) {
      await supabase.from('emergency_contacts').delete().eq('id', id);
    }
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Memeriksa sesi login perangkat desa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header Admin */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo & Portal Label */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group active:scale-95 transition-transform">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-bold shadow-xs shadow-emerald-600/25">
                  <Landmark size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 tracking-tight">
                      HaloDesa
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full shadow-2xs">
                      Dashboard Petugas
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Operator Info & Logout Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-bold flex items-center justify-center text-xs shadow-2xs uppercase">
                  {currentProfile?.nama_lengkap ? currentProfile.nama_lengkap[0] : 'O'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-900">
                    {currentProfile?.nama_lengkap || 'Ahmad Fauzi'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    {currentProfile?.jabatan || 'Operator Desa'} ({currentProfile?.role === 'kades' ? 'Kepala Desa' : 'Operator'})
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 active:scale-95 rounded-xl transition-all border border-rose-200/80 shadow-2xs"
                title="Keluar dari sesi"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Sub-Header */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              <button
                onClick={() => setActiveTab('aspirations')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                  activeTab === 'aspirations'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileSpreadsheet size={16} />
                <span>Manajemen Aspirasi ({stats.total})</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                  activeTab === 'announcements'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Megaphone size={16} />
                <span>Kelola Pengumuman ({announcements.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold active:scale-95 transition-all ${
                  activeTab === 'contacts'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <PhoneCall size={16} />
                <span>Kontak Darurat ({emergencyContacts.length})</span>
              </button>
            </div>

            {/* Export CSV + Cetak PDF Buttons */}
            {activeTab === 'aspirations' && (
              <div className="flex items-center gap-2 shrink-0 my-1">
                <button
                  onClick={() => exportAspirationsToCsv(filteredAspirations)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all"
                  title="Unduh Rekapitulasi Data Format CSV untuk Laporan Desa"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                  <span className="hidden sm:inline">Export Rekap CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all"
                  title="Cetak Rekapitulasi PDF Ber-Kop Surat Resmi"
                >
                  <Printer size={15} />
                  <span className="hidden sm:inline">Cetak PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Realtime Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="ambient-card-hover bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 border-t-4 border-t-slate-700 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Laporan Masuk
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {stats.total}
            </div>
          </div>
          <div className="ambient-card-hover bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 border-t-4 border-t-amber-500 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Clock size={13} />
              Menunggu Telaah
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1 tracking-tight">
              {stats.menunggu}
            </div>
          </div>
          <div className="ambient-card-hover bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 border-t-4 border-t-sky-500 shadow-2xs">
            <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
              <RefreshCw size={13} />
              Sedang Dikerjakan
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 mt-1 tracking-tight">
              {stats.diproses}
            </div>
          </div>
          <div className="ambient-card-hover bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 border-t-4 border-t-emerald-600 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 size={13} />
              Selesai Dituntaskan
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1 tracking-tight">
              {stats.selesai}
            </div>
          </div>
        </div>

        {/* TAB 1: MANAJEMEN ASPIRASI WARGA */}
        {activeTab === 'aspirations' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search box */}
              <div className="relative w-full md:w-80">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari tiket, judul, pelapor, atau lokasi..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status and Category dropdown filters */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="menunggu">Menunggu</option>
                  <option value="diproses">Diproses</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditolak">Ditolak</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table of Aspirations */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/80 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nomor Tiket & Waktu</th>
                    <th className="py-3 px-4">Pelapor & Kontak WA</th>
                    <th className="py-3 px-4">Kategori & Judul</th>
                    <th className="py-3 px-4">Lokasi Kejadian</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAspirations.length > 0 ? (
                    filteredAspirations.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Nomor Tiket & Tanggal */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {item.nomor_tiket}
                          </div>
                          <span className="text-[11px] text-slate-600 block">
                            {formatDate(item.created_at)}
                          </span>
                        </td>

                        {/* Pelapor & Kontak WA */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            {item.nama_pelapor}
                            {item.is_anonim && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                                Anonim Publik
                              </span>
                            )}
                          </div>
                          <a
                            href={`https://wa.me/${item.no_wa.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-mono hover:underline mt-0.5"
                          >
                            <Phone size={11} />
                            <span>{item.no_wa}</span>
                          </a>
                        </td>

                        {/* Kategori & Judul */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-1">
                            <CategoryIcon
                              iconName={item.categories?.ikon}
                              size={11}
                              className="text-emerald-600"
                            />
                            {item.categories?.nama_kategori || 'Umum'}
                          </span>
                          <div className="font-medium text-slate-900 line-clamp-2">
                            {item.judul}
                          </div>
                        </td>

                        {/* Lokasi */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div className="text-xs text-slate-800 font-medium truncate">
                            {item.dusun_rt}
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-1">
                            {item.alamat_lokasi}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge status={item.status} size="sm" />
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenFollowUp(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-2xs"
                          >
                            <span>Tindak Lanjut</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada aduan warga yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: KELOLA PENGUMUMAN DESA */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Daftar Pengumuman Resmi Desa
                </h3>
                <p className="text-xs text-slate-500">
                  Pengumuman yang dibuat di sini akan langsung tampil pada papan informasi beranda publik
                </p>
              </div>

              <button
                onClick={() => setIsAddAnnouncementOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus size={16} />
                <span>Buat Pengumuman Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {ann.kategori_info}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {formatDate(ann.created_at)}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {ann.judul}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {ann.konten}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditAnnouncement(ann)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA KONTAK DARURAT */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Kontak Darurat Desa</h3>
                <p className="text-xs text-slate-500">
                  Kelola nomor penting yang tampil di halaman publik beranda
                </p>
              </div>
              <button
                onClick={handleOpenAddContact}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus size={16} />
                <span>Tambah Kontak</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <PhoneCall size={18} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded ml-auto">
                      {contact.badge}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{contact.name}</div>
                    <div className="text-xs text-emerald-700 font-medium">{contact.role}</div>
                    <div className="text-xs text-slate-700 font-mono mt-1">{contact.phone}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditContact(contact)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-800 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
              {emergencyContacts.length === 0 && (
                <div className="col-span-3 py-12 text-center text-slate-400 text-sm">
                  Belum ada kontak darurat. Klik &ldquo;Tambah Kontak&rdquo; untuk menambahkan.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: TINDAK LANJUT LAPORAN OLEH OPERATOR */}
      {selectedAspiration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Tindak Lanjut */}
            <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {selectedAspiration.nomor_tiket}
                  </span>
                  <StatusBadge status={selectedAspiration.status} size="sm" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tindak Lanjut Aspirasi: {selectedAspiration.judul}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAspiration(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              {followUpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <span>{followUpError}</span>
                </div>
              )}

              {/* Rincian Pelapor Asli */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Informasi Lengkap Pelapor (Internal Kantor Desa)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    Nama: <strong className="text-slate-800">{selectedAspiration.nama_pelapor}</strong>
                    {selectedAspiration.is_anonim && ' (Meminta disamarkan di publik)'}
                  </div>
                  <div>
                    WhatsApp:{' '}
                    <a
                      href={`https://wa.me/${selectedAspiration.no_wa.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-700 underline"
                    >
                      {selectedAspiration.no_wa} (Buka Chat WA)
                    </a>
                  </div>
                  <div className="sm:col-span-2">
                    Lokasi: <span className="text-slate-800">{selectedAspiration.dusun_rt} — {selectedAspiration.alamat_lokasi}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-700">
                  <strong>Deskripsi Aduan:</strong>
                  <p className="mt-1 whitespace-pre-line text-slate-800">{selectedAspiration.deskripsi}</p>
                </div>
                {selectedAspiration.foto_bukti_url && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Foto Bukti Awal:</span>
                    <img
                      src={selectedAspiration.foto_bukti_url}
                      alt="Foto bukti warga"
                      className="max-h-44 rounded-lg object-contain border border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Form Input Tindak Lanjut */}
              <form onSubmit={handleSaveFollowUp} className="space-y-4">
                {/* Status Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Perbarui Status Aduan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AspirationStatus)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="menunggu">Menunggu Verifikasi</option>
                    <option value="diproses">Sedang Diproses / Dikerjakan</option>
                    <option value="selesai">Selesai Ditangani</option>
                    <option value="ditolak">Ditolak / Bukan Kewenangan Desa</option>
                  </select>
                </div>

                {/* Catatan Tanggapan Resmi */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Catatan Tanggapan Resmi Pemerintah Desa <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={catatanTanggapan}
                    onChange={(e) => setCatatanTanggapan(e.target.value)}
                    placeholder="Tuliskan tindakan yang telah atau akan diambil kantor desa (misal: peninjauan lokasi pada hari Rabu, material coldmix sudah dikerahkan, dll)..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                    required
                  />
                </div>

                {/* Upload Foto Bukti Tindak Lanjut Lapangan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Dokumentasi Foto Tindak Lanjut (Opsional)</span>
                    <span className="text-[10px] text-emerald-800 font-normal bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Kompresi Otomatis
                    </span>
                  </label>

                  {!followUpPhotoResult ? (
                    <div
                      onClick={() => followUpFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/70 hover:bg-emerald-50/20 transition-colors"
                    >
                      <input
                        type="file"
                        ref={followUpFileInputRef}
                        onChange={handleFollowUpPhotoChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                        {isCompressingFollowUp ? (
                          <Loader2 size={16} className="animate-spin text-emerald-600" />
                        ) : (
                          <UploadCloud size={16} className="text-emerald-600" />
                        )}
                        <span>
                          {isCompressingFollowUp ? 'Mengompresi foto...' : 'Unggah foto bukti pengerjaan / penanganan'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                      <img
                        src={followUpPhotoResult.previewUrl}
                        alt="Bukti tindak lanjut"
                        className="w-16 h-12 object-cover rounded-lg border border-slate-300"
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-bold text-slate-800 block truncate">
                          {followUpPhotoResult.file.name}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Terkonversi ({formatFileSize(followUpPhotoResult.compressedSize)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFollowUpPhotoResult(null)}
                        className="p-1 text-rose-600 hover:text-rose-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAspiration(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFollowUp || isCompressingFollowUp}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSubmittingFollowUp ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Tanggapan Resmi</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Riwayat Log Terdahulu */}
              {aspirationLogs.length > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Riwayat Log Sebelumnya
                  </h5>
                  <div className="space-y-2">
                    {aspirationLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <StatusBadge status={log.status_baru} size="sm" />
                          <span className="text-[11px] text-slate-500">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-800 whitespace-pre-line">{log.catatan_tanggapan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH PENGUMUMAN DESA */}
      {isAddAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Buat Pengumuman Baru
              </h3>
              <button
                onClick={() => setIsAddAnnouncementOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {announcementError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {announcementError}
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementJudul}
                  onChange={(e) => setAnnouncementJudul(e.target.value)}
                  placeholder="Contoh: Jadwal Vaksinasi & Posyandu Balita"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Kategori Informasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={announcementKategori}
                  onChange={(e) => setAnnouncementKategori(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pelayanan">Pelayanan</option>
                  <option value="Kegiatan Desa">Kegiatan Desa</option>
                  <option value="Bantuan Sosial">Bantuan Sosial</option>
                  <option value="Keamanan">Keamanan & Ketertiban</option>
                  <option value="Kedaruratan">Kedaruratan</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Isi Rincian Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={announcementKonten}
                  onChange={(e) => setAnnouncementKonten(e.target.value)}
                  placeholder="Tuliskan informasi lengkap, tanggal pelaksanaan, lokasi, dan syarat yang perlu dibawa warga..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAnnouncement}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmittingAnnouncement ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>Terbitkan Pengumuman</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PENGUMUMAN */}
      {editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Pengumuman</h3>
              <button
                onClick={() => setEditingAnnouncement(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {editAnnError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {editAnnError}
              </div>
            )}

            <form onSubmit={handleSaveEditAnnouncement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Judul Pengumuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editAnnouncementJudul}
                  onChange={(e) => setEditAnnouncementJudul(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Kategori Informasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editAnnouncementKategori}
                  onChange={(e) => setEditAnnouncementKategori(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pelayanan">Pelayanan</option>
                  <option value="Kegiatan Desa">Kegiatan Desa</option>
                  <option value="Bantuan Sosial">Bantuan Sosial</option>
                  <option value="Keamanan">Keamanan &amp; Ketertiban</option>
                  <option value="Kedaruratan">Kedaruratan</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Isi Rincian Pengumuman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={editAnnouncementKonten}
                  onChange={(e) => setEditAnnouncementKonten(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAnnouncement(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditAnn}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmittingEditAnn ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH / EDIT KONTAK DARURAT */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingContact ? 'Edit Kontak Darurat' : 'Tambah Kontak Darurat'}
              </h3>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {contactError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {contactError}
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nama Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Kepala Desa Sukamakmur"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Jabatan / Instansi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => setContactRole(e.target.value)}
                  placeholder="Contoh: Kepala Desa / Puskesmas Kecamatan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Label Badge</label>
                <select
                  value={contactBadge}
                  onChange={(e) => setContactBadge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Siaga">Siaga 24 Jam</option>
                  <option value="Darurat">Darurat</option>
                  <option value="Layanan">Layanan Publik</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Keamanan">Keamanan</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmittingContact ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span>{editingContact ? 'Simpan Perubahan' : 'Tambahkan Kontak'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CETAK PDF REKAPITULASI */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        aspirations={filteredAspirations}
      />
    </div>
  );
}

