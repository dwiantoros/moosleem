'use client';

export const AZAN_REMINDER_ENABLED_KEY = 'azanReminderEnabled';
export const AZAN_SOUND_ENABLED_KEY = 'azanSoundEnabled';
export const AZAN_PROMPT_DISMISSED_KEY = 'azanPromptDismissed';
export const AZAN_REMINDER_EVENT = 'azan-reminder-changed';
export const AZAN_WEBSITE_POPUP_EVENT = 'azan-website-popup';
export const AZAN_PENDING_WEBSITE_POPUP_KEY = 'azanPendingWebsitePopup';

// Daily Inspiration constants
export const DAILY_INSPIRATION_NOTIF_KEY = 'dailyInspirationNotif';
export const DAILY_INSPIRATION_NOTIF_EVENT = 'daily-inspiration-notif';
export const DAILY_INSPIRATION_NOTIF_STORAGE_KEY = 'dailyInspirationNotifications';

export type AzanReminderPermission = NotificationPermission | 'unsupported';

export interface AzanReminderSnapshot {
  enabled: boolean;
  permission: AzanReminderPermission;
  soundEnabled: boolean;
}

export interface AzanWebsitePopupDetail {
  title: string;
  body: string;
  timeLabel: string;
  createdAt: number;
}

export interface DailyInspirationNotif {
  id: string;
  date: string; // YYYY-MM-DD format
  arabic: string;
  translation: string;
  reference: string;
  createdAt: number;
}

export function getAzanPermission(): AzanReminderPermission {
  if (typeof window === 'undefined' || !("Notification" in window)) {
    return 'unsupported';
  }

  return Notification.permission;
}

export function readAzanReminderSnapshot(): AzanReminderSnapshot {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      permission: 'unsupported',
      soundEnabled: true,
    };
  }

  const permission = getAzanPermission();
  const enabled =
    permission === 'granted' &&
    localStorage.getItem(AZAN_REMINDER_ENABLED_KEY) === 'true';
  const soundEnabled = localStorage.getItem(AZAN_SOUND_ENABLED_KEY) !== 'false';

  return {
    enabled,
    permission,
    soundEnabled,
  };
}

export function writeAzanReminderEnabled(enabled: boolean): AzanReminderSnapshot {
  localStorage.setItem(AZAN_REMINDER_ENABLED_KEY, String(enabled));
  return readAzanReminderSnapshot();
}

export function writeAzanSoundEnabled(enabled: boolean): AzanReminderSnapshot {
  localStorage.setItem(AZAN_SOUND_ENABLED_KEY, String(enabled));
  return readAzanReminderSnapshot();
}

export function broadcastAzanReminderState(
  overrides: Partial<AzanReminderSnapshot> = {}
): AzanReminderSnapshot {
  const snapshot = {
    ...readAzanReminderSnapshot(),
    ...overrides,
  };

  window.dispatchEvent(new CustomEvent<AzanReminderSnapshot>(AZAN_REMINDER_EVENT, {
    detail: snapshot,
  }));

  return snapshot;
}

export function queueAzanWebsitePopup(
  popup: Omit<AzanWebsitePopupDetail, 'createdAt'>
): AzanWebsitePopupDetail {
  const detail: AzanWebsitePopupDetail = {
    ...popup,
    createdAt: Date.now(),
  };

  localStorage.setItem(AZAN_PENDING_WEBSITE_POPUP_KEY, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent<AzanWebsitePopupDetail>(AZAN_WEBSITE_POPUP_EVENT, {
    detail,
  }));

  return detail;
}

export function readPendingAzanWebsitePopup(maxAgeMs = 15 * 60 * 1000): AzanWebsitePopupDetail | null {
  const raw = localStorage.getItem(AZAN_PENDING_WEBSITE_POPUP_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AzanWebsitePopupDetail;
    if (!parsed || typeof parsed.createdAt !== 'number') return null;
    if (Date.now() - parsed.createdAt > maxAgeMs) {
      localStorage.removeItem(AZAN_PENDING_WEBSITE_POPUP_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(AZAN_PENDING_WEBSITE_POPUP_KEY);
    return null;
  }
}

export function clearPendingAzanWebsitePopup(): void {
  localStorage.removeItem(AZAN_PENDING_WEBSITE_POPUP_KEY);
}

// Daily Inspiration Notification Functions
export function getDailyInspirationNotifications(): DailyInspirationNotif[] {
  const raw = localStorage.getItem(DAILY_INSPIRATION_NOTIF_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DailyInspirationNotif[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(DAILY_INSPIRATION_NOTIF_STORAGE_KEY);
    return [];
  }
}

export function saveDailyInspirationNotif(notif: DailyInspirationNotif): void {
  const existing = getDailyInspirationNotifications();
  // Remove if already exists (update)
  const filtered = existing.filter(n => n.date !== notif.date);
  // Add new one at top
  const updated = [notif, ...filtered];
  // Keep only last 30 days
  const limited = updated.slice(0, 30);
  localStorage.setItem(DAILY_INSPIRATION_NOTIF_STORAGE_KEY, JSON.stringify(limited));
}

export function deleteDailyInspirationNotif(date: string): void {
  const existing = getDailyInspirationNotifications();
  const filtered = existing.filter(n => n.date !== date);
  if (filtered.length === 0) {
    localStorage.removeItem(DAILY_INSPIRATION_NOTIF_STORAGE_KEY);
  } else {
    localStorage.setItem(DAILY_INSPIRATION_NOTIF_STORAGE_KEY, JSON.stringify(filtered));
  }
  broadcastDailyInspirationNotifUpdate();
}

export function broadcastDailyInspirationNotifUpdate(): void {
  window.dispatchEvent(new CustomEvent(DAILY_INSPIRATION_NOTIF_EVENT, {
    detail: getDailyInspirationNotifications(),
  }));
}
