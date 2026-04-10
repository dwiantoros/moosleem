'use client';

import React from 'react';
import { LocationData } from '@/types';

interface HeaderProps {
  location: LocationData | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function Header({ location, loading, onRefresh }: HeaderProps) {
  return (
    <header className="bg-gradient-to-br from-white to-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📖</span>
              <h1 className="text-3xl font-bold text-gray-900">Muslim Traveler</h1>
            </div>
            <p className="text-gray-600">Quran reading & prayer times for travelers</p>
          </div>

          <div className="text-right">
            {location && (
              <div className="text-sm">
                <p className="text-gray-600">📍 Your Location</p>
                <p className="font-semibold text-gray-900">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </p>
                {location.timezone && (
                  <p className="text-gray-500 text-xs">{location.timezone}</p>
                )}
              </div>
            )}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
