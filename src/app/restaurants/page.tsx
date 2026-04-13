'use client';

import React from 'react';
import RestaurantFinder from '@/components/RestaurantFinder';
import PermissionPromptModal from '@/components/PermissionPromptModal';
import { LocationData } from '@/types';
import PageHeaderActions from '@/components/PageHeaderActions';
import Link from 'next/link';
import { getCached, getLastLocation, safeSet, setLastLocation } from '@/utils/clientCache';
import {
  activateAllPermissionsInOneClick,
  LOCATION_PERMISSION_UPDATED_EVENT,
  LocationPermissionUpdatedDetail,
  PermissionStep,
} from '@/utils/permissionCenter';

const LOCATION_MOVE_THRESHOLD_METERS = 120;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function RestaurantsPage() {
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [districtLabel, setDistrictLabel] = React.useState<string | null>(null);
  const [countryName, setCountryName] = React.useState<string | null>(null);
  const [countryCode, setCountryCode] = React.useState<string | null>(null);
  const [preferredHalalLogoKey, setPreferredHalalLogoKey] = React.useState<string>('id');
  const [locationPermission, setLocationPermission] = React.useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [activatingPermissions, setActivatingPermissions] = React.useState(false);
  const [showPermissionPopup, setShowPermissionPopup] = React.useState(false);
  const [permissionStatusMessage, setPermissionStatusMessage] = React.useState<string>('Siap mengaktifkan semua izin.');
  const [locationFlowState, setLocationFlowState] = React.useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [notificationFlowState, setNotificationFlowState] = React.useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [reminderFlowState, setReminderFlowState] = React.useState<'idle' | 'pending' | 'enabled' | 'disabled'>('idle');
  const repromptTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRepromptTimer = React.useCallback(() => {
    if (!repromptTimerRef.current) return;
    clearTimeout(repromptTimerRef.current);
    repromptTimerRef.current = null;
  }, []);

  const scheduleReprompt = React.useCallback(() => {
    clearRepromptTimer();
    repromptTimerRef.current = setTimeout(() => {
      if (locationPermission !== 'granted') {
        setShowPermissionPopup(true);
      }
    }, 10 * 60 * 1000);
  }, [clearRepromptTimer, locationPermission]);

  React.useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationPermission('unsupported');
      setShowPermissionPopup(true);
      setLoading(false);
      return;
    }

    const resolvePermissionState = async () => {
      const refreshPreciseLocation = (onError: () => void) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocationPermission('granted');
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone });
            setLastLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timezone,
              accuracy: pos.coords.accuracy,
            });
            setLoading(false);
          },
          () => {
            onError();
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60 * 1000 }
        );
      };

      if ('permissions' in navigator && navigator.permissions?.query) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            const cached = getLastLocation(15 * 60 * 1000);
            if (cached) {
              setLocationPermission('granted');
              setLocation({ latitude: cached.latitude, longitude: cached.longitude, timezone: cached.timezone });
              setLoading(false);
              refreshPreciseLocation(() => {
                // Keep cached location when precise refresh fails.
              });
              return;
            }

            refreshPreciseLocation(() => {
                setLocationPermission('prompt');
                setShowPermissionPopup(true);
            });
            return;
          }

          if (status.state === 'denied') {
            setLocationPermission('denied');
          } else {
            setLocationPermission('prompt');
          }
          setShowPermissionPopup(true);
          setLoading(false);
          return;
        } catch {
          // continue below
        }
      }

      setLocationPermission('prompt');
      setShowPermissionPopup(true);
      setLoading(false);
    };

    void resolvePermissionState();
  }, []);

  React.useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const key = `district-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`;
    const TTL_MS = 24 * 60 * 60 * 1000;

    const hydrate = async () => {
      const cached = getCached<{
        district: string | null;
        country: string | null;
        countryCode: string | null;
        displayName: string | null;
      }>(key, TTL_MS);
      if (cached) {
        setDistrictLabel(cached.data.district ?? null);
        setCountryName(cached.data.country ?? null);
        setCountryCode(cached.data.countryCode ?? null);

        if ((cached.data.countryCode ?? '').toUpperCase() === 'CN') {
          setPreferredHalalLogoKey('cn');
        } else if ((cached.data.countryCode ?? '').toUpperCase() === 'JP') {
          setPreferredHalalLogoKey('jp');
        } else if ((cached.data.countryCode ?? '').toUpperCase() === 'KR') {
          setPreferredHalalLogoKey('kr');
        } else if ((cached.data.countryCode ?? '').toUpperCase() === 'SA') {
          setPreferredHalalLogoKey('sa');
        } else {
          setPreferredHalalLogoKey('id');
        }

        if (!cached.isStale) return;
      }

      try {
        const res = await fetch(
          `/api/location-context?latitude=${location.latitude}&longitude=${location.longitude}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          district?: string | null;
          country?: string | null;
          countryCode?: string | null;
          displayName?: string | null;
        };
        const district = json.district ?? null;
        const country = json.country ?? null;
        const nextCode = (json.countryCode ?? null)?.toUpperCase() ?? null;
        setDistrictLabel(district);
        setCountryName(country);
        setCountryCode(nextCode);

        if (nextCode === 'CN') {
          setPreferredHalalLogoKey('cn');
        } else if (nextCode === 'JP') {
          setPreferredHalalLogoKey('jp');
        } else if (nextCode === 'KR') {
          setPreferredHalalLogoKey('kr');
        } else if (nextCode === 'SA') {
          setPreferredHalalLogoKey('sa');
        } else {
          setPreferredHalalLogoKey('id');
        }

        safeSet(key, {
          district,
          country,
          countryCode: nextCode,
          displayName: json.displayName ?? null,
        });
      } catch {
        // ignore
      }
    };

    hydrate();
  }, [location?.latitude, location?.longitude]);

  React.useEffect(() => {
    const onLocationPermissionUpdated = (event: Event) => {
      const custom = event as CustomEvent<LocationPermissionUpdatedDetail>;
      const detail = custom.detail;
      if (!detail) return;

      setLocationPermission('granted');
      setLocation({
        latitude: detail.latitude,
        longitude: detail.longitude,
        timezone: detail.timezone,
      });
      setShowPermissionPopup(false);
      setLoading(false);
      clearRepromptTimer();
    };

    window.addEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    return () => {
      window.removeEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    };
  }, [clearRepromptTimer]);

  React.useEffect(() => {
    if (locationPermission !== 'granted') return;
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const nextLat = pos.coords.latitude;
        const nextLon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setLocation((prev) => {
          if (!prev) {
            setLastLocation({ latitude: nextLat, longitude: nextLon, timezone, accuracy });
            return { latitude: nextLat, longitude: nextLon, timezone };
          }

          const movedMeters = distanceMeters(prev.latitude, prev.longitude, nextLat, nextLon);
          const timezoneChanged = prev.timezone !== timezone;

          if (movedMeters < LOCATION_MOVE_THRESHOLD_METERS && !timezoneChanged) {
            return prev;
          }

          setLastLocation({ latitude: nextLat, longitude: nextLon, timezone, accuracy });
          return { latitude: nextLat, longitude: nextLon, timezone };
        });
      },
      () => {
        // Ignore intermittent watch errors to avoid disrupting the page.
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60 * 1000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [locationPermission]);

  const isLocationBlocked = locationPermission !== 'granted';

  const handlePermissionStep = (step: PermissionStep) => {
    if (step === 'requesting-location') {
      setLocationFlowState('pending');
      setPermissionStatusMessage('Meminta izin lokasi...');
      return;
    }
    if (step === 'location-granted') {
      setLocationFlowState('granted');
      setPermissionStatusMessage('Izin lokasi aktif.');
      return;
    }
    if (step === 'location-denied') {
      setLocationFlowState('denied');
      setPermissionStatusMessage('Izin lokasi belum diaktifkan.');
      return;
    }
    if (step === 'requesting-notification') {
      setNotificationFlowState('pending');
      setPermissionStatusMessage('Meminta izin notifikasi browser...');
      return;
    }
    if (step === 'notification-granted') {
      setNotificationFlowState('granted');
      setPermissionStatusMessage('Izin notifikasi aktif.');
      return;
    }
    if (step === 'notification-denied') {
      setNotificationFlowState('denied');
      setPermissionStatusMessage('Izin notifikasi belum diaktifkan.');
      return;
    }
    if (step === 'enabling-reminder') {
      setReminderFlowState('pending');
      setPermissionStatusMessage('Mengaktifkan adzan reminder...');
      return;
    }

    setPermissionStatusMessage('Proses izin selesai.');
  };

  const handleActivatePermissions = async () => {
    if (activatingPermissions) return;

    setActivatingPermissions(true);
    setPermissionStatusMessage('Menyiapkan aktivasi izin...');
    setLocationFlowState(locationPermission === 'unsupported' ? 'unsupported' : 'idle');
    setNotificationFlowState('idle');
    setReminderFlowState('idle');
    try {
      const result = await activateAllPermissionsInOneClick(handlePermissionStep);
      if (result.locationGranted && result.location) {
        setLocationPermission('granted');
        setLocation(result.location);
        clearRepromptTimer();
      } else {
        setLocationPermission('prompt');
      }

      setNotificationFlowState(result.notificationPermission === 'granted' ? 'granted' : result.notificationPermission === 'denied' ? 'denied' : 'unsupported');
      setReminderFlowState(result.notificationGranted ? 'enabled' : 'disabled');
      setPermissionStatusMessage(result.locationGranted && result.notificationGranted
        ? 'Semua izin penting sudah aktif.'
        : 'Sebagian izin belum aktif. Anda bisa coba lagi.');

      setShowPermissionPopup(false);
    } finally {
      setActivatingPermissions(false);
    }
  };

  const handleLaterPermission = () => {
    setShowPermissionPopup(false);
    setPermissionStatusMessage('Popup akan muncul lagi dalam 10 menit.');
    scheduleReprompt();
  };

  React.useEffect(() => {
    return () => {
      clearRepromptTimer();
    };
  }, [clearRepromptTimer]);

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Terdekat</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Halal Nearby</h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        {/* District badge */}
        {(location || isLocationBlocked) && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            <span className="rounded-lg border border-teal-300/45 bg-gradient-to-r from-teal-500/12 to-cyan-500/10 px-2.5 py-1 font-semibold text-teal-700 dark:border-teal-700/55 dark:from-teal-400/20 dark:to-cyan-400/16 dark:text-teal-300">
              {isLocationBlocked
                ? 'Lokasi tidak terdeteksi'
                : districtLabel
                  ? `Anda sedang berada di '${districtLabel}'`
                  : 'Mencari distrik...'}
            </span>
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
            <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : isLocationBlocked ? (
          <section className="glass-panel rounded-[1.75rem] p-6 sm:p-7">
            <div className="rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-700/40 dark:from-amber-900/20 dark:to-orange-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Izin Lokasi Diperlukan</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Aktifkan lokasi untuk menemukan restoran halal terdekat</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Akses lokasi masih diblokir, jadi kami belum bisa mengambil daftar restoran halal di sekitar Anda. Izinkan lokasi di browser lalu muat ulang halaman.
              </p>
              <button
                type="button"
                onClick={() => setShowPermissionPopup(true)}
                disabled={activatingPermissions}
                className="mt-4 inline-flex items-center rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                Aktifkan Izin
              </button>
            </div>
          </section>
        ) : (
          <RestaurantFinder
            location={location}
            preferredHalalLogoKey={preferredHalalLogoKey}
            countryCode={countryCode}
            countryName={countryName}
          />
        )}

        <PermissionPromptModal
          open={showPermissionPopup}
          loading={activatingPermissions}
          onClose={handleLaterPermission}
          onConfirm={handleActivatePermissions}
          statusMessage={permissionStatusMessage}
          locationState={locationFlowState}
          notificationState={notificationFlowState}
          reminderState={reminderFlowState}
        />

        <footer className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-6 text-center text-sm text-slate-500">
          <p>Data lokasi dari OpenStreetMap &middot; Selalu verifikasi status halal secara langsung</p>
        </footer>
      </main>
    </div>
  );
}
