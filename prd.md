# DOKUMEN SPESIFIKASI PRODUK (PRD) & BLUEPRINT ARSITEKTUR
================================================================================
NAMA APLIKASI : HaloDesa (Layanan Aspirasi & Pengaduan Masyarakat Desa)
VERSI         : 1.0.0
STATUS DOKUMEN: DRAFT MENUNGGU PERSETUJUAN (PENDING APPROVAL)
PENYUSUN      : ZettBOT by Zettbos (System Architect & Mentor)
TANGGAL       : 17 November 2026
================================================================================

================================================================================
ZONA 1: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT AWAL)
================================================================================

## 1. Problem Statement & Latar Belakang
Masyarakat desa sering mengalami kesulitan dalam menyampaikan aspirasi, aduan infrastruktur, pelayanan administrasi, dan keluhan lingkungan karena saluran pelaporan yang konvensional, birokratis, atau tercecer di grup percakapan informal. Di sisi lain, aparatur desa memerlukan sistem pencatatan yang tertib, transparan, dan dapat dipertanggungjawabkan kepada warga serta pimpinan (Kepala Desa & BPD).

"HaloDesa" hadir sebagai jembatan komunikasi dua arah berbasis web yang:
- Memudahkan warga melapor secara cepat tanpa perlu registrasi akun yang rumit (dengan opsi anonimitas terjamin).
- Menyediakan transparansi penanganan laporan melalui feed publik dan pelacakan nomor tiket unik.
- Memberikan dashboard kerja terpusat bagi operator desa dan kepala desa untuk menindaklanjuti keluhan warga dengan bukti pengerjaan.
- Siap di-deploy pada Shared Hosting cPanel tanpa biaya server bulanan Node.js (Static Export).
- Memiliki struktur data API Supabase yang siap diintegrasikan langsung dengan aplikasi mobile (Flutter) di masa mendatang.

---

## 2. Peran Pengguna (User Roles)
1. **Warga Desa (Publik / Tamu):**
   - Mengakses beranda publik tanpa login.
   - Melacak status laporan berdasarkan nomor tiket (`HLD-YYYY-XXXX`).
   - Melihat papan pengumuman desa dan feed transparansi aspirasi warga.
   - Mengirim laporan/aspirasi baru (bisa menyembunyikan identitas / anonim).
   - Mengunggah foto bukti laporan (terkompresi otomatis di browser).
   - Membagikan nomor tiket ke WhatsApp pribadi sebagai tanda bukti pelaporan.

2. **Operator Desa (Aparatur Pelaksana):**
   - Melakukan login melalui `/login` dengan kredensial Supabase Auth.
   - Memantau ringkasan statistik dan antrean laporan masuk.
   - Mengubah status laporan: *Menunggu*, *Diproses*, *Selesai*, atau *Ditolak*.
   - Mengunggah tanggapan resmi dan foto bukti tindak lanjut.
   - Mengelola papan pengumuman informasi desa (tambah/hapus).
   - Mengunduh rekap bulanan dalam format CSV.

3. **Kepala Desa (Kades / Pimpinan):**
   - Memantau kinerja penanganan aduan warga secara menyeluruh melalui dashboard.
   - Memberikan disposisi dan catatan pimpinan jika diperlukan.
   - Memonitor efektivitas pelayanan perangkat desa.

---

## 3. Arsitektur & Lingkungan Kerja
- **Frontend Framework:** Next.js (App Router, React 19 / 18, TypeScript).
- **Styling & Ikon:** Tailwind CSS (skema warna Emerald Layanan Publik Modern), Lucide React (ikon vektor SVG bersih).
- **Hosting Target:** cPanel Shared Hosting (Apache/LiteSpeed).
- **Mode Build:** Static HTML/JS Export (`output: 'export'`, `images: { unoptimized: true }` -> folder `out/`).
- **Backend & Database:** Supabase Cloud (PostgreSQL 15+, Database Functions & Triggers).
- **Client SDK:** `@supabase/supabase-js` (Client-side fetching & Realtime subscription).
- **File Storage:** Supabase Storage (Bucket publik: `halodesa-media`).
- **Integrasi Masa Depan:** Skema REST API Supabase & RLS kompatibel 100% untuk konsumsi aplikasi mobile Flutter.

