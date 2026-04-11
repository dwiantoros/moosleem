'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

interface Step {
  title: string;
  arabic?: string;
  latin?: string;
  meaning?: string;
  note?: string;
}

interface PrayerGuide {
  name: string;
  arabic: string;
  rakaat: number;
  color: string;
  time: string;
  steps: Step[];
}

const GUIDES: PrayerGuide[] = [
  {
    name: 'Subuh', arabic: 'صَلَاةُ الْفَجْر', rakaat: 2, color: '#0891b2', time: 'Sebelum matahari terbit',
    steps: [
      {
        title: '1. Niat Sholat Subuh',
        arabic: 'أُصَلِّي فَرْضَ الصُّبْح رَكْعَتَيْن مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى',
        latin: 'Ushalli fardlash-shubhi rak\'ataini mustaqbilal qiblati adaa-an lillahi ta\'ala',
        meaning: 'Aku niat sholat fardhu Subuh dua rakaat menghadap kiblat karena Allah Ta\'ala',
      },
      {
        title: '2. Takbiratul Ihram',
        arabic: 'اللَّهُ أَكْبَرُ',
        latin: 'Allahu Akbar',
        meaning: 'Allah Maha Besar',
        note: 'Angkat kedua tangan setinggi telinga/bahu, lalu sedekap.',
      },
      {
        title: '3. Doa Iftitah',
        arabic: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ',
        latin: 'Allahumma baa\'id baini wa baina khataayaaya kamaa baa\'adta bainal masyriqi wal maghrib',
        meaning: 'Ya Allah, jauhkanlah antara aku dan kesalahanku, sebagaimana Engkau menjauhkan timur dari barat',
      },
      {
        title: '4. Al-Fatihah',
        arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ﴿١﴾ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ﴿٢﴾ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ﴿٣﴾ مَٰلِكِ يَوْمِ ٱلدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ ﴿٦﴾ صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ ﴿٧﴾',
        latin: 'Bismillahir rahmanir rahim. Alhamdulillahi rabbil \'aalamin. Arrahmanir rahim. Maliki yaumiddin. Iyyaka na\'budu wa iyyaka nasta\'in. Ihdinash shiratal mustaqim. Shiratal ladhina an\'amta \'alaihim, ghairil maghdubi \'alaihim waladh-dhallin.',
        meaning: 'Dengan nama Allah yang Maha Pengasih lagi Maha Penyayang... (Al-Fatihah)',
        note: 'Wajib dibaca di setiap rakaat. Imam membaca keras pada sholat Subuh.',
      },
      {
        title: '5. Baca Surah / Ayat',
        note: 'Baca surah pendek atau ayat Al-Quran setelah Al-Fatihah (rakaat 1 & 2 untuk Subuh). Contoh: Al-Ikhlas, Al-Kafirun, dsb.',
        arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴿١﴾ ٱللَّهُ ٱلصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ ﴿٤﴾',
        latin: 'Qul huwallahu ahad. Allahush shamad. Lam yalid wa lam yulad. Wa lam yakul lahu kufuwan ahad.',
        meaning: 'Katakanlah: Dialah Allah, Yang Maha Esa. Allah adalah Tuhan yang bergantung kepada-Nya segala sesuatu. Dia tiada beranak dan tidak pula diperanakkan, dan tidak ada seorang pun yang setara dengan Dia. (Al-Ikhlas)',
      },
      {
        title: '6. Ruku\'',
        arabic: 'سُبْحَانَ رَبِّيَ ٱلْعَظِيمِ',
        latin: 'Subhana rabbiyal \'azhim',
        meaning: 'Maha Suci Tuhanku Yang Maha Agung',
        note: 'Baca minimal 3x. Bungkukkan badan, tangan memegang lutut, punggung lurus.',
      },
      {
        title: '7. I\'tidal (Bangkit dari Ruku\')',
        arabic: 'سَمِعَ ٱللَّهُ لِمَنْ حَمِدَهُ \n رَبَّنَا وَلَكَ ٱلْحَمْد',
        latin: 'Sami\'allahu liman hamidah — Rabbana wa lakal hamd',
        meaning: 'Allah mendengar orang yang memuji-Nya — Ya Tuhan kami, bagi-Mu segala puji',
        note: 'Berdiri tegak sempurna setelah ruku\'.',
      },
      {
        title: '8. Sujud Pertama',
        arabic: 'سُبْحَانَ رَبِّيَ ٱلأَعْلَى',
        latin: 'Subhana rabbiyal a\'la',
        meaning: 'Maha Suci Tuhanku Yang Maha Tinggi',
        note: 'Baca minimal 3x. 7 anggota sujud: dahi, kedua telapak tangan, kedua lutut, kedua ujung kaki.',
      },
      {
        title: '9. Duduk Antara Dua Sujud',
        arabic: 'رَبِّ ٱغْفِرْ لِي وَٱرْحَمْنِي وَٱجْبُرْنِي وَٱرْفَعْنِي وَٱرْزُقْنِي وَٱهْدِنِي وَعَافِنِي وَٱعْفُ عَنِّي',
        latin: 'Rabbighfirli warhamni wajburni warfa\'ni warzuqni wahdinii wa \'afini wa\'fu \'anni',
        meaning: 'Ya Allah ampuni aku, sayangi aku, perbaiki aku, tinggikan derajatku, beri aku rezeki, petunjuk, kesehatan, dan maafkan aku',
      },
      {
        title: '10. Sujud Kedua',
        arabic: 'سُبْحَانَ رَبِّيَ ٱلأَعْلَى',
        latin: 'Subhana rabbiyal a\'la',
        meaning: 'Maha Suci Tuhanku Yang Maha Tinggi',
        note: 'Sama seperti sujud pertama. Setelah ini bangkit untuk rakaat kedua.',
      },
      {
        title: '11. Tasyahud Akhir (setelah rakaat ke-2)',
        arabic: 'التَّحِيَّاتُ لِلَّهِ وَٱلصَّلَوَاتُ وَٱلطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا ٱلنَّبِيُّ وَرَحْمَةُ ٱللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ ٱللَّهِ ٱلصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا ٱللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ',
        latin: 'At-tahiyyatu lillahi wash-shalawatu wath-thayyibat. As-salamu \'alaika ayyuhan nabiyyu wa rahmatullahi wa barakatuh. As-salamu \'alaina wa \'ala \'ibadillahish shalihin. Asyhadu alla ilaha illallah wa asyhadu anna Muhammadan \'abduhu wa rasuluh',
        meaning: 'Segala kehormatan bagi Allah, sholat, dan kebaikan. Semoga keselamatan terlimpah kepadamu wahai Nabi dan rahmat Allah serta berkah-Nya. Semoga keselamatan terlimpah atas kami dan atas hamba-hamba Allah yang sholeh. Aku bersaksi tidak ada tuhan selain Allah dan aku bersaksi bahwa Muhammad adalah hamba dan rasul-Nya.',
      },
      {
        title: '12. Sholawat Nabi',
        arabic: 'اَللَّهُمَّ صَلِّ عَلَى مُحَمَّد، وَعَلَى آلِ مُحَمَّد، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيم وَعَلَى آلِ إِبْرَاهِيم، إِنَّكَ حَمِيدٌ مَجِيد',
        latin: 'Allahumma shalli \'ala Muhammad wa \'ala ali Muhammad kamaa shallaita \'ala Ibrahim wa \'ala ali Ibrahim innaka hamidun majid',
        meaning: 'Ya Allah, berilah sholawat kepada Muhammad dan keluarganya, sebagaimana Engkau bersholawat kepada Ibrahim dan keluarganya. Sungguh Engkau Maha Terpuji dan Maha Mulia.',
      },
      {
        title: '13. Salam',
        arabic: 'ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّهِ',
        latin: 'Assalamu\'alaikum wa rahmatullah',
        meaning: 'Semoga keselamatan dan rahmat Allah terlimpah kepada kalian',
        note: 'Menoleh ke kanan dan ke kiri.',
      },
    ],
  },
  {
    name: 'Dzuhur', arabic: 'صَلَاةُ ٱلظُّهْر', rakaat: 4, color: '#d97706', time: 'Tengah hari',
    steps: [
      { title: '1. Niat Sholat Dzuhur', arabic: 'أُصَلِّي فَرْضَ ٱلظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardladh-dhuhri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2–10. Sama seperti Subuh (rakaat 1–2)', note: 'Takbir, doa iftitah, Al-Fatihah, surah, ruku\', i\'tidal, sujud 2x, duduk antara sujud.' },
      { title: '11. Tasyahud Awal (setelah rakaat ke-2)', arabic: 'التَّحِيَّاتُ لِلَّهِ... أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ', latin: '(Baca tasyahud tanpa sholawat Nabi, lalu bangkit ke rakaat 3)', note: 'Duduk di rakaat ke-2, baca tasyahud awal, lalu bangkit.' },
      { title: '12. Rakaat 3 & 4', note: 'Baca Al-Fatihah saja tanpa surah tambahan. Lakukan ruku\', i\'tidal, sujud seperti biasa.' },
      { title: '13. Tasyahud Akhir + Sholawat + Salam', note: 'Sama seperti Subuh rakaat terakhir.' },
    ],
  },
  {
    name: 'Ashar', arabic: 'صَلَاةُ ٱلْعَصْر', rakaat: 4, color: '#ea580c', time: 'Sore hari',
    steps: [
      { title: '1. Niat Sholat Ashar', arabic: 'أُصَلِّي فَرْضَ ٱلْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-\'ashri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2–13. Sama persis seperti Dzuhur', note: '4 rakaat, tasyahud awal di rakaat ke-2, tasyahud akhir di rakaat ke-4, salam.' },
    ],
  },
  {
    name: 'Maghrib', arabic: 'صَلَاةُ ٱلْمَغْرِب', rakaat: 3, color: '#9333ea', time: 'Setelah matahari terbenam',
    steps: [
      { title: '1. Niat Sholat Maghrib', arabic: 'أُصَلِّي فَرْضَ ٱلْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-maghribi tsalasa raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2. Rakaat 1 & 2', note: 'Sama seperti Subuh. Al-Fatihah + surah, ruku\', i\'tidal, sujud 2x.' },
      { title: '3. Tasyahud Awal (rakaat ke-2)', note: 'Duduk, baca tasyahud tanpa sholawat, bangkit ke rakaat 3.' },
      { title: '4. Rakaat 3', note: 'Baca Al-Fatihah saja. Ruku\', i\'tidal, sujud 2x.' },
      { title: '5. Tasyahud Akhir + Sholawat + Salam', note: 'Duduk tasyahud akhir, sholawat, salam.' },
    ],
  },
  {
    name: "Isya'", arabic: 'صَلَاةُ ٱلْعِشَاء', rakaat: 4, color: '#1d4ed8', time: 'Malam hari',
    steps: [
      { title: "1. Niat Sholat Isya'", arabic: 'أُصَلِّي فَرْضَ ٱلْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-\'isyaa-i arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: "Aku niat sholat fardhu Isya' empat rakaat menghadap kiblat karena Allah Ta'ala" },
      { title: '2–13. Sama persis seperti Dzuhur', note: '4 rakaat, tasyahud awal di rakaat ke-2, tasyahud akhir di rakaat ke-4, salam.' },
    ],
  },
];

export default function PanduanSholatPage() {
  const [selected, setSelected] = useState<PrayerGuide>(GUIDES[0]);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ibadah</p>
          <h1 className="text-2xl font-semibold text-slate-900">Panduan Sholat</h1>
          <p className="text-sm text-slate-500">Tata cara sholat fardhu 5 waktu</p>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-2xl space-y-5">
        {/* Prayer selector */}
        <div className="glass-panel rounded-[1.5rem] p-4">
          <div className="flex gap-2 flex-wrap">
            {GUIDES.map((g) => (
              <button
                key={g.name}
                onClick={() => { setSelected(g); setExpandedStep(0); }}
                className="rounded-full px-4 py-1.5 text-sm font-medium transition"
                style={
                  selected.name === g.name
                    ? { backgroundColor: g.color, color: '#fff' }
                    : { backgroundColor: g.color + '20', color: g.color }
                }
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Prayer header */}
        <div className="glass-panel rounded-[1.5rem] p-5 flex items-center gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-white text-lg font-bold"
            style={{ backgroundColor: selected.color }}
          >
            {selected.rakaat}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
            <p className="font-arabic text-lg" dir="rtl" style={{ color: selected.color }}>{selected.arabic}</p>
            <p className="text-xs text-slate-500">{selected.rakaat} rakaat · {selected.time}</p>
          </div>
        </div>

        {/* Steps accordion */}
        <div className="space-y-2">
          {selected.steps.map((step, i) => (
            <div
              key={i}
              className="glass-panel overflow-hidden rounded-[1.25rem] transition-all"
            >
              <button
                onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-900">{step.title}</span>
                <svg
                  className="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform"
                  style={{ transform: expandedStep === i ? 'rotate(180deg)' : 'none' }}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {expandedStep === i && (
                <div className="border-t border-slate-100/50 px-5 pb-5 pt-4 space-y-3">
                  {step.note && (
                    <p className="text-sm text-slate-600 leading-relaxed rounded-xl bg-slate-50/60 px-3 py-2">{step.note}</p>
                  )}
                  {step.arabic && (
                    <p className="font-arabic text-right text-2xl leading-[2]" dir="rtl" style={{ color: selected.color }}>
                      {step.arabic}
                    </p>
                  )}
                  {step.latin && (
                    <p className="text-sm italic text-slate-600">{step.latin}</p>
                  )}
                  {step.meaning && (
                    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: selected.color + '12' }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: selected.color }}>Artinya:</p>
                      <p className="text-sm text-slate-700 leading-relaxed">"{step.meaning}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="glass-subtle rounded-2xl px-4 py-3 text-xs text-slate-400">
          ℹ️ Bacaan berdasarkan mazhab Syafi'i. Urutan gerakan dan bacaan dapat berbeda antar mazhab.
        </div>
      </div>
    </div>
  );
}
