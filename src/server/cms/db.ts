import 'server-only';

import { createClient, type Client } from '@libsql/client/node';

let clientPromise: Promise<Client | null> | null = null;
let tablesReady = false;

function resolveDatabaseUrl() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (remoteUrl) {
    return remoteUrl;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'file:./local-cms.db';
  }

  return null;
}

export function getCmsStorageMode() {
  if (process.env.TURSO_DATABASE_URL?.trim()) {
    return 'turso' as const;
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'local' as const;
  }

  return 'missing' as const;
}

export function isCmsDatabaseConfigured() {
  return resolveDatabaseUrl() !== null;
}

export async function getCmsDb() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = resolveDatabaseUrl();

      if (!url) {
        return null;
      }

      return createClient({
        url,
        authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
      });
    })();
  }

  return clientPromise;
}

export async function ensureCmsTables() {
  if (tablesReady) {
    return true;
  }

  const db = await getCmsDb();

  if (!db) {
    return false;
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      coverImage TEXT NOT NULL DEFAULT '',
      seoTitle TEXT NOT NULL DEFAULT '',
      seoDescription TEXT NOT NULL DEFAULT '',
      seoKeywords TEXT NOT NULL DEFAULT '',
      canonicalUrl TEXT NOT NULL DEFAULT '',
      ogImage TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      publishedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  await db.execute('CREATE UNIQUE INDEX IF NOT EXISTS cms_articles_slug_idx ON cms_articles(slug)');
  await db.execute('CREATE INDEX IF NOT EXISTS cms_articles_status_published_idx ON cms_articles(status, publishedAt DESC)');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_settings (
      id TEXT PRIMARY KEY,
      blogTitle TEXT NOT NULL DEFAULT '',
      blogDescription TEXT NOT NULL DEFAULT '',
      defaultSeoTitle TEXT NOT NULL DEFAULT '',
      defaultSeoDescription TEXT NOT NULL DEFAULT '',
      defaultKeywords TEXT NOT NULL DEFAULT '',
      defaultOgImage TEXT NOT NULL DEFAULT '',
      updatedAt TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      sizeBytes INTEGER NOT NULL,
      altText TEXT NOT NULL DEFAULT '',
      base64Data TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  await db.execute('CREATE INDEX IF NOT EXISTS cms_assets_created_idx ON cms_assets(createdAt DESC)');

  tablesReady = true;
  return true;
}