---

## 4. Alur Kerja Aplikasi (User Flows)

```
[ Warga Desa ]
     │
     ├── 1. Beranda (/) ──► Lihat Statistik / Pengumuman / Feed Aspirasi
     │        │
     │        └──► Lacak Tiket ──► Modal Detail Status & Timeline Tanggapan
     │
     └── 2. Form Lapor (/lapor) 
              ├── Isi Formulir (Nama, WA, Dusun/RT, Kategori, Judul, Deskripsi, Lokasi)
              ├── Opsi Anonim (Centang: Sembunyikan Nama)
              ├── Pilih Foto Bukti (Kompresi Otomatis Canvas API < 500 KB)
              ├── Upload ke Supabase Storage ('halodesa-media')
              ├── Insert ke tabel 'aspirations' (Trigger DB buat nomor tiket 'HLD-2026-0001')
              └── Modal Sukses ──► Salin Tiket / Bagikan ke WhatsApp

[ Perangkat Desa (Operator / Kades) ]
     │
     └── Login (/login) ──► Autentikasi Supabase Auth
              │
              ▼
     Dashboard Admin (/admin) ── (Proteksi Klien: Cek Sesi Supabase)
              ├── Ringkasan Statistik (Total, Menunggu, Diproses, Selesai)
              ├── Filter Status, Kategori & Pencarian Kata Kunci / Tiket
              ├── Modal Tindak Lanjut:
              │     ├── Perbarui Status (Menunggu -> Diproses -> Selesai / Ditolak)
              │     ├── Catatan Tanggapan Resmi
              │     └── Upload Foto Bukti Penyelesaian
              │     └── Simpan ke 'aspiration_logs' & update 'aspirations'
              ├── Kelola Pengumuman Desa (Tambah / Hapus)
              └── Export Laporan Rekapitulasi (File CSV untuk arsip desa)
```

---

## 5. Desain Basis Data (Database Schema)

### A. Tabel `profiles`
Menyimpan profil aparatur desa yang terhubung dengan akun Supabase Auth.
- `id` (UUID, Primary Key, references `auth.users(id)` ON DELETE CASCADE)
- `nama_lengkap` (VARCHAR(150), NOT NULL)
- `jabatan` (VARCHAR(100), NOT NULL)
- `role` (ENUM `operator_desa`, `kades`, DEFAULT `'operator_desa'`)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### B. Tabel `categories`
Menyimpan daftar kategori aspirasi dan pengaduan.
- `id` (SERIAL, Primary Key)
- `nama_kategori` (VARCHAR(100), NOT NULL, UNIQUE)
- `ikon` (VARCHAR(50), NOT NULL DEFAULT `'HelpCircle'`)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
*Seed Awal:*
1. Infrastruktur & Jalan (Ikon: `Hammer` / `Construction`)
2. Kebersihan & Lingkungan (Ikon: `Trash2` / `Leaf`)
3. Pelayanan Administrasi (Ikon: `FileText` / `Landmark`)
4. Bantuan Sosial (Ikon: `HeartHandshake` / `Gift`)
5. Keamanan & Ketertiban (Ikon: `ShieldCheck` / `AlertTriangle`)

