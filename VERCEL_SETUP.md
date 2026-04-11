# 🚀 Vercel Environment Setup Guide

## Konfigurasi Production Environment Variables

### 1️⃣ **Persiapan (Turso Database)**

#### A. Buat Turso Account & Database
- Kunjungi: https://app.turso.tech/sign-up
- Login / Sign Up
- Di dashboard, klik **"Create a new database"**
- Beri nama: `muslim-traveler` (atau sesuai keinginan)
- Pilih lokasi yang dekat (e.g., `lhr` untuk Europe, `sin` untuk Asia)
- Klik **"Create"**

#### B. Ambil Connection Credentials
- Di halaman database, klik **"Copy"** pada **Connection URL**
- Format: `libsql://xxx-xxx.turso.io`
- Klik tab **"Auth Tokens"** → **"Generate Token"** → **"Copy"**
- Format: `eyJhbGciOi...` (JWT token)

### 2️⃣ **Set Environment Variables di Vercel**

#### Via Vercel Dashboard
1. Kunjungi: https://vercel.com/dashboard/project/muslim-traveler/settings/environment-variables
2. Klik **"Add New"** untuk setiap variable:

| Variable | Value | Notes |
|----------|-------|-------|
| `CMS_ADMIN_USERNAME` | `admin` | Username untuk login CMS |
| `CMS_ADMIN_PASSWORD` | `your-secure-password` | Ganti dengan password yang kuat |
| `CMS_SESSION_SECRET` | `generate-random-32-chars` | Generate: `openssl rand -hex 16` atau random string |
| `TURSO_DATABASE_URL` | `libsql://xxx.turso.io` | Copy dari Turso dashboard |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOi...` | Copy dari Turso Auth Tokens |
| `CRON_SECRET` | `your-secret-key` | Untuk push notification cron jobs |

**Langkah-langkah:**
- Paste variable name (e.g., `TURSO_DATABASE_URL`)
- Paste value
- Select environments: **Production** ✅
- Klik **"Save"**
- Repeat untuk semua 6 variables

#### Via CLI (Alternative)
```bash
# Login ke Vercel
vercel login

# Set production env vars
vercel env add CMS_ADMIN_USERNAME production
vercel env add CMS_ADMIN_PASSWORD production
vercel env add CMS_SESSION_SECRET production
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add CRON_SECRET production

# Deploy ulang dengan env vars baru
vercel --prod
```

### 3️⃣ **Verifikasi Setup**

#### Test Turso Connection
```bash
npm run dev
# Kunjungi: http://localhost:3000/admin
# Login dengan: username=admin, password=yang-kamu-set
# Jika berhasil, Turso sudah terkoneksi ✅
```

#### Check Production
- Kunjungi: https://muslim-traveler.vercel.app/admin
- Login dengan credentials yang sama
- Jika "CMS Admin Aktif" muncul, setup sukses ✅

### 4️⃣ **Troubleshooting**

**❌ "CMS Admin Belum Aktif" di Production**
- ✅ Cek: Env vars sudah di Vercel Production?
- ✅ Cek: `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` benar?
- ✅ Cek: Klik "Deployment" → lihat env vars di "Build Logs"
- ✅ Klik "Redeploy" setelah set env vars

**❌ Login Gagal "Invalid Credentials"**
- ✅ Pastikan `CMS_ADMIN_USERNAME` dan `CMS_ADMIN_PASSWORD` sudah di Vercel
- ✅ Ulang deployment setelah set passwords
- ✅ Cek console browser (F12) untuk error details

**❌ Database Connection Error**
- ✅ Turso database masih active? Kunjungi https://app.turso.tech/
- ✅ Token expired? Generate token baru di Turso → copy → update di Vercel
- ✅ Wrong URL format? Harus `libsql://xxx.turso.io`, bukan `https://`

### 5️⃣ **Next Steps (Setelah Setup Berhasil)**

✅ Admin login berfungsi
✅ Media library bisa upload images
✅ Artikel bisa create/edit/delete
✅ Visual editor (Tiptap) siap pakai
✅ SEO fields (title, description, OG image) siap

**Optional Features:**
- Enable robots.txt indexing untuk SEO (ubah `Disallow: /` → `Disallow: /admin`)
- Setup push notifications (sudah ada VAPID keys, tinggal test)
- Setup automatic backups dari Turso

---

## 📝 Generate Secure Random Secrets

Jika perlu generate random string untuk `CMS_SESSION_SECRET`:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Mac/Linux:**
```bash
openssl rand -hex 24
```

---

**Perlu bantuan?** Cek logs di Vercel dashboard → Project Settings → Deployments → Recent deployment log
