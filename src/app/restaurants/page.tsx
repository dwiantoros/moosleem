'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFinder from '@/components/RestaurantFinder';
import { LocationData } from '@/types';
import PageHeaderActions from '@/components/PageHeaderActions';

export default function RestaurantsPage() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLocation = async () => {
      setLoading(true);
      if (!('geolocation' in navigator)) {
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setLocation({ latitude, longitude, timezone });
          setLoading(false);
        },
        () => {
          // Fallback to NYC
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setLocation({
            latitude: 40.7128,
            longitude: -74.006,
            timezone,
          });
          setLoading(false);
        }
      );
    };

    getLocation();
  }, []);

  return (
    <div className="min-h-screen pb-8">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
          >
            <span>←</span>
          </button>
          <div>
            <p className="text-sm text-slate-600">Muslim Traveler</p>
            <h1 className="text-2xl font-semibold text-slate-900">Halal Nearby</h1>
          </div>
          </div>
          <PageHeaderActions />
        </div>

        {/* Restaurant Finder */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        ) : location ? (
          <RestaurantFinder location={location} />
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-slate-600">Tidak dapat mengakses lokasi Anda</p>
          </div>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>Temukan restoran dan rumah makan halal terdekat di sekitar Anda</p>
        </footer>
      </main>
    </div>
  );
}