### C. Tabel `aspirations`
Menyimpan seluruh data laporan dan aspirasi masyarakat.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `nomor_tiket` (VARCHAR(20), UNIQUE, NOT NULL -- auto generate `HLD-YYYY-XXXX`)
- `nama_pelapor` (VARCHAR(150), NOT NULL)
- `no_wa` (VARCHAR(20), NOT NULL)
- `dusun_rt` (VARCHAR(100), NOT NULL)
- `is_anonim` (BOOLEAN, DEFAULT FALSE)
- `category_id` (INT, REFERENCES `categories(id)`)
- `judul` (VARCHAR(200), NOT NULL)
- `deskripsi` (TEXT, NOT NULL)
- `foto_bukti_url` (TEXT, NULLABLE)
- `alamat_lokasi` (TEXT, NOT NULL)
- `status` (ENUM `menunggu`, `diproses`, `selesai`, `ditolak`, DEFAULT `'menunggu'`)
- `tanggapan_terakhir` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### D. Tabel `aspiration_logs`
Mencatat riwayat perjalanan dan tindak lanjut laporan oleh perangkat desa.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `aspiration_id` (UUID, REFERENCES `aspirations(id)` ON DELETE CASCADE)
- `operator_id` (UUID, REFERENCES `profiles(id)` ON DELETE SET NULL)
- `status_baru` (VARCHAR(20), NOT NULL)
- `catatan_tanggapan` (TEXT, NOT NULL)
- `foto_tindak_lanjut_url` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### E. Tabel `announcements`
Menyimpan pengumuman resmi dan informasi penting pemerintah desa.
- `id` (UUID, Primary Key, DEFAULT `gen_random_uuid()`)
- `judul` (VARCHAR(250), NOT NULL)
- `konten` (TEXT, NOT NULL)
- `kategori_info` (VARCHAR(100), DEFAULT `'Umum'`)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

### F. Aturan Row Level Security (RLS) & Storage
1. **`aspirations`:**
   - `SELECT`: Terbuka untuk anon dan authenticated (Publik dapat membaca).
   - `INSERT`: Terbuka untuk anon dan authenticated (Publik dapat melapor).
   - `UPDATE`: Hanya untuk pengguna terautentikasi (role `operator_desa` / `kades`).
   - `DELETE`: Dibatasi untuk admin/kades.
2. **`aspiration_logs`:**
   - `SELECT`: Terbuka untuk anon dan authenticated (Publik dapat melihat timeline tindak lanjut).
   - `INSERT`: Hanya untuk pengguna terautentikasi.
3. **`categories` & `announcements`:**
   - `SELECT`: Terbuka untuk publik.
   - `INSERT / UPDATE / DELETE`: Hanya untuk aparatur desa terautentikasi.
4. **Bucket Storage (`halodesa-media`):**
   - Akses: Public Read.
   - Policy: Publik diizinkan INSERT ke folder `aspirations/`. User terautentikasi diizinkan INSERT ke folder `responses/`.

---

## 6. Aturan Validasi & Logika Khusus

1. **Penomoran Otomatis Sekuensial Nomor Tiket (`HLD-YYYY-XXXX`):**
   - Menggunakan Trigger PostgreSQL dan Sequence tahunan (`aspiration_ticket_seq`).
   - Format: `HLD-` + Tahun berjalan (e.g. `2026`) + `-` + 4 digit angka urut pad (`0001`, `0002`, dst.).
   - Dijamin anti-tabrakan multi-user dan konsisten di sisi basis data.

2. **Kompresi Gambar Sisi Klien (Canvas API):**
   - Gambar dari smartphone warga (sering berukuran 3–10 MB) otomatis di-resize (maksimal lebar 1280px) dan dikompresi ke format JPEG kualitas 0.8 menggunakan Canvas API sebelum proses upload.
   - Menghemat kuota internet warga, mempercepat loading, dan menghemat storage Supabase.

3. **Sensor Identitas Anonim di Frontend:**
   - Jika `is_anonim === true`, tampilan publik pada feed transparansi dan modal detail menampilkan nama pelapor sebagai `"Warga Desa (Anonim)"`.
   - Di dashboard admin, identitas asli warga tetap dapat dibaca oleh operator desa agar tindak lanjut lapangan dan verifikasi dapat dijalankan dengan akurat.

4. **Ekspor Data CSV:**
   - Menghasilkan file rekapitulasi data laporan (.csv) yang diformat dengan pemisah koma/titik koma dan kompatibel dibuka di Microsoft Excel atau Google Sheets.

