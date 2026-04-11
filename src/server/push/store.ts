import { kv } from '@vercel/kv';
import { PushSubscriber } from '@/server/push/types';

const PUSH_KV_HASH_KEY = 'push:subscriptions:v1';

declare global {
  // eslint-disable-next-line no-var
  var __pushSubscriptionsMemory: Map<string, PushSubscriber> | undefined;
}

function getMemoryStore(): Map<string, PushSubscriber> {
  if (!globalThis.__pushSubscriptionsMemory) {
    globalThis.__pushSubscriptionsMemory = new Map<string, PushSubscriber>();
  }

  return globalThis.__pushSubscriptionsMemory;
}

function canUseKv(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function upsertPushSubscriber(subscriber: PushSubscriber): Promise<void> {
  if (canUseKv()) {
    await kv.hset(PUSH_KV_HASH_KEY, {
      [subscriber.endpoint]: JSON.stringify(subscriber),
    });
    return;
  }

  getMemoryStore().set(subscriber.endpoint, subscriber);
}

export async function removePushSubscriber(endpoint: string): Promise<void> {
  if (canUseKv()) {
    await kv.hdel(PUSH_KV_HASH_KEY, endpoint);
    return;
  }

  getMemoryStore().delete(endpoint);
}

export async function listPushSubscribers(): Promise<PushSubscriber[]> {
  if (canUseKv()) {
    const rows = (await kv.hvals(PUSH_KV_HASH_KEY)) as unknown[];
    const parsed = rows
      .map((row: unknown) => {
        try {
          return JSON.parse(String(row)) as PushSubscriber;
        } catch {
          return null;
        }
      })
      .filter((row): row is PushSubscriber => row !== null);

    return parsed;
  }

  return Array.from(getMemoryStore().values());
}
