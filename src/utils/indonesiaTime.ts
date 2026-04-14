const INDONESIA_TIMEZONE_NAMES = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'] as const;

export type IndonesiaTimeZone = (typeof INDONESIA_TIMEZONE_NAMES)[number];

export const DEFAULT_KEMENAG_TIMEZONE: IndonesiaTimeZone = 'Asia/Jakarta';
export const DEFAULT_GLOBAL_TIMEZONE = 'UTC';

const INDONESIA_BOUNDS = {
  minLatitude: -11.5,
  maxLatitude: 6.5,
  minLongitude: 94,
  maxLongitude: 142,
} as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function isIndonesiaTimeZone(value: string | null | undefined): value is IndonesiaTimeZone {
  return INDONESIA_TIMEZONE_NAMES.includes(value as IndonesiaTimeZone);
}

export function getKemenagTimezone(
  latitude?: number,
  longitude?: number,
  fallback?: string | null,
): string {
  const hasCoordinates =
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude);

  if (hasCoordinates && isWithinIndonesia(latitude, longitude)) {
    if (longitude >= 127) return 'Asia/Jayapura';
    if (longitude >= 112) return 'Asia/Makassar';
    return 'Asia/Jakarta';
  }

  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback;
  }

  return fallback?.trim() || DEFAULT_GLOBAL_TIMEZONE;
}

export function isWithinIndonesia(latitude: number, longitude: number): boolean {
  return (
    latitude >= INDONESIA_BOUNDS.minLatitude &&
    latitude <= INDONESIA_BOUNDS.maxLatitude &&
    longitude >= INDONESIA_BOUNDS.minLongitude &&
    longitude <= INDONESIA_BOUNDS.maxLongitude
  );
}

export function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

export function getDateStringInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function getDateAtMidnightInTimeZone(date: Date, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function getMinutesNowInTimeZone(timeZone: string, date = new Date()): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function getSecondsNowInTimeZone(timeZone: string, date = new Date()): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

export function formatTimeZoneLabel(timeZone: string): string {
  switch (timeZone) {
    case 'Asia/Jakarta':
      return 'WIB';
    case 'Asia/Makassar':
      return 'WITA';
    case 'Asia/Jayapura':
      return 'WIT';
    default:
      return getGenericTimeZoneLabel(timeZone);
  }
}

function getGenericTimeZoneLabel(timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });

    const timeZoneName = formatter
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value;

    if (timeZoneName) {
      return timeZoneName.replace(/^GMT$/, 'UTC');
    }
  } catch {
    // Fall back to a readable timezone slug below.
  }

  const slug = timeZone.split('/').pop()?.replace(/_/g, ' ');
  return slug || timeZone;
}

export function getDefaultPrayerMethod(
  latitude?: number,
  longitude?: number,
  timezone?: string | null,
): number {
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    isWithinIndonesia(latitude, longitude)
  ) {
    return 11;
  }

  if (typeof timezone === 'string' && timezone.startsWith('America/')) {
    return 2;
  }

  return 3;
}