import webpush from 'web-push';
import { PushPayload, PushSubscriber } from '@/server/push/types';

let vapidInitialized = false;

function ensureVapidReady(): { publicKey: string } {
  const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.PUSH_VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error('Missing PUSH_VAPID_PUBLIC_KEY, PUSH_VAPID_PRIVATE_KEY, or PUSH_VAPID_SUBJECT');
  }

  if (!vapidInitialized) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
  }

  return { publicKey };
}

export function getVapidPublicKey(): string {
  return ensureVapidReady().publicKey;
}

export async function sendWebPush(
  subscriber: PushSubscriber,
  payload: PushPayload
): Promise<{ delivered: boolean; expired: boolean; statusCode?: number }> {
  ensureVapidReady();

  try {
    await webpush.sendNotification(subscriber.subscription, JSON.stringify(payload));
    return { delivered: true, expired: false };
  } catch (error) {
    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : undefined;

    const expired = statusCode === 404 || statusCode === 410;
    return { delivered: false, expired, statusCode };
  }
}
