import { Aspiration, Category, Announcement, AspirationLog } from '@/types/database';

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, nama_kategori: 'Infrastruktur & Jalan', ikon: 'Hammer' },
  { id: 2, nama_kategori: 'Kebersihan & Lingkungan', ikon: 'Trash2' },
  { id: 3, nama_kategori: 'Pelayanan Administrasi', ikon: 'FileText' },
  { id: 4, nama_kategori: 'Bantuan Sosial', ikon: 'HeartHandshake' },
  { id: 5, nama_kategori: 'Keamanan & Ketertiban', ikon: 'ShieldCheck' },
];

export const EMERGENCY_CONTACTS = [
  {
    name: 'Ambulans Siaga Desa 24 Jam',
    phone: '0811-9900-1122',
    role: 'Kedaruratan Medis & Persalinan',
    badge: '24 Jam Siaga',
    type: 'ambulance',
  },
  {
    name: 'Puskesmas Pembantu Desa',
    phone: '0812-9876-5432',
    role: 'Pelayanan Kesehatan Umum',
    badge: '08:00 - 15:00',
    type: 'health',
  },
  {
    name: 'Bhabinkamtibmas (Polsek)',
    phone: '0813-1122-3344',
    role: 'Aipda Hendra Wijaya',
    badge: 'Keamanan',
    type: 'police',
  },
  {
    name: 'Babinsa (Koramil)',
    phone: '0812-5566-7788',
    role: 'Serka Bambang Irawan',
    badge: 'Ketertiban',
    type: 'military',
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    judul: 'Jadwal Perekaman KTP-el Keliling Disdukcapil di Balai Desa',
    konten:
      'Diberitahukan kepada seluruh warga Desa Sukamaju bahwa mobil layanan keliling Disdukcapil akan melayani perekaman KTP-el dan aktivasi Identitas Kependudukan Digital (IKD) pada hari Kamis mulai pukul 08:30 WIB di Pendopo Balai Desa. Warga diharapkan membawa fotokopi KK terbaru.',
    kategori_info: 'Pelayanan',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'ann-2',
    judul: 'Gotong Royong Normalisasi Saluran Air & Selokan Serentak',
    konten:
      'Menghadapi puncak musim hujan, Pemerintah Desa mengimbau warga RW 01 s/d RW 06 untuk melaksanakan kerja bakti serentak membersihkan gorong-gorong dan selokan pada hari Minggu pukul 07:00 WIB.',
    kategori_info: 'Kegiatan Desa',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'ann-3',
    judul: 'Penyaluran Bantuan Langsung Tunai (BLT-DD) Triwulan Akhir',
    konten:
      'Penyaluran BLT Dana Desa bagi 85 KPM terdaftar akan dilaksanakan hari Senin pekan depan. Harap membawa KTP Asli dan surat undangan resmi dari kantor desa.',
    kategori_info: 'Bantuan Sosial',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

export const MOCK_ASPIRATIONS: Aspiration[] = [
  {
    id: 'asp-1',
    nomor_tiket: 'HLD-2026-0001',
    nama_pelapor: 'Budi Santoso',
    no_wa: '081234567890',
    dusun_rt: 'Dusun Krajan, RT 02 / RW 01',
    is_anonim: false,
    category_id: 1,
    categories: { id: 1, nama_kategori: 'Infrastruktur & Jalan', ikon: 'Hammer' },
    judul: 'Jalan Berlubang di Depan Pos Ronda Dusun Krajan',
    deskripsi:
      'Terdapat lubang berdiameter sekitar 80 cm dengan kedalaman 10 cm di tikungan dekat Pos Ronda. Sangat membahayakan pengendara motor terutama saat malam hari dan tergenang air hujan.',
    foto_bukti_url: null,
    alamat_lokasi: 'Jl. Melati No. 14, Dekat Pos Ronda Krajan RT 02',
    status: 'selesai',
    tanggapan_terakhir:
      'Tim penambalan jalan desa telah menutup lubang dengan aspal dingin (coldmix) pada hari Selasa siang. Kondisi jalan kini sudah rata dan aman dilalui warga.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'asp-2',
    nomor_tiket: 'HLD-2026-0002',
    nama_pelapor: 'Siti Rahmawati',
    no_wa: '085712345678',
    dusun_rt: 'Dusun Srikandi, RT 05 / RW 02',
    is_anonim: true,
    category_id: 2,
    categories: { id: 2, nama_kategori: 'Kebersihan & Lingkungan', ikon: 'Trash2' },
    judul: 'Tumpukan Sampah Liar di Pinggir Sungai Perbatasan',
    deskripsi:
      'Ada oknum yang membuang karung-karung sampah plastik di tebing sungai perbatasan desa. Mengakibatkan bau tidak sedap dan dikhawatirkan menyumbat aliran air saat hujan lebat.',
    foto_bukti_url: null,
    alamat_lokasi: 'Jembatan kali kecil batas dusun Srikandi',
    status: 'diproses',
    tanggapan_terakhir:
      'Laporan telah divalidasi oleh Kepala Dusun. Hari ini armada truk kebersihan desa bersama pemuda karang taruna dijadwalkan mengangkut sampah tersebut ke TPA.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'asp-3',
    nomor_tiket: 'HLD-2026-0003',
    nama_pelapor: 'Joko Prabowo',
    no_wa: '082198765432',
    dusun_rt: 'Dusun Makmur, RT 01 / RW 03',
    is_anonim: false,
    category_id: 1,
    categories: { id: 1, nama_kategori: 'Infrastruktur & Jalan', ikon: 'Hammer' },
    judul: 'Lampu Penerangan Jalan Umum (PJU) Mati 3 Titik',
    deskripsi:
      'Lampu jalan penerangan di gang utama RT 01 sudah padam selama satu minggu terakhir. Jalur menjadi sangat gelap dan rawan kecelakaan.',
    foto_bukti_url: null,
    alamat_lokasi: 'Gang Mawar, tiang listrik nomor 3, 4, dan 5',
    status: 'menunggu',
    tanggapan_terakhir: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'asp-4',
    nomor_tiket: 'HLD-2026-0004',
    nama_pelapor: 'Endang Wahyuni',
    no_wa: '081387654321',
    dusun_rt: 'Dusun Krajan, RT 04 / RW 01',
    is_anonim: true,
    category_id: 3,
    categories: { id: 3, nama_kategori: 'Pelayanan Administrasi', ikon: 'FileText' },
    judul: 'Permintaan Format Surat Keterangan Usaha (SKU) Online',
    deskripsi:
      'Mohon informasi apakah pengurusan formulir pengantar SKU bisa diakses secara digital agar warga yang bekerja tidak harus menunggu lama di kantor desa.',
    foto_bukti_url: null,
    alamat_lokasi: 'Kantor Balai Desa',
    status: 'diproses',
    tanggapan_terakhir:
      'Perangkat desa bagian pelayanan umum sedang menyiapkan template formulir dan QR code layanan pengantar digital melalui WhatsApp resmi kantor desa.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

export const MOCK_LOGS: Record<string, AspirationLog[]> = {
  'asp-1': [
    {
      id: 'log-1',
      aspiration_id: 'asp-1',
      operator_id: 'op-1',
      status_baru: 'diproses',
      catatan_tanggapan: 'Laporan diverifikasi oleh Kasi Kesejahteraan. Material aspal dingin telah dipesan.',
      foto_tindak_lanjut_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'log-2',
      aspiration_id: 'asp-1',
      operator_id: 'op-1',
      status_baru: 'selesai',
      catatan_tanggapan: 'Tim penambalan jalan desa telah menutup lubang dengan aspal dingin (coldmix) pada hari Selasa siang. Kondisi jalan kini sudah rata dan aman dilalui warga.',
      foto_tindak_lanjut_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
  ],
  'asp-2': [
    {
      id: 'log-3',
      aspiration_id: 'asp-2',
      operator_id: 'op-1',
      status_baru: 'diproses',
      catatan_tanggapan: 'Laporan telah divalidasi oleh Kepala Dusun. Hari ini armada truk kebersihan desa bersama pemuda karang taruna dijadwalkan mengangkut sampah tersebut ke TPA.',
      foto_tindak_lanjut_url: null,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],
};

