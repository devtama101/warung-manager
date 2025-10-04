# 📚 Panduan Admin - Warung POS

Panduan lengkap penggunaan sistem Warung POS untuk **Admin/Pemilik Warung**.

---

## 🔐 Login Admin

**URL:** `/admin/login`

1. Masukkan email dan password admin
2. Klik "Masuk"
3. Akan diarahkan ke Dashboard Admin

---

## 📊 Dashboard Admin (`/admin`)

**Fungsi:** Melihat ringkasan statistik sistem secara keseluruhan

### Fitur:
- **Total Pengguna** - Jumlah warung yang terdaftar
- **Total Perangkat** - Jumlah device/kasir aktif
- **Total Pesanan** - Jumlah semua pesanan di sistem
- **Total Pendapatan** - Total revenue dari semua warung

### Grafik:
- **Revenue Trend** - Grafik tren pendapatan
- **User Growth** - Pertumbuhan jumlah pengguna
- **Top Performing Warungs** - Warung dengan penjualan tertinggi

### Cara Pakai:
- Dashboard otomatis refresh saat dibuka
- Data diambil dari database PostgreSQL
- Menampilkan data real-time dari semua warung

---

## 📱 Perangkat (`/admin/devices`)

**Fungsi:** Mengelola perangkat/kasir yang terdaftar di sistem

### Fitur:
- **Daftar Perangkat** - List semua device dengan informasi:
  - Device ID
  - Device Name
  - Email karyawan
  - Nama karyawan
  - Status (Aktif/Nonaktif)
  - Last Seen (terakhir online)
- **Tambah Perangkat** - Daftarkan kasir/karyawan baru
- **Edit Perangkat** - Update info device
- **Aktifkan/Nonaktifkan** - Toggle status device

### Cara Pakai:
1. **Menambah Perangkat Baru:**
   - Klik tombol "+ Tambah Perangkat"
   - Isi form:
     - Email karyawan (untuk login)
     - Password
     - Nama lengkap karyawan
     - Nama perangkat (contoh: "Kasir 1")
   - Sistem otomatis generate Device ID unik
   - Karyawan bisa login dengan email/password di device mereka

2. **Menonaktifkan Perangkat:**
   - Klik toggle status "Aktif/Nonaktif"
   - Device nonaktif tidak bisa login
   - Data tetap tersimpan di database

3. **Melihat Last Seen:**
   - Timestamp terakhir device online
   - Update otomatis saat device sync data

---

## 🍽️ Menu (`/admin/menu`)

**Fungsi:** Mengelola daftar menu makanan/minuman untuk semua warung

### Fitur:
- **Daftar Menu** - Semua item menu di sistem
- **Filter by User** - Lihat menu per warung tertentu
- **Tambah Menu** - Buat item menu baru
- **Edit Menu** - Update harga, ketersediaan, resep
- **Hapus Menu** - Delete item menu

### Cara Pakai:
1. **Menambah Menu Baru:**
   - Klik "+ Tambah Menu"
   - Isi form:
     - Nama menu (contoh: "Nasi Goreng Ayam")
     - Kategori (Makanan/Minuman/Snack)
     - Harga (Rp)
     - Gambar URL (opsional)
     - **Ingredients/Resep** (penting untuk inventory tracking):
       ```
       Pilih bahan baku dari inventory
       Contoh: Beras 0.2kg, Ayam 0.1kg, Telur 1pcs
       ```
   - Klik "Simpan"

2. **Mengatur Ingredients (Resep):**
   - Klik "Edit" pada menu
   - Scroll ke bagian "Ingredients"
   - Klik "+ Tambah Bahan"
   - Pilih inventory item
   - Masukkan jumlah yang dibutuhkan per porsi
   - **Penting:** Ingredients ini otomatis mengurangi stok inventory saat pesanan selesai

3. **Mengubah Ketersediaan:**
   - Toggle "Tersedia/Habis" pada list menu
   - Menu habis tidak muncul di kasir employee

---

## 📦 Bahan Baku (`/admin/inventory`)

