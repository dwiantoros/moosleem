import axios from 'axios';
import { LocationData, PrayerTimes } from '@/types';
import { formatDate } from 'date-fns';
import { getDateStringInTimeZone, getDefaultPrayerMethod, getKemenagTimezone, getMinutesNowInTimeZone, getSecondsNowInTimeZone } from '@/utils/indonesiaTime';

const ALADHAN_API = 'https://api.aladhan.com/v1';
const OPENCAGE_API_KEY = 'YOUR_OPENCAGE_API_KEY'; // Replace with actual API key

/**
 * Get user's location using geolocation API
 */
export const getUserLocation = async (): Promise<LocationData | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Get timezone info from location
          const timezoneResponse = await axios.get(
            `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_TIMEZONE_API_KEY&format=json&by=position&lat=${latitude}&lng=${longitude}`
          );
          
          const timezone = timezoneResponse.data?.zoneName;

          resolve({
            latitude,
            longitude,
            timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } catch (error) {
          console.error('Error getting timezone:', error);
          resolve({
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        }
      },
      () => {
        console.error('Error getting user location');
        resolve(null);
      }
    );
  });
};

/**
 * Get prayer times from Aladhan API
 */
export const getPrayerTimes = async (
  latitude: number,
  longitude: number,
  date?: Date,
  method?: number,
  timezone?: string,
): Promise<PrayerTimes | null> => {
  try {
    const effectiveTimezone = getKemenagTimezone(latitude, longitude, timezone);
    const effectiveMethod = method ?? getDefaultPrayerMethod(latitude, longitude, effectiveTimezone);
    const dateStr = date
      ? formatDate(date, 'dd-MM-yyyy')
      : getDateStringInTimeZone(new Date(), effectiveTimezone).split('-').reverse().join('-');
    
    const response = await axios.get(
      `${ALADHAN_API}/timings/${dateStr}`,
      {
        params: {
          latitude,
          longitude,
          method: effectiveMethod,
        },
      }
    );

    if (response.data?.data?.timings) {
      return response.data.data.timings;
    }
    return null;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    return null;
  }
};

/**
 * Get next prayer time
 */
export const getNextPrayer = (
  prayerTimes: PrayerTimes,
  timezone: string
): { name: string; time: string; minutesUntil: number } | null => {
  const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;

    return {
      hours: Number(match[1]),
      minutes: Number(match[2]),
    };
  };
  const nowMinutes = getMinutesNowInTimeZone(timezone);
  
  for (const prayer of prayerOrder) {
    const timeStr = prayerTimes[prayer as keyof PrayerTimes];
    if (!timeStr) continue;

    const parsed = parseTime(timeStr);
    if (!parsed) continue;

    const prayerMinutes = parsed.hours * 60 + parsed.minutes;
    if (prayerMinutes > nowMinutes) {
      const diffMinutes = prayerMinutes - nowMinutes;
      return {
        name: prayer,
        time: timeStr,
        minutesUntil: diffMinutes,
      };
    }
  }

  // If all prayers for today have passed, point to tomorrow's Fajr.
  const fajrTime = prayerTimes.Fajr;
  if (fajrTime) {
    const parsedFajr = parseTime(fajrTime);
    if (parsedFajr) {
      const fajrMinutes = parsedFajr.hours * 60 + parsedFajr.minutes;
      const diffMinutes = 24 * 60 - nowMinutes + fajrMinutes;
      return {
        name: 'Fajr',
        time: fajrTime,
        minutesUntil: diffMinutes,
      };
    }
  }
  
  return null;
};

/**
 * Search halal restaurants nearby (using mock data for now)
 * In production, integrate with Google Places API, Yelp, or local halal restaurant APIs
 */
export const getNearbyHalalRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 5000
) => {
  try {
    // Mock restaurants - replace with actual API call
    const restaurants = [
      {
        id: '1',
        name: 'Al-Noor Restaurant',
        address: '123 Main St',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        distance: 2.3,
        rating: 4.5,
        phone: '+1-555-0101',
      },
      {
        id: '2',
        name: 'Zaika Halal',
        address: '456 Oak Ave',
        latitude: latitude - 0.01,
        longitude: longitude - 0.01,
        distance: 3.8,
        rating: 4.7,
        phone: '+1-555-0102',
      },
      {
        id: '3',
        name: 'Dine Islamic',
        address: '789 Elm Rd',
        latitude: latitude + 0.02,
        longitude: longitude - 0.02,
        distance: 4.1,
        rating: 4.3,
        phone: '+1-555-0103',
      },
    ];

    return restaurants.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
};

/**
 * Format prayer times display
 */
export const formatPrayerTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
  const displayHours = parseInt(hours) % 12 || 12;
  return `${String(displayHours).padStart(2, '0')}:${minutes} ${period}`;
};

