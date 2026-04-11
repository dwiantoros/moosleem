import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const NOMINATIM_REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';

function pickDistrict(address?: Record<string, string>): string | null {
  if (!address) return null;

  const candidates = [
    address.suburb,
    address.city_district,
    address.district,
    address.neighbourhood,
    address.quarter,
    address.village,
    address.town,
    address.city,
    address.county,
  ].filter(Boolean) as string[];

  return candidates[0] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const response = await axios.get(NOMINATIM_REVERSE_API, {
      params: {
        format: 'jsonv2',
        lat,
        lon,
        zoom: 16,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'muslim-traveler/1.0',
        'Accept-Language': 'id,en',
      },
      timeout: 15000,
    });

    const address = response.data?.address as Record<string, string> | undefined;
    const district = pickDistrict(address);

    return NextResponse.json(
      {
        district,
        country: address?.country ?? null,
        countryCode: address?.country_code?.toUpperCase?.() ?? null,
        displayName: response.data?.display_name ?? null,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=21600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Location context API error:', error);
    return NextResponse.json({ error: 'Failed to resolve district' }, { status: 500 });
  }
}