**Fungsi:** Mengelola inventory/stok bahan baku

### Fitur:
- **Daftar Inventory** - Semua bahan baku
- **Filter by Category** - Bahan Baku/Kemasan/Lainnya
- **Tambah Item** - Input bahan baku baru
- **Update Stok** - Adjust stok manual
- **Alert Stok Minimum** - Warning jika stok < minimum

### Cara Pakai:
1. **Menambah Bahan Baku:**
   - Klik "+ Tambah Inventory"
   - Isi form:
     - Nama (contoh: "Beras", "Ayam", "Minyak Goreng")
     - Kategori (Bahan Baku/Kemasan/Lainnya)
     - Stok (jumlah saat ini)
     - Unit (kg, liter, pcs, dll)
     - Stok Minimum (alert threshold)
     - Harga Beli (per unit, untuk kalkulasi profit)
     - Supplier (opsional)
     - Tanggal Beli (opsional)

2. **Update Stok:**
   - Klik "Edit" pada inventory item
   - Ubah jumlah stok
   - Stok akan otomatis berkurang saat pesanan selesai (jika ingredients sudah diatur di menu)

3. **Monitor Stok Rendah:**
   - Item dengan stok < minimum ditandai merah
   - Gunakan untuk reminder pembelian ulang

### Cara Kerja Auto-Deduction:
```
Contoh: Nasi Goreng Ayam
Ingredients:
- Beras: 0.2 kg
- Ayam: 0.1 kg
- Telur: 1 pcs
- Minyak: 0.05 liter

Saat 1 pesanan Nasi Goreng selesai:
→ Beras stok -0.2 kg
→ Ayam stok -0.1 kg
→ Telur stok -1 pcs
→ Minyak stok -0.05 liter
```

---

## 💰 Pendapatan (`/admin/revenue`)

**Fungsi:** Analisis pendapatan dan revenue dari semua warung

### Fitur:
- **Filter Time Range** - Hari Ini/Bulan Ini/3 Bulan/Tahun Ini
- **Total Revenue** - Total pendapatan periode
- **Total Orders** - Jumlah pesanan selesai
- **Active Users** - Warung yang aktif berjualan
- **Avg Order Value** - Rata-rata nilai per pesanan

### Grafik:
- **Revenue by User** - Top 10 warung terlaris
- **Revenue by Menu** - Top 20 menu terlaris
- **Monthly Revenue Trend** - Tren bulanan (untuk 3 bulan/tahun)

### Cara Pakai:
1. Pilih time range dari dropdown
2. Lihat ringkasan statistik di cards atas
3. Scroll untuk melihat grafik detail
4. Gunakan untuk analisis:
   - Warung mana yang perlu perhatian
   - Menu apa yang paling laku
   - Tren penjualan naik/turun

---

## 📈 Laporan (`/admin/reports`)

**Fungsi:** Laporan detail dan export data

### Fitur:
- **Daily Reports** - Laporan harian per warung
- **Sales Summary** - Ringkasan penjualan
- **Inventory Reports** - Laporan stok
- **Export to Excel/CSV** - Download data untuk analisis

### Cara Pakai:
1. Pilih jenis laporan
2. Set tanggal mulai dan akhir
3. Pilih warung (atau semua)
4. Klik "Generate Report"
5. Klik "Export" untuk download

---

## 🔄 Sinkronisasi (`/admin/sync`)

**Fungsi:** Mengelola dan monitor sinkronisasi data dari semua device

### Fitur:
- **Sync Logs** - Riwayat semua operasi sync
- **Data Review** - Preview data yang di-sync
- **Delete Records** - Hapus data salah/duplikat
- **Filter by Table** - Lihat sync per tabel (Pesanan/Menu/Inventory)

### Info Ditampilkan:
- **Total Sync** - Jumlah operasi sync
- **Pesanan Count** - Jumlah pesanan tersinkron
- **Menu Count** - Jumlah menu tersinkron
- **Inventory Count** - Jumlah inventory tersinkron

