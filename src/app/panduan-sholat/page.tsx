'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';

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
  rakaat: string;
  rakaatDetail?: string;
  color: string;
  time: string;
  steps: Step[];
}

const GUIDES: PrayerGuide[] = [
  {
    name: 'Subuh', arabic: 'صَلَاةُ الْفَجْر', rakaat: '2', color: '#0891b2', time: 'Sebelum matahari terbit',
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
    name: 'Dzuhur', arabic: 'صَلَاةُ ٱلظُّهْر', rakaat: '4', color: '#d97706', time: 'Tengah hari',
    steps: [
      { title: '1. Niat Sholat Dzuhur', arabic: 'أُصَلِّي فَرْضَ ٱلظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardladh-dhuhri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Dzuhur empat rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2–10. Sama seperti Subuh (rakaat 1–2)', note: 'Takbir, doa iftitah, Al-Fatihah, surah, ruku\', i\'tidal, sujud 2x, duduk antara sujud.' },
      { title: '11. Tasyahud Awal (setelah rakaat ke-2)', arabic: 'التَّحِيَّاتُ لِلَّهِ... أَشْهَدُ أَنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ', latin: '(Baca tasyahud tanpa sholawat Nabi, lalu bangkit ke rakaat 3)', note: 'Duduk di rakaat ke-2, baca tasyahud awal, lalu bangkit.' },
      { title: '12. Rakaat 3 & 4', note: 'Baca Al-Fatihah saja tanpa surah tambahan. Lakukan ruku\', i\'tidal, sujud seperti biasa.' },
      { title: '13. Tasyahud Akhir + Sholawat + Salam', note: 'Sama seperti Subuh rakaat terakhir.' },
    ],
  },
  {
    name: 'Ashar', arabic: 'صَلَاةُ ٱلْعَصْر', rakaat: '4', color: '#ea580c', time: 'Sore hari',
    steps: [
      { title: '1. Niat Sholat Ashar', arabic: 'أُصَلِّي فَرْضَ ٱلْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-\'ashri arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Ashar empat rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2–13. Sama persis seperti Dzuhur', note: '4 rakaat, tasyahud awal di rakaat ke-2, tasyahud akhir di rakaat ke-4, salam.' },
    ],
  },
  {
    name: 'Maghrib', arabic: 'صَلَاةُ ٱلْمَغْرِب', rakaat: '3', color: '#9333ea', time: 'Setelah matahari terbenam',
    steps: [
      { title: '1. Niat Sholat Maghrib', arabic: 'أُصَلِّي فَرْضَ ٱلْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-maghribi tsalasa raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: 'Aku niat sholat fardhu Maghrib tiga rakaat menghadap kiblat karena Allah Ta\'ala' },
      { title: '2. Rakaat 1 & 2', note: 'Sama seperti Subuh. Al-Fatihah + surah, ruku\', i\'tidal, sujud 2x.' },
      { title: '3. Tasyahud Awal (rakaat ke-2)', note: 'Duduk, baca tasyahud tanpa sholawat, bangkit ke rakaat 3.' },
      { title: '4. Rakaat 3', note: 'Baca Al-Fatihah saja. Ruku\', i\'tidal, sujud 2x.' },
      { title: '5. Tasyahud Akhir + Sholawat + Salam', note: 'Duduk tasyahud akhir, sholawat, salam.' },
    ],
  },
  {
    name: "Isya'", arabic: 'صَلَاةُ ٱلْعِشَاء', rakaat: '4', color: '#1d4ed8', time: 'Malam hari',
    steps: [
      { title: "1. Niat Sholat Isya'", arabic: 'أُصَلِّي فَرْضَ ٱلْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ ٱلْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى', latin: 'Ushalli fardlal-\'isyaa-i arba\'a raka\'atin mustaqbilal qiblati adaa-an lillahi ta\'ala', meaning: "Aku niat sholat fardhu Isya' empat rakaat menghadap kiblat karena Allah Ta'ala" },
      { title: '2–13. Sama persis seperti Dzuhur', note: '4 rakaat, tasyahud awal di rakaat ke-2, tasyahud akhir di rakaat ke-4, salam.' },
    ],
  },
  {
    name: 'Jamak Taqdim',
    arabic: 'الجَمْعُ التَّقْدِيمُ',
    rakaat: '4+4',
    rakaatDetail: '4+4 rakaat atau 3+4 rakaat',
    color: '#16a34a',
    time: 'Dikerjakan di waktu sholat pertama',
    steps: [
      {
        title: 'Apa itu Jamak Taqdim?',
        note: 'Jamak taqdim adalah menggabungkan dua sholat fardhu dan dikerjakan di waktu sholat yang pertama. Contohnya Dzuhur digabung dengan Ashar lalu dikerjakan saat waktu Dzuhur, atau Maghrib digabung dengan Isya lalu dikerjakan saat waktu Maghrib.',
      },
      {
        title: 'Pasangan sholat yang bisa dijamak',
        note: 'Pasangan yang dibolehkan dijamak adalah:\n• Dzuhur dengan Ashar\n• Maghrib dengan Isya\n\nSholat Subuh tidak bisa dijamak dengan sholat lain.',
      },
      {
        title: 'Syarat jamak taqdim',
        note: 'Jamak taqdim dilakukan ketika ada uzur syar\'i seperti safar, sakit, hujan deras, atau kondisi sulit lainnya. Niat jamak dilakukan sejak sholat pertama dan kedua sholat dikerjakan berurutan tanpa jeda panjang.',
      },
      {
        title: 'Cara melakukan jamak taqdim',
        note: 'Contoh Dzuhur dan Ashar di waktu Dzuhur:\n1. Kerjakan sholat Dzuhur lebih dahulu\n2. Setelah salam, langsung berdiri untuk sholat Ashar\n3. Jaga urutan sholat, jangan dibalik\n4. Jangan beri jeda panjang di antara dua sholat\n\nJika yang dijamak adalah Maghrib dan Isya, maka Maghrib dikerjakan dulu lalu Isya.',
      },
      {
        title: 'Contoh niat dan urutan',
        note: 'Urutan dalam jamak taqdim harus tertib:\n• Dzuhur kemudian Ashar\n• Maghrib kemudian Isya\n\nTidak boleh mengerjakan Ashar sebelum Dzuhur atau Isya sebelum Maghrib dalam jamak taqdim.',
      },
      {
        title: 'Catatan penting',
        note: 'Jamak taqdim bukan untuk mempermudah tanpa alasan. Jika uzur telah hilang sebelum memulai, maka sholat dikerjakan seperti biasa pada waktunya masing-masing.',
      },
      {
        title: 'Hukum jamak taqdim',
        note: 'Jamak taqdim dibolehkan menurut mayoritas ulama bila ada uzur yang sah. Tujuannya memberi kemudahan, bukan menggugurkan kewajiban sholat.',
      },
    ],
  },
  {
    name: 'Jamak Takhir',
    arabic: 'الجَمْعُ التَّأْخِيرُ',
    rakaat: '4+4',
    rakaatDetail: '4+4 rakaat atau 3+4 rakaat',
    color: '#0f766e',
    time: 'Dikerjakan di waktu sholat kedua',
    steps: [
      {
        title: 'Apa itu Jamak Takhir?',
        note: 'Jamak takhir adalah menggabungkan dua sholat fardhu dan dikerjakan di waktu sholat yang kedua. Contohnya Dzuhur diundur lalu digabung dengan Ashar saat waktu Ashar, atau Maghrib diundur lalu digabung dengan Isya saat waktu Isya.',
      },
      {
        title: 'Pasangan sholat yang bisa dijamak',
        note: 'Pasangan yang dibolehkan dijamak takhir adalah:\n• Dzuhur dengan Ashar\n• Maghrib dengan Isya\n\nSholat Subuh tidak termasuk jamak.',
      },
      {
        title: 'Syarat jamak takhir',
        note: 'Harus ada uzur syar\'i yang masih berlangsung sampai masuk waktu sholat kedua. Niat untuk menunda sholat pertama ke waktu kedua dilakukan saat waktu sholat pertama masih ada.',
      },
      {
        title: 'Cara melakukan jamak takhir',
        note: 'Contoh Dzuhur dan Ashar di waktu Ashar:\n1. Ketika masuk waktu Ashar, kerjakan Dzuhur terlebih dahulu\n2. Setelah selesai, langsung kerjakan Ashar\n3. Jaga tertib dan jangan memberi jeda panjang\n\nBegitu pula Maghrib dikerjakan dulu lalu Isya saat waktu Isya.',
      },
      {
        title: 'Urutan dalam jamak takhir',
        note: 'Yang lebih aman tetap menjaga urutan sholat:\n• Dzuhur lalu Ashar\n• Maghrib lalu Isya\n\nDengan begitu pelaksanaan jamak lebih tertib dan mudah dipahami.',
      },
      {
        title: 'Catatan penting',
        note: 'Jika uzur selesai sebelum habis waktu sholat pertama dan masih memungkinkan sholat normal, maka tidak perlu menunda ke jamak takhir. Jamak takhir dipakai ketika memang ada kebutuhan yang sah.',
      },
      {
        title: 'Hukum jamak takhir',
        note: 'Jamak takhir dibolehkan ketika ada uzur yang sah. Sholat tetap wajib dua kali, hanya waktunya yang digabung dalam waktu sholat kedua.',
      },
    ],
  },
  {
    name: 'Qashar',
    arabic: 'القَصْرُ',
    rakaat: '2',
    rakaatDetail: '2 rakaat untuk Dzuhur, Ashar, dan Isya',
    color: '#7c3aed',
    time: 'Saat safar memenuhi syarat',
    steps: [
      {
        title: 'Apa itu Qashar?',
        note: 'Qashar adalah meringkas sholat fardhu yang asalnya 4 rakaat menjadi 2 rakaat ketika sedang safar atau bepergian jauh dengan syarat yang dibenarkan syariat.',
      },
      {
        title: 'Sholat yang bisa diqashar',
        note: 'Yang bisa diqashar hanya sholat 4 rakaat, yaitu:\n• Dzuhur menjadi 2 rakaat\n• Ashar menjadi 2 rakaat\n• Isya menjadi 2 rakaat\n\nSubuh tetap 2 rakaat dan Maghrib tetap 3 rakaat, jadi tidak diqashar.',
      },
      {
        title: 'Syarat qashar',
        note: 'Qashar dilakukan saat safar yang memenuhi syarat menurut ulama, misalnya perjalanan yang cukup jauh dan bukan untuk maksiat. Musafir juga belum berniat menetap lama di tempat tujuan.',
      },
      {
        title: 'Cara melakukan qashar',
        note: 'Kerjakan sholat seperti biasa, tetapi cukup 2 rakaat untuk Dzuhur, Ashar, atau Isya. Setelah rakaat kedua, langsung tasyahud akhir lalu salam.',
      },
      {
        title: 'Niat qashar',
        note: 'Niat qashar dilakukan dalam hati sejak awal sholat. Yang penting sadar bahwa sholat yang dikerjakan adalah sholat qashar sebagai musafir.',
      },
      {
        title: 'Qashar bisa digabung dengan jamak',
        note: 'Dalam safar, qashar bisa dilakukan sendiri atau bersamaan dengan jamak. Contohnya Dzuhur dan Ashar dijamak taqdim sekaligus diqashar, sehingga masing-masing dikerjakan 2 rakaat.',
      },
      {
        title: 'Hukum qashar',
        note: 'Qashar adalah rukhsah atau keringanan dari Allah bagi musafir. Ini bukan mengurangi nilai ibadah, tetapi bentuk kemudahan yang dibenarkan syariat.',
      },
    ],
  },
  {
    name: 'Qadha (Sholat Tertinggal)',
    arabic: 'اَلْقَضَاءُ',
    rakaat: 'S',
    rakaatDetail: 'Sesuai rakaat sholat asal',
    color: '#be123c',
    time: 'Kapan saja setelah waktu sholat',
    steps: [
      {
        title: 'Apa itu Qadha?',
        note: 'Qadha adalah mengulang sholat fardhu yang tertinggal (terlewatkan) karena alasan tertentu, seperti tidur, lupa, atau kondisi yang tidak memungkinkan. Sholat qadha harus dikerjakan dengan segera setelah sadar atau setelah kondisi membaik.',
      },
      {
        title: 'Penyebab Sholat Tertinggal',
        note: 'Sholat dapat tertinggal karena:\n• Tidur tanpa alarm\n• Lupa sama sekali\n• Sakit berkepanjangan\n• Koma atau pingsan\n• Kondisi darurat yang tidak memungkinkan\n• Terpaksa perjalanan panjang tanpa istirahat\n\nRasa malas TIDAK termasuk alasan yang diterima.',
      },
      {
        title: 'Niat Qadha',
        arabic: 'أُصَلِّي قَضَاءَ فَرْضَ الظُّهْرِ (أو غيره) أَدَاءً لِلَّهِ تَعَالَى',
        latin: 'Ushalli qadhaa fardhlad-dhuhri (atau sholat lainnya) adaa-an lillahi ta\'ala',
        meaning: 'Aku niat mengerjakan qadha sholat Dzuhur (atau sholat yang tertinggal) karena Allah Ta\'ala',
        note: 'Niat qadha cukup dalam hati saja, tidak perlu diucapkan.',
      },
      {
        title: 'Cara Melakukan Qadha',
        note: '1. Berwudu dan suci dari hadats\n2. Membaca niat qadha dalam hati\n3. Memilih tempat yang suci dari najis\n4. Melakukan sholat dengan gerakan dan bacaan penuh (sama seperti sholat waktunya)\n5. Jika banyak sholat tertinggal, prioritaskan dari yang paling lama\n6. Bisa dikerjakan kapan saja, tetapi segera setelah sadar adalah lebih baik',
      },
      {
        title: 'Waktu Terbaik Qadha',
        note: 'Idealnya qadha dikerjakan:\n• SEGERA setelah sadar atau kondisi memungkinkan\n• JANGAN menunda hingga berhari-hari atau berminggu-minggu\n• Boleh dikerjakan di luar waktu sholat wajib (tidak ada larangan waktu)\n• Hindari waktu terlarang (saat terbit dan terbenam matahari, saat matahari tepat di atas kepala)',
      },
      {
        title: 'Batasan Waktu Qadha yang Diizinkan',
        note: 'Menurut ulama:\n• Qadha untuk beberapa hari atau minggu MASIH diakui sah\n• Jika tertinggal bertahun-tahun, masih harus dikerjakan jika masih ingat\n• Jika sudah LUPA berapa banyak yang tertinggal, estimasikan dan kerjakan qadha dengan niat ikhlas\n• Ada pendapat bahwa jika sudah tua/sakit dan tidak mampu, boleh meminta orang lain mengerjakan sedekah untuk dirinya',
      },
      {
        title: 'Cara Menghitung Banyaknya Sholat Qadha',
        note: 'Jika tertinggal berminggu-minggu:\n• Hitung dari hari pertama tertinggal\n• Kalikan jumlah hari dengan 5 sholat per hari\n• Misalnya: 10 hari tertinggal = 10 × 5 = 50 sholat\n• Kerjakan qadha secara bertahap, tidak harus sekaligus dalam satu hari',
      },
      {
        title: 'Doa saat Mengerjakan Qadha',
        note: 'Bacaan gerakan dan bacaan sholat qadha SAMA PERSIS dengan sholat wajib. Tidak ada bacaan khusus atau berbeda. Apa yang membedakan hanya NIAT, yaitu niat untuk mengqadhakan sholat yang tertinggal.',
      },
      {
        title: 'Qadha Berjamaah',
        note: 'Boleh melakukan qadha sendiri atau berjamaah dengan jamaah lain yang juga melakukan qadha. Jika mengikuti imam yang sedang melakukan sholat wajib waktu, qadha Anda tidak sah dan harus diulang kembali.',
      },
      {
        title: 'Hukum Mengabaikan Qadha',
        note: 'Mengabaikan sholat qadha adalah dosa besar, terutama jika:\n• Mampu tetapi sengaja menunda\n• Terus menambah hutang sholat\n• Wafat tanpa mengerjakan qadha\n\nOleh sebab itu, sangat dianjurkan untuk segera mengqadhakan sholat yang tertinggal sebelum terlambat.',
      },
    ],
  },
];

export default function PanduanSholatPage() {
  const [selected, setSelected] = useState<PrayerGuide>(GUIDES[0]);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-xl font-semibold text-slate-900">Panduan Sholat</h1>
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
            <p className="text-xs text-slate-500">{selected.rakaatDetail ?? `${selected.rakaat} rakaat`} · {selected.time}</p>
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
