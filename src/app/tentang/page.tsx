import QuranStyleHeader from '@/components/QuranStyleHeader';

const featureSections = [
  {
    title: 'Jadwal Sholat Real-time',
    description:
      'Moosleem menampilkan waktu Subuh, Dzuhur, Ashar, Maghrib, dan Isya berdasarkan lokasi aktual Anda. Data diambil dari API terpercaya, disesuaikan dengan koordinat perangkat, serta menyimpan cache agar tetap cepat saat dibuka kembali.',
    points: [
      'Deteksi lokasi otomatis dan fallback ke lokasi terakhir.',
      'Update berkala agar jadwal tetap akurat sepanjang hari.',
      'Penanda sholat berikutnya untuk membantu perencanaan ibadah.',
    ],
  },
  {
    title: 'Pengingat Adzan & Push Notification',
    description:
      'Fitur pengingat dapat mengirim notifikasi sebelum waktu sholat dan tepat saat waktu sholat tiba. Notifikasi tetap bisa muncul walau browser sedang ditutup karena menggunakan Service Worker dan Web Push.',
    points: [
      'Notifikasi H-10 menit dan saat masuk waktu sholat.',
      'Tombol aksi langsung dari notifikasi seperti Buka dan Stop Adzan.',
      'Kontrol izin notifikasi dari browser secara aman.',
    ],
  },
  {
    title: 'Quran Reader',
    description:
      'Halaman Quran membantu Anda membaca ayat dengan teks Arab yang nyaman, navigasi mudah, dan dukungan pencarian surah. Fokus utamanya adalah akses cepat untuk tilawah saat mobile maupun desktop.',
    points: [
      'Typography Arab yang mudah dibaca.',
      'Navigasi antarsurah yang ringan.',
      'Halaman pencarian untuk mempercepat temuan surah.',
    ],
  },
  {
    title: 'Kalender Hijriah',
    description:
      'Kalender Hijriah memberi referensi tanggal Islam berdampingan dengan kalender masehi. Sangat berguna untuk perencanaan ibadah rutin, puasa sunnah, dan momen penting Islam.',
    points: [
      'Tersedia dari menu utama floating bar.',
      'Mudah dipakai untuk cek tanggal hari ini.',
      'Mendukung konteks ibadah harian dan musiman.',
    ],
  },
  {
    title: 'Pencarian Masjid & Restoran Halal',
    description:
      'Saat bepergian, Anda bisa cepat menemukan masjid terdekat serta opsi makanan halal. Fitur ini dirancang sebagai pendamping perjalanan agar kebutuhan ibadah dan konsumsi tetap terjaga.',
    points: [
      'Berbasis lokasi pengguna.',
      'Akses cepat lewat menu utama.',
      'Membantu keputusan saat sedang on-the-go.',
    ],
  },
  {
    title: 'Fitur Penunjang Ibadah',
    description:
      'Selain fitur utama, tersedia banyak alat harian seperti Doa Harian, Asmaul Husna, Panduan Sholat, Puasa, Qibla, Tasbih, Tracker Sholat, Zakat, serta Catatan pribadi agar rutinitas ibadah lebih terarah.',
    points: [
      'Semua fitur terpusat di menu Lainnya.',
      'UI konsisten agar mudah dipelajari.',
      'Dirancang simpel supaya fokus tetap ke ibadah.',
    ],
  },
];

export default function TentangPage() {
  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <QuranStyleHeader title="Tentang Moosleem" />

        <section className="glass-panel rounded-[1.6rem] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            Moosleem adalah aplikasi pendamping ibadah untuk Muslim yang aktif berpindah lokasi. Tujuan utamanya adalah membantu Anda tetap tepat waktu sholat,
            mudah menemukan kebutuhan halal, dan punya akses cepat ke konten ibadah inti dalam satu tempat yang ringan.
          </p>
          <div className="islamic-divider my-5" />
          <p className="text-sm leading-relaxed text-slate-700">
            Kami merancang aplikasi ini dengan prinsip sederhana: cepat dibuka, mudah dipahami, dan relevan untuk kebutuhan ibadah harian. Karena itu, seluruh fitur dioptimalkan
            untuk pengalaman mobile-first tanpa membuat tampilan terasa ramai.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          {featureSections.map((feature) => (
            <article key={feature.title} className="glass-panel rounded-[1.6rem] p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{feature.description}</p>
              <ul className="mt-4 space-y-2">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