export function getRemainingSecondsToPrayer(
  nextPrayer: { name: string; time: string } | null,
  prayerTimes: PrayerTimes | null,
  timezone: string,
): number | null {
  if (!nextPrayer || !prayerTimes) return null;

  const match = nextPrayer.time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const nextPrayerSeconds = Number(match[1]) * 3600 + Number(match[2]) * 60;
  const nowSeconds = getSecondsNowInTimeZone(timezone);
  const ishaMatch = prayerTimes.Isha?.match(/^(\d{1,2}):(\d{2})/);
  const ishaSeconds = ishaMatch ? Number(ishaMatch[1]) * 3600 + Number(ishaMatch[2]) * 60 : null;

  if (nextPrayer.name === 'Fajr' && ishaSeconds !== null && nowSeconds >= ishaSeconds) {
    return 24 * 3600 - nowSeconds + nextPrayerSeconds;
  }

  if (nextPrayerSeconds <= nowSeconds) {
    return 24 * 3600 - nowSeconds + nextPrayerSeconds;
  }

  return nextPrayerSeconds - nowSeconds;
}

export function getPrayerWindowProgress(
  prayerTimes: PrayerTimes | null,
  nextPrayer: { name: string; time: string } | null,
  timezone: string,
  remainingSeconds?: number | null,
): number | null {
  if (!prayerTimes || !nextPrayer) return null;

  const parseToMinute = (value: string): number | null => {
    const match = value.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const schedule = [
    { key: 'Fajr', value: prayerTimes.Fajr },
    { key: 'Dhuhr', value: prayerTimes.Dhuhr },
    { key: 'Asr', value: prayerTimes.Asr },
    { key: 'Maghrib', value: prayerTimes.Maghrib },
    { key: 'Isha', value: prayerTimes.Isha },
  ];

  const nextIndex = schedule.findIndex((item) => item.key === nextPrayer.name);
  if (nextIndex < 0) return null;

  const prevIndex = nextIndex === 0 ? schedule.length - 1 : nextIndex - 1;
  const nextMinuteRaw = parseToMinute(schedule[nextIndex].value);
  const prevMinuteRaw = parseToMinute(schedule[prevIndex].value);
  const nowMinute = getMinutesNowInTimeZone(timezone) + getZonedSecondFraction(timezone);

  if (nextMinuteRaw === null || prevMinuteRaw === null) return null;

  const nextMinute = nextIndex === 0 ? nextMinuteRaw + 24 * 60 : nextMinuteRaw;
  const prevMinute = prevIndex === schedule.length - 1 ? prevMinuteRaw - 24 * 60 : prevMinuteRaw;
  const totalWindow = nextMinute - prevMinute;

  if (totalWindow <= 0) return null;

  if (remainingSeconds !== null && remainingSeconds !== undefined) {
    const elapsedFromCountdown = totalWindow - remainingSeconds / 60;
    return Math.min(100, Math.max(2, (elapsedFromCountdown / totalWindow) * 100));
  }

  const currentMinute = nextIndex === 0 && nowMinute < nextMinuteRaw ? nowMinute + 24 * 60 : nowMinute;
  const elapsed = currentMinute - prevMinute;
  return Math.min(100, Math.max(2, (elapsed / totalWindow) * 100));
}

function getZonedSecondFraction(timezone: string): number {
  return (getSecondsNowInTimeZone(timezone) % 60) / 60;
}

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculate qibla direction bearing in degrees from current position.
 * 0 = North, 90 = East.
 */
export const calculateQiblaBearing = (latitude: number, longitude: number): number => {
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;

  const userLatRad = (latitude * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const deltaLonRad = ((kaabaLon - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLonRad);
  const x =
    Math.cos(userLatRad) * Math.tan(kaabaLatRad) -
    Math.sin(userLatRad) * Math.cos(deltaLonRad);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};
