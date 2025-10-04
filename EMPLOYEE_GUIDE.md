# 📱 Panduan Karyawan/Kasir - Warung POS

Panduan lengkap penggunaan sistem Warung POS untuk **Karyawan/Kasir**.

---

## 🔐 Login Kasir

**URL:** `/login`

1. Minta email dan password dari pemilik warung/admin
2. Buka aplikasi di browser device kasir
3. Masukkan email dan password
4. Klik "Masuk"
5. Akan diarahkan ke Dashboard Kasir

> **Note:** Setiap kasir/karyawan memiliki akun terpisah dengan 1 device ID unik.

---

## 🏠 Beranda (`/`)

**Fungsi:** Dashboard utama kasir dengan ringkasan hari ini

### Info Ditampilkan:
- **Pesanan Hari Ini** - Jumlah pesanan yang sudah dibuat
- **Pesanan Selesai** - Jumlah pesanan completed
- **Pesanan Pending** - Pesanan yang masih dalam proses
- **Total Penjualan** - Total rupiah penjualan hari ini

### Fitur:
- **Refresh otomatis** saat halaman dibuka
- **Data real-time** dari database lokal (IndexedDB)
- **Quick Stats** untuk monitoring performa harian

### Cara Pakai:
- Dashboard otomatis load saat login
- Klik "Muat Ulang" untuk refresh data
- Lihat grafik tren penjualan 7 hari terakhir

---

## 🛒 Pesanan (`/orders`)

**Fungsi:** Lihat dan kelola semua pesanan

### Daftar Pesanan:
Menampilkan semua pesanan dengan info:
- **Nomor Meja** - Identitas pesanan
- **Items** - Daftar menu yang dipesan
- **Total** - Harga total
- **Status** - Pending/Completed/Cancelled
- **Waktu** - Tanggal dan jam pesanan

### Filter Status:
- **Semua** - Tampilkan semua pesanan
- **Pending** - Pesanan dalam proses
- **Selesai** - Pesanan sudah dibayar
- **Batal** - Pesanan dibatalkan

### Aksi Pesanan:
| Status | Aksi Tersedia |
|--------|---------------|
| Pending | Selesaikan / Batalkan |
| Completed | Lihat Detail |
| Cancelled | Lihat Detail |

### Cara Pakai:
1. **Melihat Pesanan:**
   - Buka halaman Pesanan
   - Scroll untuk lihat semua
   - Klik filter untuk lihat status tertentu

2. **Menyelesaikan Pesanan:**
   - Cari pesanan pending
   - Klik tombol "Selesaikan"
   - Konfirmasi
   - Status berubah ke Completed
   - **Penting:** Stok inventory otomatis berkurang saat pesanan selesai!

3. **Membatalkan Pesanan:**
   - Cari pesanan pending
   - Klik tombol "Batalkan"
   - Konfirmasi
   - Status berubah ke Cancelled
   - Stok tidak berubah

---

## ➕ Buat Pesanan Baru (`/orders/new`)

**Fungsi:** Input pesanan baru dari pelanggan

### Langkah-langkah:
1. **Input Nomor Meja:**
   - Masukkan nomor meja (contoh: "A1", "B2", "VIP 1")
   - Atau nomor antrian (contoh: "001", "002")

2. **Pilih Menu:**
   - List menu akan muncul
   - Klik tombol "+" untuk tambah item
   - Muncul di daftar pesanan

3. **Atur Quantity:**
   - Klik "-" untuk kurangi
   - Klik "+" untuk tambah
   - Atau ketik langsung jumlah

4. **Tambah Catatan (Opsional):**
   - Klik "Tambah Catatan" pada item
   - Tulis request khusus (contoh: "Tidak pakai cabe", "Extra sambal")

5. **Review Total:**
   - Cek subtotal per item
   - Cek grand total di bawah

6. **Simpan Pesanan:**
   - Klik tombol "Buat Pesanan"
   - Pesanan tersimpan dengan status "Pending"
   - Otomatis kembali ke list pesanan

### Tips:
- **Cek ketersediaan** - Menu habis tidak bisa dipilih (ditandai abu-abu)
- **Double check** - Pastikan pesanan benar sebelum klik Buat Pesanan
- **Catatan jelas** - Tulis catatan yang mudah dipahami dapur