---

## 7. Rencana Antarmuka & Halaman

1. **Halaman Beranda (`/`):**
   - Navbar: Logo HaloDesa, Menu Beranda, Transparansi Warga, Pengumuman, Tombol "Lapor Sekarang", Tombol "Masuk Admin".
   - Hero Section: Headline ramah & terpercaya, Call-to-Action (CTA) Lapor, Form Pencarian / Lacak Nomor Tiket Cepat.
   - Ringkasan Statistik Interaktif: 4 Kartu Metrik (Total Aspirasi, Menunggu, Sedang Diproses, Selesai Ditangani).
   - Konten 2 Kolom:
     * Kolom Kiri (Lebar): Feed Transparansi Aspirasi (Tab filter status, dropdown kategori, kartu aduan dengan badge warna, tombol pagination/load more, modal timeline riwayat tindak lanjut).
     * Kolom Kanan (Sidebar): Papan Pengumuman Desa Terbaru & Kontak Darurat Desa (Polsek, Puskesmas, Babinsa, Ambulans Desa).
   - Footer: Informasi Kantor Desa, Hak Cipta, dan Tautan Terkait.

2. **Halaman Kirim Aspirasi (`/lapor`):**
   - Header ringkas dengan tombol kembali ke beranda.
   - Formulir terstruktur dengan pesan panduan yang ramah:
     * Nama Lengkap + Checkbox Anonimitas.
     * Nomor WhatsApp (dengan placeholder format Indonesia `08xx`).
     * Wilayah Dusun / RT / RW.
     * Pilihan Kategori Dropdown.
     * Judul Singkat & Deskripsi Lengkap Masalah.
     * Lokasi Spesifik / Patokan Tempat.
     * Dropzone Unggah Foto Bukti dengan preview gambar langsung dan indikator ukuran file terkompresi.
   - Tombol Kirim Aspirasi dengan status animasi loading dan failure handler.
   - Modal Konfirmasi Sukses: Menampilkan nomor tiket yang dapat disalin dengan 1 klik, serta tombol cepat bagikan ke WhatsApp.

3. **Halaman Login Perangkat Desa (`/login`):**
   - Kartu login bersih dan elegan di tengah layar berlatar gradien Slate/Emerald halus.
   - Input Email & Password dengan tombol tampilkan/sembunyikan password.
   - Penanganan pesan error login yang informatif.

4. **Halaman Dashboard Aparatur Desa (`/admin`):**
   - Header Dashboard: Info operator yang sedang login, jabatan, status koneksi Supabase, dan tombol Logout.
   - Tab Navigasi:
     * Tab 1: **Daftar Laporan Masuk** (Metrik ringkas, filter status, filter kategori, search bar, tabel data responsif dengan fluid typography).
     * Tab 2: **Kelola Pengumuman** (Daftar pengumuman aktif, tombol buat pengumuman baru, modal tambah, dan tombol hapus).
   - Tombol Aksi: **Export Rekap CSV**.
   - Modal Tindak Lanjut Aspirasi:
     * Rincian lengkap laporan warga & foto bukti.
     * Form ubah status (Menunggu, Diproses, Selesai, Ditolak).
     * Kolom tanggapan resmi pemerintah desa.
     * Upload foto bukti penyelesaian/tindak lanjut lapangan.
     * Riwayat log tanggapan terdahulu.

---

## 8. Panduan Desain Visual (Anti-AI Human-Crafted Aesthetic)
- **Warna Latar:** Slate 50 (`#F8FAFC`) untuk kontras tinggi dan tampilan bersih.
- **Warna Kartu & Kontainer:** Putih bersih (`#FFFFFF`) dengan border halus Slate 200 (`#E2E8F0`) dan bayangan lembut (`shadow-sm` / `shadow-md`).
- **Warna Utama (Brand):** Emerald 700 (`#047857`) & Emerald 600 (`#059669`) mencerminkan integritas, kesegaran lingkungan desa, dan wibawa pemerintahan modern.
- **Skema Badge Status:**
  * *Menunggu:* Kuning Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  * *Diproses:* Biru Laut (`bg-sky-50 text-sky-700 border-sky-200`)
  * *Selesai:* Hijau Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  * *Ditolak:* Merah Rose (`bg-rose-50 text-rose-700 border-rose-200`)
