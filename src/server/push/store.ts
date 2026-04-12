import 'server-only';

import { kv } from '@vercel/kv';
import { getCmsDb } from '@/server/cms/db';
import { PushSubscriber } from '@/server/push/types';

const PUSH_KV_HASH_KEY = 'push:subscriptions:v1';
let pushTableReady = false;

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

function canUseCmsDb(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim()) || process.env.NODE_ENV !== 'production';
}

async function ensurePushTable() {
  if (pushTableReady || !canUseCmsDb()) {
    return;
  }

  const db = await getCmsDb();
  if (!db) {
    return;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscribers (
      endpoint TEXT PRIMARY KEY,
      payloadJson TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  await db.execute('CREATE INDEX IF NOT EXISTS push_subscribers_updated_idx ON push_subscribers(updatedAt DESC)');
  pushTableReady = true;
}

export async function upsertPushSubscriber(subscriber: PushSubscriber): Promise<void> {
  if (canUseKv()) {
    await kv.hset(PUSH_KV_HASH_KEY, {
      [subscriber.endpoint]: JSON.stringify(subscriber),
    });
    return;
  }

  if (canUseCmsDb()) {
    const db = await getCmsDb();

    if (db) {
      await ensurePushTable();
      await db.execute({
        sql: `INSERT INTO push_subscribers (endpoint, payloadJson, updatedAt)
              VALUES (?, ?, ?)
              ON CONFLICT(endpoint) DO UPDATE SET
                payloadJson = excluded.payloadJson,
                updatedAt = excluded.updatedAt`,
        args: [subscriber.endpoint, JSON.stringify(subscriber), subscriber.updatedAt],
      });
      return;
    }
  }

  getMemoryStore().set(subscriber.endpoint, subscriber);
}

export async function removePushSubscriber(endpoint: string): Promise<void> {
  if (canUseKv()) {
    await kv.hdel(PUSH_KV_HASH_KEY, endpoint);
    return;
  }

  if (canUseCmsDb()) {
    const db = await getCmsDb();
    if (db) {
      await ensurePushTable();
      await db.execute({
        sql: 'DELETE FROM push_subscribers WHERE endpoint = ?',
        args: [endpoint],
      });
      return;
    }
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

  if (canUseCmsDb()) {
    const db = await getCmsDb();
    if (db) {
      await ensurePushTable();
      const result = await db.execute('SELECT payloadJson FROM push_subscribers');
      return result.rows
        .map((row) => {
          try {
            return JSON.parse(String((row as { payloadJson?: unknown }).payloadJson || '')) as PushSubscriber;
          } catch {
            return null;
          }
        })
        .filter((item): item is PushSubscriber => item !== null);
    }
  }

  return Array.from(getMemoryStore().values());
}
