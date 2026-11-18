import { Aspiration } from '@/types/database';

/**
 * Clean string for CSV cell, escaping quotes and wrapping with double quotes if needed
 */
function escapeCsvCell(text: string | null | undefined): string {
  if (text === null || text === undefined) return '""';
  const stringValue = String(text).replace(/"/g, '""');
  return `"${stringValue}"`;
}

/**
 * Format ISO date string into Indonesian readable date
 */
function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Export array of Aspirations into Excel-compatible CSV with UTF-8 BOM
 */
export function exportAspirationsToCsv(aspirations: Aspiration[], filenamePrefix = 'Rekap_Aspirasi_HaloDesa'): void {
  const headers = [
    'Nomor Tiket',
    'Tanggal Lapor',
    'Nama Pelapor',
    'Status Anonim',
    'No WhatsApp',
    'Dusun / RT',
    'Kategori',
    'Judul Laporan',
    'Deskripsi Masalah',
    'Lokasi / Patokan',
    'Status Saat Ini',
    'Tanggapan Resmi Desa',
    'Terakhir Diperbarui',
  ];

  const rows = aspirations.map((item) => [
    escapeCsvCell(item.nomor_tiket),
    escapeCsvCell(formatDate(item.created_at)),
    escapeCsvCell(item.is_anonim ? `${item.nama_pelapor} (Minta Anonim di Publik)` : item.nama_pelapor),
    escapeCsvCell(item.is_anonim ? 'Ya' : 'Tidak'),
    escapeCsvCell(`'${item.no_wa}`), // Prefix with quote so Excel doesn't strip leading zero
    escapeCsvCell(item.dusun_rt),
    escapeCsvCell(item.categories?.nama_kategori || 'Umum'),
    escapeCsvCell(item.judul),
    escapeCsvCell(item.deskripsi),
    escapeCsvCell(item.alamat_lokasi),
    escapeCsvCell(item.status.toUpperCase()),
    escapeCsvCell(item.tanggapan_terakhir || '-'),
    escapeCsvCell(formatDate(item.updated_at)),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel compatibility
    headers.map((h) => `"${h}"`).join(',') +
    '\r\n' +
    rows.map((r) => r.join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const now = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

