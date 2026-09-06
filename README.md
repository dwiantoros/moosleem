# 📖 Muslim Traveler - Quran Reading & Prayer Times App

A modern, clean web application designed for Muslim travelers. Features Quran reading, prayer times with azan reminders, timezone auto-detection, and halal restaurant recommendations nearby.

## ✨ Features

- **📖 Quran Reader**: Browse and read the complete Quran with smooth navigation
- **⏰ Prayer Times**: Automatically detect your location and display accurate prayer times
- **🔔 Azan Reminders**: Get notifications before each prayer time (with browser notifications)
- **🌍 Timezone Auto-Detection**: Automatically updates prayer times based on your timezone
- **🍽️ Halal Restaurant Finder**: Discover nearby halal restaurants with ratings and contact info
- **🎨 Apple-Style UI**: Clean, minimalist design inspired by Apple's design philosophy
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS
- **APIs**:
  - Aladhan API for prayer times
  - Quran.com API for Quran content
  - Browser Geolocation API for location detection
- **State Management**: React Hooks
- **HTTP Client**: Axios

## 📦 Installation

1. Install dependencies
```bash
npm install
```

2. Run the development server
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Flow Singkat Penggunaan

### 1) Alur pengguna umum
1. Buka aplikasi di `http://localhost:3000` untuk development, atau domain Vercel untuk production.
2. Aplikasi akan meminta akses lokasi. Izinkan agar jadwal sholat dan rekomendasi masjid/restoran bisa disesuaikan dengan lokasi pengguna.
3. Jika diminta, aktifkan browser notification agar adzan reminder dan push notification bisa muncul.
4. Gunakan menu utama untuk:
   - melihat jadwal sholat hari ini,
   - membaca Quran,
   - cek masjid/restoran halal terdekat,
   - melihat konten artikel dan panduan Islam.
5. Jika user sudah masuk ke halaman publik, semua fitur berjalan tanpa login. Untuk admin, masuk ke route khusus.

### 2) Akses admin / CMS
1. Buka halaman login admin di `/bukan-admin/login`.
2. Login memakai username dan password yang di-set di environment variable:
   - `CMS_ADMIN_USERNAME`
   - `CMS_ADMIN_PASSWORD`
   - `CMS_SESSION_SECRET`
3. Setelah login, admin bisa mengelola:
   - artikel blog,
   - profil author,
   - SEO per halaman,
   - asset/gambar,
   - notifikasi push.
4. Database yang dipakai akan otomatis mengikuti konfigurasi environment:
   - local development: memakai file lokal `local-cms.db`,
   - production: memakai Turso/libsql jika `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` tersedia.

### 3) Database dan mode penyimpanan
- Untuk local development, aplikasi otomatis memakai SQLite-like file `local-cms.db` via libsql.
- URL database lokal biasanya otomatis dibuat sebagai `file:./local-cms.db` oleh app.
- Untuk production, isi variabel `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` dari dashboard Turso project Anda.
- Format URL biasanya seperti:

```bash
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

- Jika production belum punya `TURSO_DATABASE_URL`, sistem akan menampilkan warning, dan CMS tidak bisa menyimpan data baru.
- Untuk fitur push notification, aplikasi juga mendukung storage fallback ke KV atau Turso sesuai environment. Ini penting supaya subscription notifikasi tetap aman dan bisa di-trigger dari cron.

### 4) Singkatnya
- User biasa: buka app, izinkan lokasi, nikmati fitur utama.
- Admin: login ke `/bukan-admin/login` lalu kelola content.
- Database: lokal di `file:./local-cms.db`, production di `TURSO_DATABASE_URL` seperti `libsql://...`.

### 5) Akses lewat Vercel
- Deploy project di Vercel dengan repo ini.
- Setelah deploy, app utama biasanya bisa diakses di:

```bash
https://your-project.vercel.app
```

- Login admin di:

```bash
https://your-project.vercel.app/bukan-admin/login
```

- Halaman publik artikel biasanya di:

```bash
https://your-project.vercel.app/artikel
```

- Pastikan di Vercel environment variables sudah diisi:

```bash
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=your-secure-password
CMS_SESSION_SECRET=your-random-session-secret
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
PUSH_VAPID_PRIVATE_KEY=your-vapid-private-key
PUSH_VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your-random-secret
```

> Catatan: semua nilai di atas harus diganti dengan nilai asli yang disimpan di environment Vercel Anda. Jangan menaruh secret asli di repo GitHub.

- Jika app sudah dipasang di Vercel, semua variabel di atas harus diisi di Project Settings > Environment Variables supaya halaman admin, CMS, dan push notification bisa berjalan.

## 🚀 Usage

### Getting Started
1. **Grant Location Permission**: The app will request permission to access your location for accurate prayer times
2. **Enable Notifications**: For azan reminders, enable browser notifications when prompted
3. **Select Prayer Reminder**: Use the tab navigation to enable/disable azan reminders

### Reading Quran
1. Click on "📖 Read Quran" tab
2. Search or browse through Surahs (chapters)
3. Click on your desired Surah to view its verses

### Checking Prayer Times
- Main page shows all prayer times for your location
- Next prayer is highlighted with countdown
- Use "Refresh" button to update times

### Finding Halal Restaurants
1. Click on "🍽️ Halal Food" tab
2. View nearby restaurants sorted by distance
3. Click on a restaurant to see details, ratings, and contact info

## 🔧 Configuration

