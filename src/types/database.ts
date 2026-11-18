export type AspirationStatus = 'menunggu' | 'diproses' | 'selesai' | 'ditolak';

export type UserDesaRole = 'operator_desa' | 'kades';

export interface Profile {
  id: string;
  nama_lengkap: string;
  jabatan: string;
  role: UserDesaRole;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  nama_kategori: string;
  ikon: string;
  created_at?: string;
}

export interface Aspiration {
  id: string;
  nomor_tiket: string;
  nama_pelapor: string;
  no_wa: string;
  dusun_rt: string;
  is_anonim: boolean;
  category_id: number;
  categories?: Category | null;
  judul: string;
  deskripsi: string;
  foto_bukti_url: string | null;
  alamat_lokasi: string;
  status: AspirationStatus;
  tanggapan_terakhir: string | null;
  created_at: string;
  updated_at: string;
}

export interface AspirationLog {
  id: string;
  aspiration_id: string;
  operator_id: string | null;
  profiles?: Profile | null;
  status_baru: AspirationStatus;
  catatan_tanggapan: string;
  foto_tindak_lanjut_url: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  judul: string;
  konten: string;
  kategori_info: string;
  created_at: string;
}

export interface EmergencyContact {
  id: number | string;
  name: string;
  role: string;
  phone: string;
  badge: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatisticSummary {
  total: number;
  menunggu: number;
  diproses: number;
  selesai: number;
  ditolak: number;
}

