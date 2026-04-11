import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import AzanReminderController from "@/components/AzanReminderController";
import BottomNav from "@/components/BottomNav";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Muslim Traveler - Prayer Times, Quran & Halal Finder",
  description: "Muslim Traveler adalah aplikasi komprehensif untuk Muslim yang bepergian: jadwal shalat akurat real-time, baca Al-Quran Arab dengan terjemahan, pengingat azan, dan rekomendasi restoran halal terdekat di lokasi Anda.",
  keywords: "jadwal shalatأق, quran arabic, azan reminder, halal restaurants, muslim travel, islamic app, prayer times",
  metadataBase: new URL("https://muslim-traveler.com"),
  alternates: {
    canonical: "https://muslim-traveler.com",
    languages: {
      "id": "https://muslim-traveler.com/id",
      "en": "https://muslim-traveler.com/en",
      "ar": "https://muslim-traveler.com/ar",
    },
  },
  openGraph: {
    title: "Muslim Traveler - Prayer Times & Quran Companion",
    description: "Your comprehensive Islamic companion app for prayer times, Quran reading, azan reminders, and halal food discovery.",
    url: "https://muslim-traveler.com",
    siteName: "Muslim Traveler",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Muslim Traveler App",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muslim Traveler - Prayer Times, Quran & Halal Finder",
    description: "Your comprehensive Islamic companion app for traveling Muslims",
    images: ["/twitter-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Muslim Traveler",
    description: "Aplikasi komprehensif untuk Muslim yang bepergian dengan fitur jadwal shalat, baca Quran, pengingat azan, dan pencarian halal",
    url: "https://muslim-traveler.com",
    applicationCategory: "Travel",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "2500",
    },
  };

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${manrope.variable} ${notoNaskhArabic.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Muslim Traveler" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('theme');var systemDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var theme=stored||(systemDark?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col pb-24">
        <div className="islamic-bg-layer" aria-hidden="true" />
        <div className="islamic-bg-arch" aria-hidden="true" />
        <div className="app-shell min-h-full flex flex-col pb-24">
          <AzanReminderController />
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
