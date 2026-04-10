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
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">🍽️ Halal Restaurants Nearby</h2>

      {restaurants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No halal restaurants found in your area.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => setSelectedRestaurant(restaurant)}
              className={`p-4 rounded-2xl cursor-pointer transition-all ${
                selectedRestaurant?.id === restaurant.id
                  ? 'bg-gradient-to-r from-indigo-100 to-blue-100 border-2 border-indigo-300'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{restaurant.name}</h3>
                  <p className="text-gray-600 text-sm">{restaurant.address}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold text-gray-900">
                      {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{restaurant.distance.toFixed(1)} km</p>
                </div>
              </div>

              {selectedRestaurant?.id === restaurant.id && (
                <div className="mt-4 pt-4 border-t border-indigo-200 space-y-2">
                  {restaurant.phone && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Phone:</span>{' '}
                      <a
                        href={`tel:${restaurant.phone}`}
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        {restaurant.phone}
                      </a>
                    </p>
                  )}
                  {restaurant.website && (
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Website:</span>{' '}
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700"
                      >
                        Visit
                      </a>
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Call
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-sm font-medium transition-colors">
                      Directions
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
