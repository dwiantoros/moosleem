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

const MOSQUE_KEYWORD_PATTERN = /\bmosque\b|\bmasjid\b|\bmusholla\b|\bmusalla\b|\bsurau\b|مسجد/i;
const NON_MOSQUE_KEYWORD_PATTERN = /\bchurch\b|\bchapel\b|\bcathedral\b|\bparish\b|\btemple\b|\bsynagogue\b|\bshrine\b/i;

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

function isMosquePlace(place: NominatimPlace): boolean {
  const source = [
    place.name,
    place.display_name,
    place.extratags?.name,
    place.extratags?.religion,
    place.extratags?.denomination,
    place.extratags?.building,
  ]
    .filter(Boolean)
    .join(' ');

  if (NON_MOSQUE_KEYWORD_PATTERN.test(source)) {
    return false;
  }

  const religion = place.extratags?.religion?.toLowerCase();
  if (religion && religion !== 'muslim') {
    return false;
  }

  if (place.type === 'mosque') {
    return true;
  }

  return MOSQUE_KEYWORD_PATTERN.test(source);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = parseInt(searchParams.get('radius') || '5000');

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const effectiveRadius = Number.isFinite(radius)
      ? Math.max(1000, Math.min(radius, 12000))
      : 5000;

    const latDelta = effectiveRadius / 111320;
    const lonDelta = effectiveRadius / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.1));
    const viewbox = [lon - lonDelta, lat + latDelta, lon + lonDelta, lat - latDelta].join(',');

    const [mosqueResponse, masjidResponse, fallbackResponse] = await Promise.all([
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'mosque',
          limit: 50,
          bounded: 1,
          viewbox,
          addressdetails: 1,
          extratags: 1,
        },
        headers: {
          'User-Agent': 'muslim-traveler/1.0',
          'Accept-Language': 'id,en',
        },
        timeout: 20000,
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'masjid',
          limit: 50,
          bounded: 1,
          viewbox,
          addressdetails: 1,
          extratags: 1,
        },
        headers: {
          'User-Agent': 'muslim-traveler/1.0',
          'Accept-Language': 'id,en',
        },
        timeout: 20000,
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          amenity: 'place_of_worship',
          religion: 'muslim',
          limit: 50,
          bounded: 1,
          viewbox,
          addressdetails: 1,
          extratags: 1,
        },
        headers: {
          'User-Agent': 'muslim-traveler/1.0',
          'Accept-Language': 'id,en',
        },
        timeout: 20000,
      }),
    ]);

    const places: NominatimPlace[] = [
      ...(mosqueResponse.data ?? []),
      ...(masjidResponse.data ?? []),
      ...(fallbackResponse.data ?? []),
    ];

    const mapped = places
      .filter((place) => place.category === 'amenity' && Boolean(place.name) && isMosquePlace(place))
      .map((place) => {
        const placeLat = Number(place.lat);
        const placeLon = Number(place.lon);
        const distance = calculateDistance(lat, lon, placeLat, placeLon);

        const address = place.address
          ? [place.address.road, place.address.suburb, place.address.city ?? place.address.town ?? place.address.village]
              .filter(Boolean)
              .join(', ')
          : '';

        const isMusholla = /musholla|musalla|surau/i.test(place.name ?? '');

        return {
          id: String(place.place_id),
          name: place.name ?? 'Masjid',
          address: address || place.display_name || '',
          latitude: placeLat,
          longitude: placeLon,
          distance,
          phone: place.extratags?.phone ?? place.extratags?.['contact:phone'],
          website: place.extratags?.website ?? place.extratags?.['contact:website'],
          isMusholla,
        };
      })
      .sort((a, b) => a.distance - b.distance);

    // Deduplicate
    const deduped = mapped.filter((item, idx, arr) =>
      !arr.slice(0, idx).some((x) =>
        x.name.toLowerCase() === item.name.toLowerCase() &&
        calculateDistance(x.latitude, x.longitude, item.latitude, item.longitude) < 0.05
      )
    );

    return NextResponse.json({ data: deduped.slice(0, 30) }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('Mosque API error:', err);
    return NextResponse.json({ error: 'Failed to fetch mosques' }, { status: 500 });
  }
}
