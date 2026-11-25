# 🎵 SoundVault — Aplikasi Pemutar Musik Offline iOS

Aplikasi pemutar dan penyimpanan lagu khusus untuk iPhone Anda:
- **100% Bebas Iklan** (Tanpa banner, video, atau pelacak).
- **Offline Storage**: Lagu disimpan langsung di memori lokal iPhone via direktori dokumen aplikasi.
- **Background Playback**: Musik tetap berputar saat layar HP mati atau saat membuka aplikasi lain.
- **Import Mudah**: Langsung pilih file audio (`.mp3`, `.m4a`, `.wav`, `.flac`) dari aplikasi **Files** bawaan iOS atau iCloud Drive.
- **Fitur Lengkap**: Pencarian instan, daftar lagu favorit, ganti nama file, shuffle, repeat, dan slider scrubber.

---

## 🚀 Cara 1: Jalankan Langsung di iPhone 11 (Paling Cepat & Praktis)

Anda tidak perlu ribet menginstal via kabel atau bayar biaya apapun. Cukup gunakan **Expo Go**:

1. **Install Expo Go di iPhone 11:**
   - Buka **App Store** di iPhone 11 Anda.
   - Cari dan unduh aplikasi **Expo Go** (Gratis dan resmi).

2. **Jalankan Server di Laptop:**
   - Buka Terminal / PowerShell di laptop Anda.
   - Masuk ke folder proyek:
     ```powershell
     cd "d:\Software\Apps Mobile Dev\offline-music-app"
     ```
   - Jalankan perintah:
     ```powershell
     npx expo start
     ```
   - Di layar terminal akan muncul **QR Code**.

3. **Buka di iPhone:**
   - Pastikan laptop dan iPhone 11 Anda terhubung ke **jaringan Wi-Fi yang sama**.
   - Buka aplikasi **Kamera** bawaan iPhone 11 Anda, lalu arahkan ke QR Code di layar laptop.
   - Ketuk banner kuning bertuliskan **"Open in Expo Go"**.
   - Aplikasi **SoundVault** akan langsung terbuka dan siap digunakan!

---

## 📦 Cara 2: Menjadikan File `.ipa` Mandiri (Standalone App)

Jika Anda ingin aplikasinya terinstal permanen seperti aplikasi dari App Store:

1. **Build file `.ipa` via Cloud (Gratis):**
   ```powershell
   npm install -g eas-cli
   eas login
   eas build -p ios --profile preview
   ```
2. Setelah proses build selesai di cloud, Anda akan mendapatkan link download file `.ipa`.
3. Pasang ke iPhone 11 menggunakan software Windows gratis seperti **Sideloadly** atau **AltStore** dengan menyambungkan kabel USB.

---

## 🎧 Cara Menambahkan Lagu ke iPhone:

1. Di iPhone Anda, simpan file MP3/lagu ke aplikasi **Files** bawaan iOS (bisa via download di Safari, kirim lewat AirDrop, atau pindahkan dari Google Drive/iCloud).
2. Buka aplikasi **SoundVault**.
3. Ketuk tombol **"+ Tambah"** di pojok kanan atas.
4. Pilih satu atau beberapa file lagu yang ingin disimpan.
5. Selesai! Lagu langsung masuk ke penyimpanan lokal dan bisa diputar kapan saja tanpa internet dan tanpa iklan.
