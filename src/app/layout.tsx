import type { Metadata, Viewport } from "next";
import { Manrope, Noto_Naskh_Arabic } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import AzanReminderController from "@/components/AzanReminderController";
import BottomNav from "@/components/BottomNav";
import RouteSchema from "@/components/RouteSchema";

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
  title: "Moosleem - Prayer Times, Quran & Halal Finder",
  description: "Moosleem adalah aplikasi komprehensif untuk Muslim yang bepergian: jadwal shalat akurat real-time, baca Al-Quran Arab dengan terjemahan, pengingat azan, dan rekomendasi restoran halal terdekat di lokasi Anda.",
  keywords: "jadwal shalat, quran arabic, azan reminder, halal restaurants, muslim travel, islamic app, prayer times",
  metadataBase: new URL("https://moosleem.com"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://moosleem.com",
    languages: {
      "id": "https://moosleem.com/id",
      "en": "https://moosleem.com/en",
      "ar": "https://moosleem.com/ar",
    },
  },
  openGraph: {
    title: "Moosleem - Prayer Times & Quran Companion",
    description: "Your comprehensive Islamic companion app for prayer times, Quran reading, azan reminders, and halal food discovery.",
    url: "https://moosleem.com",
    siteName: "Moosleem",
    images: [
      {
        url: "/logo-muslim-traveler.png",
        width: 1200,
        height: 630,
        alt: "Moosleem App",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Moosleem - Prayer Times, Quran & Halal Finder",
    description: "Your comprehensive Islamic companion app for traveling Muslims",
    images: ["/logo-muslim-traveler.png"],
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Moosleem",
    description: "Aplikasi komprehensif untuk Muslim yang bepergian dengan fitur jadwal shalat, baca Quran, pengingat azan, dan pencarian halal",
    url: "https://moosleem.com",
    image: "https://moosleem.com/logo-muslim-traveler.svg",
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
        <meta name="theme-color" content="#eef3fb" />
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Moosleem" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var ck="";document.cookie.split(";").forEach(function(c){var t=c.trim();if(t.startsWith("theme="))ck=t.slice(6);});var stored=ck||localStorage.getItem("theme");var systemDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var theme=stored||(systemDark?"dark":"light");var isDark=theme==="dark";document.documentElement.classList.toggle("dark",isDark);document.documentElement.style.colorScheme=theme;if(!ck)document.cookie="theme="+theme+";path=/;max-age=31536000;SameSite=Lax";var meta=document.querySelector("meta[name=\\"theme-color\\"]");if(meta)meta.setAttribute("content",isDark?"#07111d":"#eef3fb");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col pb-24">
        <div className="islamic-calligraphy" aria-hidden="true">السلام عليكم</div>
        <div className="app-shell min-h-full flex flex-col pb-24">
          <RouteSchema />
          <AzanReminderController />
          {children}
          <BottomNav />
          <Analytics />
        </div>
      </body>
    </html>
  );
}