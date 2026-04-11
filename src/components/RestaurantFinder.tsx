'use client';

import React, { useState, useEffect } from 'react';
import { HalalRestaurant, LocationData } from '@/types';
import axios from 'axios';

interface RestaurantsProps {
  location: LocationData | null;
}

export default function RestaurantFinder({ location }: RestaurantsProps) {
  const [restaurants, setRestaurants] = useState<HalalRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<HalalRestaurant | null>(null);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/restaurants', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 5000,
          },
          timeout: 15000,
        });
        setRestaurants(response.data.data || []);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [location]);

  if (loading) {
    return (
      <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
        <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100/80 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[1.75rem] p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-5">ðŸ½ï¸ Restoran Halal Terdekat</h2>

      {restaurants.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <div className="text-4xl mb-3">ðŸ”</div>
          <p className="text-sm">Tidak ada restoran halal ditemukan di sekitar Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((restaurant) => {
            const isSelected = selectedRestaurant?.id === restaurant.id;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&query_place_id=${encodeURIComponent(restaurant.address)}&ll=${restaurant.latitude},${restaurant.longitude}`;
            const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}&destination_place_id=${encodeURIComponent(restaurant.name)}`;

            return (
              <div
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(isSelected ? null : restaurant)}
                className={`rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-teal-200 bg-teal-50/60 dark:border-teal-700/60 dark:bg-teal-900/20'
                    : 'border-slate-200/60 bg-white/60 hover:bg-white/80 hover:border-slate-300/60 dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'
                } p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {restaurant.halalLikely && (
                        <span className="flex-shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">HALAL</span>
                      )}
                      <h3 className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">{restaurant.name}</h3>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{restaurant.address}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {restaurant.rating > 0 && (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-yellow-400 text-xs">â­</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{restaurant.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">{restaurant.distance.toFixed(1)} km</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-teal-200/60 dark:border-teal-700/40 space-y-3">
                    {restaurant.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {restaurant.phone && (
                        <a
                          href={`tel:${restaurant.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-95"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Call
                        </a>
                      )}
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                        Directions
                      </a>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200"
                        title="Lihat di Maps"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      </a>
                    </div>
                    {restaurant.website && (
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline dark:text-teal-400"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        {restaurant.website}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
