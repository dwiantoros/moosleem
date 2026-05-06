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

const HALAL_KEYWORD_PATTERN = /\bhalal\b|\bmuslim\b|\bislamic\b|حلال|ハラール|할랄|清真/i;
const GLOBAL_HALAL_HINT_PATTERN = /\bmuslim friendly\b|\bmiddle eastern\b|\barabic\b|\barabian\b|\bturkish\b|\bpakistani\b|\bafghan\b|\bbangladeshi\b|\blebanese\b|\bmoroccan\b|\bkebab\b|\bshawarma\b|\bdoner\b|\bgyro\b/i;
const INDONESIAN_HALAL_LIKELY_PATTERN = /\bpadang\b|\brendang\b|\bsate\b|\bsatay\b|\bsoto\b|\bbakso\b|\bnasi uduk\b|\bayam bakar\b|\bgulai\b|\bkonro\b|\bpecel lele\b|\brumah makan\b|\bmasakan padang\b/i;
const NON_HALAL_PATTERN = /non-halal|not halal|pork|pork belly|roast pork|roasted pork|bacon|ham|lard|beer|wine|pub|bar|\bbabi\b|\bb2\b|babi guling|se'i babi|suckling pig|pig roast|siobak|bak kut teh|char siu|samcan|lap cheong|bak kwa/i;
const RESTAURANT_TYPE_ALLOWLIST = new Set(['restaurant', 'fast_food', 'cafe', 'food_court']);
const INDONESIAN_DEFAULT_ALLOWLIST = new Set(['restaurant', 'fast_food', 'food_court']);
const MUSLIM_MAJORITY_COUNTRY_PATTERN = /\bindonesia\b|\bmalaysia\b|\bbrunei\b|\bsaudi arabia\b|\bunited arab emirates\b|\buae\b|\bqatar\b|\bkuwait\b|\boman\b|\bbahrain\b|\bturkey\b|\bturkiye\b|\bpakistan\b|\bbangladesh\b|\bmorocco\b|\balgeria\b|\btunisia\b|\begypt\b|\bjordan\b|\biraq\b|\biran\b|\byemen\b|\bpalestine\b|\bsyria\b|\blebanon\b|\bsudan\b|\bsomalia\b|\bmauritania\b|\bsenegal\b|\bniger\b|\bmali\b|\bdjibouti\b|\bazerbaijan\b|\bkazakhstan\b|\buzbekistan\b|\bkyrgyzstan\b|\btajikistan\b/i;

function isInIndonesia(place: NominatimPlace): boolean {
  const country = place.address?.country ?? '';
  return /indonesia/i.test(country) || /indonesia/i.test(place.display_name ?? '');
}

function isInMuslimMajorityCountry(place: NominatimPlace): boolean {
  const country = (place.address?.country ?? '').toLowerCase().trim();
  if (!country) {
    return false;
  }

  return MUSLIM_MAJORITY_COUNTRY_PATTERN.test(country);
}

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
    place.address?.amenity,
    place.address?.shop,
    place.extratags?.cuisine,
    place.extratags?.description,
    place.extratags?.note,
    place.extratags?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (NON_HALAL_PATTERN.test(source)) {
    return false;
  }

  if (HALAL_KEYWORD_PATTERN.test(source)) {
    return true;
  }

  if (isInMuslimMajorityCountry(place) && place.type && RESTAURANT_TYPE_ALLOWLIST.has(place.type)) {
    return true;
  }

  if (!isInIndonesia(place)) {
    return GLOBAL_HALAL_HINT_PATTERN.test(source);
  }

  if (place.type && INDONESIAN_DEFAULT_ALLOWLIST.has(place.type)) {
    return true;
  }

  const indonesiaSource = [
    place.name,
    place.extratags?.name,
    place.extratags?.cuisine,
    place.extratags?.description,
    place.extratags?.note,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return INDONESIAN_HALAL_LIKELY_PATTERN.test(indonesiaSource);
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

    const [
      keywordResponse,
      localKeywordResponse,
      halalFoodResponse,
      muslimRestaurantResponse,
      restaurantResponse,
      fastFoodResponse,
      cafeResponse,
    ] = await Promise.all([
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'halal restaurant',
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
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'restoran halal',
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
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'halal food',
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
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          q: 'muslim restaurant',
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
      }),
      axios.get(NOMINATIM_API, {
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
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          amenity: 'fast_food',
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
      }),
      axios.get(NOMINATIM_API, {
        params: {
          format: 'jsonv2',
          amenity: 'cafe',
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
      }),
    ]);

    const places: NominatimPlace[] = [
      ...(keywordResponse.data ?? []),
      ...(localKeywordResponse.data ?? []),
      ...(halalFoodResponse.data ?? []),
      ...(muslimRestaurantResponse.data ?? []),
      ...(restaurantResponse.data ?? []),
      ...(fastFoodResponse.data ?? []),
      ...(cafeResponse.data ?? []),
    ];

    const mappedRestaurants = places
      .filter((place) => {
        if (place.category !== 'amenity') {
          return false;
        }

        if (!place.type || !RESTAURANT_TYPE_ALLOWLIST.has(place.type)) {
          return false;
        }

        return isHalalLikely(place);
      })
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
      .sort((a, b) => a.distance - b.distance);

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

    return NextResponse.json(
      {
        success: true,
        data: deduped.slice(0, 20),
        count: deduped.length,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=900',
        },
      }
    );
  } catch (error) {
    console.error('Restaurants API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