### CMS Artikel + SEO Admin

Project ini sekarang punya CMS artikel sederhana di `/bukan-admin/login` dengan fitur:

- Login admin berbasis env
- CRUD artikel
- Visual editor ala WordPress + mode HTML
- Upload gambar langsung ke database CMS
- SEO per artikel: slug, SEO title, SEO description, keywords, canonical URL, OG image
- SEO default untuk halaman indeks artikel
- Halaman publik artikel di `/artikel` dan `/artikel/[slug]`

#### Setup cepat local

1. Copy env dari `.env.example` ke `.env.local`
2. Isi minimal:

```bash
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=password-aman
CMS_SESSION_SECRET=random-string-panjang
```

3. Jalankan app seperti biasa:

```bash
npm run dev
```

Saat development, CMS otomatis memakai database lokal `local-cms.db`.

#### Setup database gratis untuk production: Turso

Turso cocok untuk Next.js dan punya free tier. Langkah setup:

```bash
npm install -g @turso/cli
turso auth login
turso db create muslim-traveler-cms
turso db show muslim-traveler-cms --url
turso db tokens create muslim-traveler-cms
```

Contoh URL database yang akan didapat:

```bash
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

Lalu isi env di Vercel:

```bash
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_PASSWORD=your-secure-password
CMS_SESSION_SECRET=your-random-session-secret
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

Catatan:

- Kalau `TURSO_DATABASE_URL` tidak diisi di production, halaman artikel tetap hidup tapi CMS tidak bisa menyimpan data baru.
- `src/app/robots.ts` saat ini masih `Disallow: /`, jadi metadata SEO artikel sudah siap, tapi bot mesin pencari tetap diblok sampai aturan robots dibuka lagi.

### Server-side Web Push (Adzan when website is closed)

This project now supports server-side Web Push delivery via:

- `POST /api/push/subscribe` (store subscription + location)
- `POST /api/push/unsubscribe`
- `GET /api/push/public-key`
- `GET|POST /api/cron/push-prayer` (triggered by external cron scheduler)

Set these environment variables in Vercel (or `.env.local` for local testing):

```bash
PUSH_VAPID_PUBLIC_KEY=...
PUSH_VAPID_PRIVATE_KEY=...
PUSH_VAPID_SUBJECT=mailto:you@example.com
CRON_SECRET=your-random-secret
```

Notes:

- In production, use Vercel KV for best durability at scale.
- If KV credentials are not present, the app now falls back to Turso/libsql storage.
- In-memory fallback is only used as last resort (typically local/dev without KV and without Turso).
- Browser notification action `Stop Adzan` is available and will stop adzan audio for active clients.

#### External cron setup (Vercel Hobby compatible)

Vercel Hobby tidak mendukung cron per-menit. Gunakan scheduler eksternal (misalnya cron-job.org, EasyCron, UptimeRobot, GitHub Actions) untuk memanggil endpoint ini setiap 1 menit:

```bash
https://muslim-traveler.vercel.app/api/cron/push-prayer?secret=CRON_SECRET_ANDA
```

Alternatif auth yang didukung endpoint:

- Query param: `?secret=...`
- Header `Authorization: Bearer <CRON_SECRET>`
- Header `x-cron-secret: <CRON_SECRET>`
- Header `x-api-key: <CRON_SECRET>`

Respons sukses berisi ringkasan:

```json
{
  "ok": true,
  "triggeredAt": "2026-04-12T10:00:00.000Z",
  "total": 10,
  "sent": 3,
  "removed": 1
}
```

### API Keys Required

Update the following in `src/utils/prayerTimes.ts`:
- Timezone API Key (for advanced timezone support)
- OpenCage API Key (optional, for reverse geocoding)

### Prayer Method
Method 2 (ISNA) is used by default. To change:
- Modify the `method` parameter in API calls
- Other methods: 1=Ummul Qura, 3=Egypt, 4=Karachi, 5=Tehran, 7=Itiqaf

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 🎨 UI/UX Highlights

- **Minimalist Design**: Clean white space and soft shadows
- **Color Palette**: Indigo accent colors with gray neutrals
- **Typography**: Clear hierarchy and readability
- **Interactions**: Smooth transitions and hover states
- **Accessibility**: High contrast ratios and semantic HTML

## 🔐 Privacy

- Geolocation data is processed locally; only coordinates are sent to APIs
- No user data is stored or tracked
- All communications are encrypted (HTTPS)

## 📄 API Documentation

### Prayer Times Endpoint
```
GET /api/prayer-times?latitude=FLOAT&longitude=FLOAT&date=DD-MM-YYYY
```

### Restaurants Endpoint
```
GET /api/restaurants?latitude=FLOAT&longitude=FLOAT&radius=5000
```

## 🐛 Known Issues & Limitations

- Restaurant data is currently mocked (mock API responses)
- Requires HTTPS for geolocation on production
- Some browsers may block notifications on private browsing

## 🚧 Future Enhancements

- [ ] Real halal restaurant API integration
- [ ] Qibla direction indicator with compass
- [ ] Islamic calendar integration
- [ ] Audio Quran recitations
- [ ] Dark mode support
- [ ] Multi-language support (Arabic, Urdu, etc.)
- [ ] Offline mode with cached Quran data
- [ ] Prayer time notifications with sound option

## 📝 License

This project is open source and available under the MIT License.

---

Made with ❤️ for Muslim travelers worldwide
