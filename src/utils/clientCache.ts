export interface CachedEntry<T> {
  data: T;
  ts: number;
}

export interface CachedLocation {
  latitude: number;
  longitude: number;
  timezone: string;
  ts: number;
  accuracy?: number;
}

const LAST_LOCATION_KEY = 'mt:last-location';

function getTodayKey(): string {
  return new Date().toDateString();
}

function safeGet<T>(key: string): CachedEntry<T> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore storage failures (private mode / quota)
  }
}

export function prayerCacheKey(latitude: number, longitude: number): string {
  // 2 decimals (~1.1km) avoids misses from tiny GPS jitter while keeping city-level accuracy
  return `prayer-${latitude.toFixed(2)}-${longitude.toFixed(2)}-${getTodayKey()}`;
}

export function getCached<T>(key: string, ttlMs: number): { data: T; isStale: boolean } | null {
  const entry = safeGet<T>(key);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  return { data: entry.data, isStale: age > ttlMs };
}

export function setLastLocation(location: Omit<CachedLocation, 'ts'>): void {
  try {
    const payload: CachedLocation = { ...location, ts: Date.now() };
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function getLastLocation(maxAgeMs = 24 * 60 * 60 * 1000): CachedLocation | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw) as CachedLocation;
    if (!loc || typeof loc.ts !== 'number') return null;
    if (Date.now() - loc.ts > maxAgeMs) return null;
    return loc;
  } catch {
    return null;
  }
}

export function nearbyCacheKey(prefix: 'restaurants' | 'mosques', latitude: number, longitude: number, radius = 5000): string {
  return `${prefix}-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radius}`;
}
