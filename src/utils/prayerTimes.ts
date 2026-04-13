import axios from 'axios';
import { LocationData, PrayerTimes } from '@/types';
import { formatDate } from 'date-fns';

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
  method: number = 2 // 2 = ISNA method
): Promise<PrayerTimes | null> => {
  try {
    const queryDate = date || new Date();
    const dateStr = formatDate(queryDate, 'dd-MM-yyyy');
    
    const response = await axios.get(
      `${ALADHAN_API}/timings/${dateStr}`,
      {
        params: {
          latitude,
          longitude,
          method,
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
  const now = new Date();
  const prayerOrder = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;

    return {
      hours: Number(match[1]),
      minutes: Number(match[2]),
    };
  };
  
  for (const prayer of prayerOrder) {
    const timeStr = prayerTimes[prayer as keyof PrayerTimes];
    if (!timeStr) continue;

    const parsed = parseTime(timeStr);
    if (!parsed) continue;

    const prayerTime = new Date();
    prayerTime.setHours(parsed.hours, parsed.minutes, 0, 0);
    
    if (prayerTime > now) {
      const diffMinutes = Math.floor((prayerTime.getTime() - now.getTime()) / 60000);
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
      const tomorrowFajr = new Date();
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      tomorrowFajr.setHours(parsedFajr.hours, parsedFajr.minutes, 0, 0);

      const diffMinutes = Math.floor((tomorrowFajr.getTime() - now.getTime()) / 60000);
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
