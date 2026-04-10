import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function isHalalLikely(place: NominatimPlace): boolean {
  const source = [
    place.name,
    place.display_name,
    place.extratags?.cuisine,
    place.extratags?.description,
    place.extratags?.note,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (source.includes('non-halal')) {
    return false;
  }

  return /\bhalal\b|muslim|islamic|shawarma|kebab|arabian|middle eastern/.test(source);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = parseInt(searchParams.get('radius') || '5000');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    const effectiveRadius = Number.isFinite(radius)
      ? Math.max(1000, Math.min(radius, 12000))
      : 5000;

    const latDelta = effectiveRadius / 111320;
    const lonDelta = effectiveRadius / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.1));
    const viewbox = [
      lon - lonDelta,
      lat + latDelta,
      lon + lonDelta,
      lat - latDelta,
    ].join(',');

    const response = await axios.get(NOMINATIM_API, {
      params: {
        format: 'jsonv2',
        amenity: 'restaurant',
        limit: 80,
        bounded: 1,
        viewbox,
        addressdetails: 1,
        extratags: 1,
      },
      headers: {
        'User-Agent': 'muslim-traveler/1.0 (local-development)',
        'Accept-Language': 'id,en',
      },
      timeout: 20000,
    });

    const places: NominatimPlace[] = response.data ?? [];

    const mappedRestaurants = places
      .filter((place) => place.category === 'amenity' && place.type === 'restaurant')
      .map((place) => {
        const placeLat = Number(place.lat);
        const placeLon = Number(place.lon);
        const distance = calculateDistance(lat, lon, placeLat, placeLon);

        const ratingRaw = Number(place.extratags?.stars ?? place.extratags?.rating ?? '');
        const rating = Number.isFinite(ratingRaw) ? ratingRaw : 0;

        const address = place.address
          ? [
              place.address.road,
              place.address.suburb,
              place.address.city ?? place.address.town ?? place.address.village,
            ]
              .filter(Boolean)
              .join(', ')
          : '';

        return {
          id: String(place.place_id),
          name: place.name ?? 'Restaurant',
          address: address || place.display_name || 'Address not available',
          latitude: placeLat,
          longitude: placeLon,
          distance,
          rating,
          phone: place.extratags?.phone ?? place.extratags?.['contact:phone'],
          website: place.extratags?.website ?? place.extratags?.['contact:website'],
          halalLikely: isHalalLikely(place),
        };
      })
      .sort((a, b) => {
        if (a.halalLikely !== b.halalLikely) {
          return a.halalLikely ? -1 : 1;
        }
        return a.distance - b.distance;
      });

    const deduped = mappedRestaurants.filter((restaurant, index, arr) => {
      return !arr.slice(0, index).some((existing) => {
        const sameName = existing.name.toLowerCase() === restaurant.name.toLowerCase();
        const nearSamePlace = calculateDistance(
          existing.latitude,
          existing.longitude,
          restaurant.latitude,
          restaurant.longitude
        ) < 0.05;
        return sameName && nearSamePlace;
      });
    });

    return NextResponse.json({
      success: true,
      data: deduped.slice(0, 20),
      count: deduped.length,
    });
  } catch (error) {
    console.error('Restaurants API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