### Cara Kerja:
```
Customer pesan → Input di system → Status: Pending
                        ↓
                 Kirim ke dapur
                        ↓
                 Makanan siap
                        ↓
                 Klik "Selesaikan" → Status: Completed
                        ↓
                 Stok berkurang otomatis
                        ↓
                 Data sync ke server
```

---

## 📊 Status Stok (`/stock`)

**Fungsi:** Monitor stok bahan baku secara real-time

### Info Ditampilkan:
- **Nama Bahan** - Nama inventory item
- **Stok Saat Ini** - Jumlah tersedia
- **Unit** - Satuan (kg, liter, pcs)
- **Stok Minimum** - Batas alert
- **Status** - Aman/Rendah/Habis

### Indikator Warna:
- 🟢 **Hijau** - Stok aman (> minimum)
- 🟡 **Kuning** - Stok rendah (= minimum)
- 🔴 **Merah** - Stok habis (< minimum)

### Cara Pakai:
1. Buka halaman Status Stok
2. Lihat semua bahan baku
3. **Item merah/kuning** - Lapor ke pemilik untuk restock
4. Klik "Refresh" untuk update data terbaru

### Kapan Cek Stok:
- **Awal shift** - Sebelum mulai terima pesanan
- **Tengah hari** - Cek stok menu populer
- **Akhir shift** - Catat stok yang habis
- **Sebelum tutup** - Report ke pemilik

### Tips:
- **Jangan terima pesanan** jika stok bahan utama habis
- **Info customer** jika menu tidak tersedia
- **Catat manual** jika sistem error

---

## 📦 Bahan Baku (`/inventory`)

**Fungsi:** Lihat daftar inventory (hanya lihat, tidak bisa edit)

### Info Ditampilkan:
- **Nama** - Nama bahan baku
- **Kategori** - Bahan Baku/Kemasan/Lainnya
- **Stok** - Jumlah tersedia
- **Unit** - Satuan
- **Stok Minimum** - Threshold

### Filter:
- **Semua** - Tampilkan semua item
- **Bahan Baku** - Rice, chicken, vegetables, dll
- **Kemasan** - Boxes, cups, plastic, dll
- **Lainnya** - Miscellaneous items

### Cara Pakai:
- Buka halaman Bahan Baku
- Lihat stok tersedia
- **Hanya untuk informasi** - tidak bisa edit/tambah
- Edit inventory hanya bisa dilakukan admin

> **Note:** Stok berkurang otomatis saat pesanan selesai berdasarkan resep menu.

---

## 📈 Laporan (`/reports`)

**Fungsi:** Lihat statistik penjualan dan generate laporan harian

### Statistik Ditampilkan:
- **Pesanan Hari Ini** - Total pesanan completed hari ini
- **Pesanan 7 Hari** - Total pesanan 7 hari terakhir
- **Menu Terlaris** - Item paling banyak terjual
- **Rata-rata Pesanan/Hari** - Average daily orders

### Grafik:
- **Tren 7 Hari** - Bar chart pesanan per hari
- **Menu Populer** - Top 10 menu terlaris

### Fitur:
- **Buat Laporan Harian** - Generate daily report
- **Muat Ulang Data** - Refresh statistik

### Cara Pakai:
1. **Lihat Laporan:**
   - Buka halaman Laporan
   - Lihat statistik otomatis

2. **Generate Laporan Harian:**
   - Klik tombol "Buat Laporan Harian"
   - Sistem kalkulasi:
     - Total penjualan hari ini
     - Total pesanan selesai
     - Total modal (dari harga beli bahan)
     - Keuntungan (penjualan - modal)
     - Item terlaris
   - Laporan tersimpan lokal
   - **Auto-sync ke server** dalam 5 menit

3. **Kapan Generate:**
   - **Akhir shift** - Sebelum pulang
   - **Tutup toko** - Setiap hari
   - **Request pemilik** - Saat diminta

### Informasi Penting:
```
Laporan Harian berisi:
✅ Total Penjualan (Rp)
✅ Jumlah Pesanan
✅ Total Modal/COGS (Rp)
✅ Keuntungan Bersih (Rp)
✅ Menu Terlaris
```

---

## 🔄 Sinkronisasi (`/debug-sync`)

**Fungsi:** Monitor status sinkronisasi data ke server

### Info Ditampilkan:
- **Pesanan (Local)** - Jumlah pesanan di device
- **Menu (Local)** - Jumlah menu di device
- **Inventory (Local)** - Jumlah inventory di device

