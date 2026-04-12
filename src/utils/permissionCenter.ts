'use client';

import { setLastLocation, getLastLocation } from '@/utils/clientCache';
import {
  broadcastAzanReminderState,
  writeAzanReminderEnabled,
} from '@/utils/azanReminder';
import { ensureAzanServiceWorker } from '@/utils/azanReminderRuntime';

export type LocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';
export const LOCATION_PERMISSION_UPDATED_EVENT = 'mt:location-permission-updated';

export interface LocationPermissionUpdatedDetail {
  latitude: number;
  longitude: number;
  timezone: string;
}
export type PermissionStep =
  | 'requesting-location'
  | 'location-granted'
  | 'location-denied'
  | 'requesting-notification'
  | 'notification-granted'
  | 'notification-denied'
  | 'enabling-reminder'
  | 'completed';

export interface LocationPermissionResult {
  granted: boolean;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function getLocationPermissionState(): Promise<LocationPermissionState> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return 'unsupported';
  }

  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    return 'prompt';
  }

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    if (status.state === 'granted') return 'granted';
    if (status.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return { granted: false };
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLastLocation({
          latitude,
          longitude,
          timezone,
          accuracy: position.coords.accuracy,
        });

        window.dispatchEvent(new CustomEvent<LocationPermissionUpdatedDetail>(LOCATION_PERMISSION_UPDATED_EVENT, {
          detail: {
            latitude,
            longitude,
            timezone,
          },
        }));

        resolve({
          granted: true,
          latitude,
          longitude,
          timezone,
        });
      },
      () => resolve({ granted: false }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function enableServerPushWithLastLocation(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  const location = getLastLocation(24 * 60 * 60 * 1000);
  if (!location) return false;

  const keyRes = await fetch('/api/push/public-key', { cache: 'no-store' });
  if (!keyRes.ok) return false;

  const keyData = (await keyRes.json()) as { publicKey?: string };
  if (!keyData.publicKey) return false;

  await ensureAzanServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(keyData.publicKey) as BufferSource,
    });
  }

  const subscribeRes = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      },
    }),
  });

  return subscribeRes.ok;
}

export async function activateAllPermissionsInOneClick(onStep?: (step: PermissionStep) => void): Promise<{
  locationGranted: boolean;
  location?: { latitude: number; longitude: number; timezone: string };
  notificationGranted: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  pushSubscribed: boolean;
}> {
  onStep?.('requesting-location');
  const locationResult = await requestLocationPermission();
  onStep?.(locationResult.granted ? 'location-granted' : 'location-denied');

  onStep?.('requesting-notification');
  const notificationResult = await requestNotificationPermission();
  onStep?.(notificationResult === 'granted' ? 'notification-granted' : 'notification-denied');

  let pushSubscribed = false;
  if (notificationResult === 'granted') {
    onStep?.('enabling-reminder');
    broadcastAzanReminderState(writeAzanReminderEnabled(true));
    pushSubscribed = await enableServerPushWithLastLocation().catch(() => false);
  }

  onStep?.('completed');

  return {
    locationGranted: locationResult.granted,
    location: locationResult.granted && locationResult.latitude !== undefined && locationResult.longitude !== undefined && locationResult.timezone
      ? {
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          timezone: locationResult.timezone,
        }
      : undefined,
    notificationGranted: notificationResult === 'granted',
    notificationPermission: notificationResult,
    pushSubscribed,
  };
}
