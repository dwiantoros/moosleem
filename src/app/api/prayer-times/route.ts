import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ALADHAN_API = 'https://api.aladhan.com/v1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-GB').split('/').reverse().join('-');
    const method = searchParams.get('method') || '2';

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude' },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `${ALADHAN_API}/timings/${date}`,
      {
        params: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          method: parseInt(method),
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
