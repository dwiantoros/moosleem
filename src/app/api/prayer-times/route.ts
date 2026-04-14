import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDateStringInTimeZone, getDefaultPrayerMethod, getKemenagTimezone } from '@/utils/indonesiaTime';

const ALADHAN_API = 'https://api.aladhan.com/v1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const requestedDate = searchParams.get('date');
    const timezone = searchParams.get('timezone');
    const method = searchParams.get('method');

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const defaultMethod = getDefaultPrayerMethod(lat, lon, timezone);
    const meth = parseInt(method || String(defaultMethod), 10);

    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const effectiveTimezone = getKemenagTimezone(lat, lon, timezone);
    const date = requestedDate || getDateStringInTimeZone(new Date(), effectiveTimezone);

    const response = await axios.get(
      `${ALADHAN_API}/timings/${date}`,
      {
        params: {
          latitude: lat,
          longitude: lon,
          method: Number.isFinite(meth) ? meth : defaultMethod,
        },
        timeout: 8000,
      }
    );

    const res = NextResponse.json(response.data.data.timings);
    // Cache for the rest of the day (~6 h), revalidate every hour
    res.headers.set('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
    return res;
  } catch (error) {
    console.error('Prayer times API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer times' },
      { status: 500 }
    );
  }
}