- **Tipografi:** Sans-serif modern (Inter / font sistem Next.js) dengan penekanan hirarki tebal-tipis yang tajam.
- **Ikonografi:** Lucide React SVG tajam, tanpa emoji berlebihan pada tombol utama.

---

## 9. Kriteria Pengujian (Acceptance Criteria)
1. **Build & Export:**
   - Perintah `npm run build` berhasil 100% tanpa error TypeScript dan menghasilkan folder statis `out/`.
   - Seluruh asset gambar, css, dan js dapat dibuka langsung di subfolder atau root shared hosting cPanel.
2. **Kirim Laporan:**
   - Pengunjung dapat mengirim laporan tanpa akun, foto otomatis terkompresi, data masuk ke Supabase, dan mendapatkan nomor tiket `HLD-2026-XXXX`.
3. **Lacak Tiket:**
   - Memasukkan nomor tiket di pencarian beranda langsung memunculkan status dan riwayat tindak lanjut.
4. **Dashboard Admin:**
   - Halaman `/admin` tidak bisa dibuka jika belum login (redirect ke `/login`).
   - Operator berhasil mengubah status laporan dan mengunggah foto tindak lanjut.
   - Operator berhasil menambah dan menghapus pengumuman desa.
   - Tombol Export CSV berhasil mengunduh file `.csv` yang valid.

================================================================================
ZONA 2: MASTER CONTEXT & LOGIKA SISTEM TERKINI (LIVING CONTEXT)
================================================================================
- **Framework & Runtime:** Next.js 16 (App Router, TypeScript)
- **Static Export Engine:** `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true` -> folder `out/`
- **Konfigurasi Server cPanel:** `.htaccess` di root `public_html/` (Apache rewrite rule untuk clean URLs & gzip)
- **Database Engine:** PostgreSQL 15+ via Supabase Cloud (Skema di `supabase_schema.sql`)
- **Format Nomor Tiket:** `HLD-YYYY-XXXX` (Trigger otomatis PostgreSQL dengan advisory lock anti-tabrakan)
- **Bucket Storage:** `halodesa-media` (Public Read; folder `aspirations/` untuk warga anon, folder `responses/` untuk aparatur desa)
- **Kompresi Gambar Sisi Klien:** HTML5 Canvas API (Max width/height 1280px, format JPEG quality 0.8)
- **Peran Sistem:** Warga Desa (Publik / Tamu), Operator Desa, Kepala Desa (Kades)
- **Status Tiket Valid:** `menunggu`, `diproses`, `selesai`, `ditolak`
- **Halaman yang Tersedia:**
  * `/` (Beranda Publik, Hero Lacak Tiket, Real-Time Stats, Feed Transparansi, Papan Pengumuman, Kontak Darurat)
  * `/lapor` (Formulir Pengaduan Tanpa Akun, Checkbox Anonim, Kompresi Canvas, Modal Nomor Tiket, Salin & Share WA)
  * `/login` (Autentikasi Aparatur Desa via Supabase Auth)
  * `/admin` (Dashboard Proteksi Klien, Rekap Statistik, Filter & Tabel Laporan Masuk, Modal Tindak Lanjut & Bukti, Kelola Pengumuman, Export CSV Rekapitulasi)
- **Log Pembaruan:** Implementasi kode lengkap v1.0.0 berhasil dibangun, konfigurasi PostCSS Tailwind CSS v4 (`postcss.config.mjs` + `@tailwindcss/postcss`) aktif, dan perbaikan UI/UX bertaraf modern GovTech 3.0 (REV-2026-UIUX-01) selesai diterapkan secara menyeluruh serta teruji 100% lulus static export build ke folder `out/`.