### Tabel Sync Logs:
| Kolom | Keterangan |
|-------|------------|
| Status | ✅ Sukses / ❌ Error |
| Waktu | Timestamp sync |
| Device | Device ID yang sync |
| Aksi | CREATE/UPDATE/DELETE |
| Tabel | pesanan/menu/inventory/dailyReport |
| Record ID | ID record di database |
| Data | JSON data (klik "Lihat") |
| Hapus | Tombol delete record |

### Cara Pakai:
1. **Monitor Sync:**
   - Buka halaman Sinkronisasi
   - Cek status sync terakhir dari setiap device
   - Green checkmark = sukses, Red alert = error

2. **Filter Data:**
   - Klik tab "Semua/Pesanan/Menu/Inventory"
   - Lihat hanya data tabel tertentu

3. **Hapus Data Salah:**
   - Temukan record yang salah di tabel
   - Klik icon trash (🗑️)
   - Konfirmasi hapus
   - Data terhapus dari database

4. **Review Error:**
   - Cari baris dengan ❌ merah
   - Klik "Lihat" pada kolom Data
   - Periksa error message
   - Perbaiki di device atau hapus

### Kapan Sync Terjadi:
- **Otomatis setiap 5 menit** dari device employee
- **Saat device online** (event-based)
- Employee **tidak bisa manipulasi sync** (hanya admin)

### Troubleshooting:
- **Device tidak sync:** Cek koneksi internet device
- **Sync error:** Lihat error message di kolom Error
- **Data duplikat:** Hapus via tombol Delete
- **Data hilang:** Cek apakah device pernah sync (lihat Last Seen di Perangkat)

---

## ⚙️ Pengaturan (`/admin/settings`)

**Fungsi:** Konfigurasi sistem dan profil admin

### Fitur:
- **Profile Settings** - Update nama, email, password admin
- **Warung Info** - Info warung (nama, alamat)
- **System Settings** - Konfigurasi sistem:
  - Sync interval
  - Auto-backup
  - Tax settings
- **Database Backup** - Backup/restore database
- **User Management** - Tambah/hapus admin

### Cara Pakai:
1. **Update Profile:**
   - Edit nama/email
   - Ganti password (opsional)
   - Klik "Simpan"

2. **Database Backup:**
   - Klik "Backup Database"
   - File .sql akan di-download
   - Simpan di tempat aman
   - Restore dengan klik "Restore" dan upload file

3. **Sync Settings:**
   - Ubah interval sync (default 5 menit)
   - Klik "Simpan Pengaturan"

---

## 🔐 Logout

Klik nama admin di pojok kanan atas → "Logout"

---

## ⚠️ Penting untuk Admin

### Keamanan:
- **Jangan share password admin** dengan karyawan
- **Gunakan email unik** untuk setiap karyawan
- **Backup database** secara berkala
- **Monitor sync logs** untuk detect anomali

### Best Practices:
1. **Review sync logs** minimal 1x sehari
2. **Cek stok inventory** sebelum tutup toko
3. **Generate daily report** setiap hari
4. **Backup database** minimal 1x seminggu
5. **Nonaktifkan device** yang tidak terpakai

### Troubleshooting Umum:

**Q: Data pesanan tidak muncul di admin?**
- Cek apakah device sudah sync (lihat Sinkronisasi)
- Cek status device aktif (lihat Perangkat)
- Cek koneksi internet device

**Q: Stok tidak berkurang otomatis?**
- Pastikan menu memiliki ingredients yang sudah diatur
- Cek stok inventory masih tersedia
- Lihat error di sync logs

**Q: Sync error terus-menerus?**
- Cek sync logs untuk detail error
- Restart device employee
- Hapus sync queue di device (via admin)

**Q: Lupa password admin?**
- Contact super admin atau
- Reset manual via database

---

## 📞 Support

Jika ada masalah teknis atau pertanyaan, hubungi:
- Email: support@warungpos.com
- WhatsApp: +62 xxx xxxx xxxx
- Dokumentasi: [GitHub Repository](https://github.com/yourusername/warung-manager)

---

**Terakhir diupdate:** 2025-10-04
