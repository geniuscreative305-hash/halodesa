-- ==============================================================================
-- SKEMA BASIS DATA SUPABASE - HALODESA (Layanan Aspirasi & Pengaduan Warga Desa)
-- Versi: 1.0.0
-- Standar Arsitektur: ZettBOT Engineering Standards (PostgreSQL + RLS + Storage)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPE ENUM
DO $$ BEGIN
    CREATE TYPE user_desa_role AS ENUM ('operator_desa', 'kades');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE aspiration_status AS ENUM ('menunggu', 'diproses', 'selesai', 'ditolak');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 3. TABEL UTAMA
-- ==============================================================================

-- Tabel Profiles (Menyimpan data profil aparatur desa terhubung dengan auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(150) NOT NULL,
    jabatan VARCHAR(100) NOT NULL,
    role user_desa_role NOT NULL DEFAULT 'operator_desa',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Categories (Kategori aspirasi / pengaduan)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL UNIQUE,
    ikon VARCHAR(50) NOT NULL DEFAULT 'HelpCircle',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Aspirations (Menyimpan seluruh aspirasi & pengaduan masyarakat desa)
CREATE TABLE IF NOT EXISTS aspirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_tiket VARCHAR(30) UNIQUE NOT NULL,
    nama_pelapor VARCHAR(150) NOT NULL,
    no_wa VARCHAR(25) NOT NULL,
    dusun_rt VARCHAR(100) NOT NULL,
    is_anonim BOOLEAN DEFAULT FALSE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    judul VARCHAR(250) NOT NULL,
    deskripsi TEXT NOT NULL,
    foto_bukti_url TEXT,
    alamat_lokasi TEXT NOT NULL,
    status aspiration_status NOT NULL DEFAULT 'menunggu',
    tanggapan_terakhir TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Aspiration Logs (Mencatat riwayat perjalanan status & tindak lanjut desa)
CREATE TABLE IF NOT EXISTS aspiration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aspiration_id UUID NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    operator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status_baru aspiration_status NOT NULL,
    catatan_tanggapan TEXT NOT NULL,
    foto_tindak_lanjut_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Announcements (Papan pengumuman & kabar penting pemerintah desa)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judul VARCHAR(250) NOT NULL,
    konten TEXT NOT NULL,
    kategori_info VARCHAR(100) DEFAULT 'Umum',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Emergency Contacts (Kontak darurat dan bantuan cepat warga desa)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    badge VARCHAR(50) DEFAULT 'Siaga',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TRIGGER: AUTO-GENERATE NOMOR TIKET (HLD-YYYY-XXXX)
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_aspiration_ticket()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_seq_num INT;
    new_ticket_code TEXT;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');

    -- Kunci baris dengan advisory lock per tahun untuk mencegah race-condition saat multi-user
    PERFORM pg_advisory_xact_lock(hashtext('aspiration_ticket_' || current_year));

    -- Ambil nomor urut tertinggi pada tahun berjalan
    SELECT COALESCE(
        MAX(
            NULLIF(SUBSTRING(nomor_tiket FROM 'HLD-[0-9]{4}-([0-9]+)'), '')::INTEGER
        ), 0
    ) + 1
    INTO next_seq_num
    FROM aspirations
    WHERE nomor_tiket LIKE 'HLD-' || current_year || '-%';

    -- Format penomoran: HLD-YYYY-0001 (pad 4 digit)
    new_ticket_code := 'HLD-' || current_year || '-' || LPAD(next_seq_num::TEXT, 4, '0');
    NEW.nomor_tiket := new_ticket_code;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_aspiration_ticket ON aspirations;
CREATE TRIGGER trg_generate_aspiration_ticket
BEFORE INSERT ON aspirations
FOR EACH ROW
WHEN (NEW.nomor_tiket IS NULL OR NEW.nomor_tiket = '')
EXECUTE FUNCTION generate_aspiration_ticket();

-- Trigger untuk updated_at pada aspirations
CREATE OR REPLACE FUNCTION update_aspiration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aspirations_timestamp ON aspirations;
CREATE TRIGGER trg_aspirations_timestamp
BEFORE UPDATE ON aspirations
FOR EACH ROW
EXECUTE FUNCTION update_aspiration_timestamp();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspiration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user login adalah aparatur desa (operator / kades)
CREATE OR REPLACE FUNCTION is_desa_staff(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_uid
        AND role IN ('operator_desa', 'kades')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- Kebijakan Tabel profiles ---
CREATE POLICY "Public Profiles Read"
    ON profiles FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Users Can Insert Own Profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users Can Update Own Profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- --- Kebijakan Tabel categories ---
CREATE POLICY "Public Categories Read"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Staff Manage Categories"
    ON categories FOR ALL
    TO authenticated
    USING (is_desa_staff(auth.uid()))
    WITH CHECK (is_desa_staff(auth.uid()));

-- --- Kebijakan Tabel aspirations ---
-- Publik (anon & auth) boleh membaca data laporan untuk transparansi desa
CREATE POLICY "Public Aspirations Read"
    ON aspirations FOR SELECT
    TO anon, authenticated
    USING (true);

-- Publik boleh mengirim aduan baru tanpa perlu registrasi akun
CREATE POLICY "Public Aspirations Insert"
    ON aspirations FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Hanya aparatur desa terautentikasi yang boleh memperbarui status aspirasi
CREATE POLICY "Staff Aspirations Update"
    ON aspirations FOR UPDATE
    TO authenticated
    USING (is_desa_staff(auth.uid()))
    WITH CHECK (is_desa_staff(auth.uid()));

-- --- Kebijakan Tabel aspiration_logs ---
-- Publik boleh membaca riwayat log tindak lanjut
CREATE POLICY "Public Aspiration Logs Read"
    ON aspiration_logs FOR SELECT
    TO anon, authenticated
    USING (true);

-- Hanya aparatur desa yang boleh menambahkan riwayat log tindak lanjut
CREATE POLICY "Staff Insert Aspiration Logs"
    ON aspiration_logs FOR INSERT
    TO authenticated
    WITH CHECK (is_desa_staff(auth.uid()));

-- --- Kebijakan Tabel announcements ---
-- Publik boleh membaca pengumuman desa
CREATE POLICY "Public Announcements Read"
    ON announcements FOR SELECT
    TO anon, authenticated
    USING (true);

-- Hanya aparatur desa yang boleh membuat, mengubah, atau menghapus pengumuman
CREATE POLICY "Staff Manage Announcements"
    ON announcements FOR ALL
    TO authenticated
    USING (is_desa_staff(auth.uid()))
    WITH CHECK (is_desa_staff(auth.uid()));

-- --- Kebijakan Tabel emergency_contacts ---
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Publik boleh membaca kontak darurat
CREATE POLICY "Public Emergency Contacts Read"
    ON emergency_contacts FOR SELECT
    TO anon, authenticated
    USING (true);

-- Hanya aparatur desa yang boleh menambah, mengubah, atau menghapus kontak darurat
CREATE POLICY "Staff Manage Emergency Contacts"
    ON emergency_contacts FOR ALL
    TO authenticated
    USING (is_desa_staff(auth.uid()))
    WITH CHECK (is_desa_staff(auth.uid()));

-- ==============================================================================
-- 6. SEED DATA AWAL (KATEGORI & PENGUMUMAN PERCONTOHAN)
-- ==============================================================================

INSERT INTO categories (nama_kategori, ikon)
VALUES
    ('Infrastruktur & Jalan', 'Hammer'),
    ('Kebersihan & Lingkungan', 'Trash2'),
    ('Pelayanan Administrasi', 'FileText'),
    ('Bantuan Sosial', 'HeartHandshake'),
    ('Keamanan & Ketertiban', 'ShieldCheck')
ON CONFLICT (nama_kategori) DO NOTHING;

INSERT INTO announcements (judul, konten, kategori_info)
VALUES
    ('Jadwal Pelayanan Perekaman KTP-el Keliling', 'Diberitahukan kepada seluruh warga bahwa mobil layanan Disdukcapil akan hadir di Balai Desa pada hari Kamis pukul 08:30 - 14:00 WIB. Harap membawa fotokopi Kartu Keluarga.', 'Pelayanan'),
    ('Gotong Royong Bersih Saluran Air Musim Hujan', 'Menyambut musim penghujan, kerja bakti serentak di seluruh wilayah RW 01 s/d RW 05 akan dilaksanakan Minggu pagi pukul 07:00 WIB.', 'Kegiatan Desa'),
    ('Penyaluran BLT Dana Desa Tahap IV', 'Penyaluran bantuan langsung tunai bertempat di Pendopo Kantor Desa mulai Senin depan. Penerima manfaat wajib membawa undangan dan KTP asli.', 'Bansos')
ON CONFLICT DO NOTHING;

INSERT INTO emergency_contacts (name, role, phone, badge)
VALUES
    ('Bhabinkamtibmas (Polsek)', 'Keamanan & Ketertiban', '0812-3456-7891', 'Polri'),
    ('Babinsa (Koramil)', 'Pertahanan & Bencana', '0813-9876-5432', 'TNI-AD'),
    ('Ambulans Siaga Desa', 'Kesehatan & Rujukan', '0821-1122-3344', '24 Jam'),
    ('Ketua Posko Bencana', 'Satgas Tanggap Darurat', '0852-5566-7788', 'Siaga')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 7. SETUP SUPABASE STORAGE (BUCKET: halodesa-media)
-- ==============================================================================

-- 1. Buat Bucket Storage 'halodesa-media' dengan akses publik
INSERT INTO storage.buckets (id, name, public)
VALUES ('halodesa-media', 'halodesa-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Kebijakan Storage: Publik dapat melihat seluruh berkas foto bukti
DROP POLICY IF EXISTS "Public Access halodesa-media" ON storage.objects;
CREATE POLICY "Public Access halodesa-media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'halodesa-media');

-- 3. Kebijakan Storage: Publik (anon) dapat mengunggah foto aduan ke folder 'aspirations/'
DROP POLICY IF EXISTS "Public Upload Aspirations Media" ON storage.objects;
CREATE POLICY "Public Upload Aspirations Media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'halodesa-media' 
    AND (storage.foldername(name))[1] = 'aspirations'
);

-- 4. Kebijakan Storage: Aparatur desa dapat mengunggah foto tindak lanjut ke folder 'responses/'
DROP POLICY IF EXISTS "Staff Upload Responses Media" ON storage.objects;
CREATE POLICY "Staff Upload Responses Media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'halodesa-media' 
    AND (storage.foldername(name))[1] = 'responses'
);


-- ==============================================================================
-- 8. PANDUAN MEMBUAT AKUN OPERATOR / KADES PERTAMA
-- ==============================================================================
/*
1. Buka Supabase Dashboard > Authentication > Users > Add User (Email & Password).
   Contoh: operator@halodesa.id / passworddesa123
2. Salin UUID user yang baru dibuat.
3. Buka SQL Editor dan daftarkan profilnya ke tabel profiles:

INSERT INTO profiles (id, nama_lengkap, jabatan, role)
VALUES (
    'MASUKKAN-UUID-DARI-AUTH-USERS-DISINI',
    'Ahmad Fauzi, S.Kom',
    'Operator Sistem Desa',
    'operator_desa'
);
*/