### Antrian Sinkronisasi:
Tabel menampilkan data yang akan/sudah di-sync:
- **ID** - ID sync queue
- **Action** - CREATE/UPDATE/DELETE
- **Table** - pesanan/menu/inventory
- **Record ID** - ID data
- **Synced** - ✅ Sudah / ❌ Belum
- **Retry Count** - Berapa kali retry
- **Error** - Pesan error (jika ada)

### Status Sync:
- 🟢 **Auto-sync aktif** - Sync otomatis setiap 5 menit
- **Refresh** - Tombol untuk reload status

### Cara Pakai:
1. Buka halaman Sinkronisasi
2. Lihat status sync queue
3. **Hijau** - Data sudah sync
4. **Merah** - Ada error, lapor admin

### Kapan Data Di-Sync:
- **Otomatis setiap 5 menit** (background)
- **Saat device online** (jika sempat offline)
- **Tidak bisa manual trigger** (hanya admin yang bisa)

### Troubleshooting:
**Q: Data belum sync?**
- Tunggu max 5 menit
- Cek koneksi internet
- Cek status "Auto-sync aktif" muncul

**Q: Banyak error di sync queue?**
- Screenshot error message
- Lapor ke pemilik/admin
- **Jangan hapus data** sendiri

**Q: Koneksi terputus?**
- Data tetap tersimpan lokal (IndexedDB)
- Akan auto-sync saat online kembali
- Tetap bisa terima pesanan offline

---

## ⚠️ Penting untuk Kasir

### Do's ✅
- **Selesaikan pesanan** setelah customer bayar
- **Cek stok** sebelum terima pesanan
- **Generate laporan** setiap akhir shift
- **Pastikan koneksi internet** stabil
- **Refresh data** saat mulai shift

### Don'ts ❌
- **Jangan edit** data inventory (hanya admin)
- **Jangan hapus** pesanan yang sudah completed
- **Jangan share** password login
- **Jangan manipulasi** sync queue
- **Jangan tutup browser** saat sync berjalan

### Best Practices:
1. **Awal Shift:**
   - Login
   - Cek dashboard
   - Cek stok bahan baku
   - Pastikan sync aktif

2. **Selama Shift:**
   - Input pesanan dengan teliti
   - Selesaikan pesanan setelah bayar
   - Monitor stok berkurang
   - Lapor jika stok habis

3. **Akhir Shift:**
   - Generate laporan harian
   - Cek semua pesanan pending
   - Tunggu sync selesai
   - Logout

### Troubleshooting Umum:

**Q: Menu tidak muncul saat buat pesanan?**
- Cek menu masih tersedia (tidak habis)
- Refresh halaman
- Cek koneksi internet

**Q: Pesanan tidak tersimpan?**
- Cek koneksi internet
- Cek apakah ada error message
- Retry/refresh dan input ulang

**Q: Stok tidak berkurang setelah pesanan selesai?**
- Normal, mungkin menu belum ada resep
- Lapor ke admin
- Lanjut terima pesanan

**Q: Lupa password?**
- Hubungi pemilik warung/admin
- Jangan coba reset sendiri

**Q: Device lemot/crash?**
- Close tabs lain
- Refresh browser
- Restart device
- Lapor admin jika masih error

---

## 🔐 Logout

Klik nama user di pojok kanan atas → "Keluar"

> **Penting:** Selalu logout saat selesai shift!

---

## 📞 Bantuan

Jika ada masalah atau pertanyaan:
1. **Hubungi pemilik warung** terlebih dahulu
2. **Screenshot error** jika ada
3. **Catat langkah** yang menyebabkan error
4. **Jangan panic** - data tersimpan lokal tetap aman

---

## 🎓 Tips & Trik

### Shortcut Keyboard:
- `Ctrl + R` - Refresh halaman
- `F5` - Refresh halaman
- `Ctrl + Shift + R` - Hard refresh (clear cache)

### Performance Tips:
- **Tutup tab** yang tidak terpakai
- **Jangan buka** terlalu banyak aplikasi
- **Clear browser cache** seminggu sekali
- **Restart device** setiap hari

### Data Safety:
- **Data tersimpan lokal** (IndexedDB) - aman meski offline
- **Auto-sync ke server** - backup otomatis
- **Jangan clear browser data** tanpa seijin admin

---

**Terakhir diupdate:** 2025-10-04
