import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

const faqs = [
  {
    q: 'Apa itu Muslim Traveler?',
    a: 'Muslim Traveler adalah web app pendamping ibadah untuk membantu jadwal sholat, pengingat adzan, baca Quran, cek kalender hijriah, hingga menemukan masjid dan restoran halal saat bepergian.',
  },
  {
    q: 'Kenapa jadwal sholat saya bisa berbeda dengan aplikasi lain?',
    a: 'Perbedaan kecil bisa terjadi karena metode perhitungan, koordinat lokasi, dan zona waktu. Muslim Traveler menghitung berdasarkan lokasi Anda saat ini agar hasil tetap relevan dengan posisi aktual.',
  },
  {
    q: 'Bagaimana cara mengaktifkan notifikasi adzan?',
    a: 'Buka halaman utama, aktifkan pengingat adzan, lalu izinkan notifikasi saat browser meminta permission. Setelah aktif, notifikasi bisa muncul sebelum waktu sholat dan saat waktu sholat tiba.',
  },
  {
    q: 'Apakah notifikasi tetap masuk saat website ditutup?',
    a: 'Ya, selama browser mendukung Web Push dan permission notifikasi sudah diberikan. Sistem menggunakan Service Worker sehingga notifikasi tetap bisa diterima ketika tab website tidak aktif.',
  },
  {
    q: 'Bagaimana cara stop suara adzan dari notifikasi?',
    a: 'Saat notifikasi muncul, tekan tombol aksi Stop Adzan di notifikasi sistem. Tombol ini akan menghentikan suara tanpa perlu membuka halaman secara manual.',
  },
  {
    q: 'Fitur apa saja yang tersedia saat ini?',
    a: 'Fitur utama meliputi jadwal sholat, Quran, kalender hijriah, doa harian, asmaul husna, panduan sholat, puasa, qibla, tasbih, tracker sholat, zakat, catatan, pencarian surah, masjid terdekat, dan restoran halal.',
  },
  {
    q: 'Apakah data lokasi saya aman?',
    a: 'Lokasi digunakan untuk menghitung jadwal sholat dan fitur berbasis sekitar Anda. Data dipakai secukupnya untuk fungsi aplikasi dan tidak ditampilkan ke pengguna lain.',
  },
  {
    q: 'Kenapa halaman awal kadang butuh waktu saat pertama kali dibuka?',
    a: 'Pada kunjungan pertama, browser perlu memuat aset inti dan meminta izin lokasi. Setelah itu, data akan dicache sehingga kunjungan berikutnya terasa jauh lebih cepat.',
  },
  {
    q: 'Bagaimana kalau saya sedang di perjalanan antar kota/negara?',
    a: 'Gunakan refresh lokasi dari halaman utama agar koordinat dan timezone terbaru dipakai. Jadwal sholat akan menyesuaikan otomatis sesuai lokasi terbaru.',
  },
  {
    q: 'Saya mengalami bug, harus lapor ke mana?',
    a: 'Anda bisa melaporkan bug dengan detail langkah kejadian, perangkat, dan browser yang digunakan. Sertakan screenshot bila memungkinkan agar proses perbaikan lebih cepat.',
  },
];

export default function BantuanPage() {
  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Bantuan</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Pusat Bantuan & FAQ</h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        <section className="glass-panel rounded-[1.6rem] p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-slate-700">
            Halaman ini berisi jawaban cepat untuk pertanyaan paling umum seputar penggunaan fitur Muslim Traveler. Jika Anda baru pertama kali memakai aplikasi,
            mulai dari FAQ notifikasi dan jadwal sholat di bawah ini.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          {faqs.map((item, idx) => (
            <article key={item.q} className="glass-panel rounded-[1.4rem] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">FAQ {String(idx + 1).padStart(2, '0')}</p>
              <h2 className="mt-2 text-base font-semibold text-slate-900">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.a}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
