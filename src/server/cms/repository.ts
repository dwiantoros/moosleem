import 'server-only';

import { randomUUID } from 'crypto';

import { getCmsDb, ensureCmsTables } from '@/server/cms/db';
import {
  type CmsAsset,
  DEFAULT_CMS_SETTINGS,
  type CmsArticle,
  type CmsArticleInput,
  type CmsArticleStatus,
  type CmsSettings,
} from '@/server/cms/types';

function valueToString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function rowToArticle(row: Record<string, unknown>): CmsArticle {
  return {
    id: valueToString(row.id),
    title: valueToString(row.title),
    slug: valueToString(row.slug),
    category: valueToString(row.category) || 'Artikel',
    excerpt: valueToString(row.excerpt),
    content: valueToString(row.content),
    coverImage: valueToString(row.coverImage),
    seoTitle: valueToString(row.seoTitle),
    seoDescription: valueToString(row.seoDescription),
    seoKeywords: valueToString(row.seoKeywords),
    canonicalUrl: valueToString(row.canonicalUrl),
    ogImage: valueToString(row.ogImage),
    status: valueToString(row.status) === 'published' ? 'published' : 'draft',
    publishedAt: valueToString(row.publishedAt) || null,
    createdAt: valueToString(row.createdAt),
    updatedAt: valueToString(row.updatedAt),
  };
}

function rowToSettings(row?: Record<string, unknown>): CmsSettings {
  if (!row) {
    return DEFAULT_CMS_SETTINGS;
  }

  return {
    blogTitle: valueToString(row.blogTitle) || DEFAULT_CMS_SETTINGS.blogTitle,
    blogDescription: valueToString(row.blogDescription) || DEFAULT_CMS_SETTINGS.blogDescription,
    defaultSeoTitle: valueToString(row.defaultSeoTitle) || DEFAULT_CMS_SETTINGS.defaultSeoTitle,
    defaultSeoDescription: valueToString(row.defaultSeoDescription) || DEFAULT_CMS_SETTINGS.defaultSeoDescription,
    defaultKeywords: valueToString(row.defaultKeywords) || DEFAULT_CMS_SETTINGS.defaultKeywords,
    defaultOgImage: valueToString(row.defaultOgImage),
    profileName: valueToString(row.profileName) || DEFAULT_CMS_SETTINGS.profileName,
    profileRole: valueToString(row.profileRole) || DEFAULT_CMS_SETTINGS.profileRole,
    profilePhoto: valueToString(row.profilePhoto),
    profileBio: valueToString(row.profileBio) || DEFAULT_CMS_SETTINGS.profileBio,
    updatedAt: valueToString(row.updatedAt) || DEFAULT_CMS_SETTINGS.updatedAt,
  };
}

function pickSettingText(input: Partial<CmsSettings>, key: keyof CmsSettings, current: string) {
  if (!(key in input)) {
    return current;
  }

  return cleanOptionalText(input[key]);
}

function valueToNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value) || 0;
}

function rowToAsset(row: Record<string, unknown>): CmsAsset {
  const id = valueToString(row.id);

  return {
    id,
    filename: valueToString(row.filename),
    mimeType: valueToString(row.mimeType),
    sizeBytes: valueToNumber(row.sizeBytes),
    altText: valueToString(row.altText),
    createdAt: valueToString(row.createdAt),
    url: `/api/cms/assets/${id}`,
  };
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanOptionalText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeArticleContent(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/`r`n|`n|`r/g, '\n')
    .replace(/([.!?])n(?=#{1,6}\s)/g, '$1\n\n')
    .replace(/(^|\s)n(?=#{1,6}\s)/g, '\n\n')
    .replace(/\sn(?=[A-Z])/g, '\n')
    .replace(/([.!?])n(?=[A-Z])/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n');
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `artikel-${Date.now()}`;
}

function toIsoString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

async function readyDb() {
  const db = await getCmsDb();

  if (!db) {
    return null;
  }

  await ensureCmsTables();
  return db;
}

function normalizeArticleInput(input: CmsArticleInput, existing?: CmsArticle) {
  const title = cleanText(input.title || existing?.title || '');

  if (!title) {
    throw new Error('Judul artikel wajib diisi.');
  }

  const status: CmsArticleStatus = input.status === 'published' ? 'published' : 'draft';
  const slug = slugify(cleanOptionalText(input.slug) || title);
  const requestedPublishedAt = toIsoString(input.publishedAt ?? existing?.publishedAt ?? null);
  const publishedAt = status === 'published' ? requestedPublishedAt || existing?.publishedAt || new Date().toISOString() : null;

  return {
    title,
    slug,
    category: cleanOptionalText(input.category) || existing?.category || 'Artikel',
    excerpt: cleanOptionalText(input.excerpt),
    content: typeof input.content === 'string' ? normalizeArticleContent(input.content) : existing?.content || '',
    coverImage: cleanOptionalText(input.coverImage),
    seoTitle: cleanOptionalText(input.seoTitle),
    seoDescription: cleanOptionalText(input.seoDescription),
    seoKeywords: cleanOptionalText(input.seoKeywords),
    canonicalUrl: cleanOptionalText(input.canonicalUrl),
    ogImage: cleanOptionalText(input.ogImage),
    status,
    publishedAt,
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Error && /unique|constraint/i.test(error.message);
}

export async function listArticles(options?: { includeDrafts?: boolean }) {
  const db = await readyDb();

  if (!db) {
    return [] as CmsArticle[];
  }

  const includeDrafts = options?.includeDrafts ?? false;
  const statement = includeDrafts
    ? 'SELECT * FROM cms_articles ORDER BY datetime(COALESCE(publishedAt, updatedAt)) DESC, datetime(updatedAt) DESC'
    : "SELECT * FROM cms_articles WHERE status = 'published' ORDER BY datetime(publishedAt) DESC, datetime(updatedAt) DESC";
  const result = await db.execute(statement);

  return result.rows.map((row) => rowToArticle(row as Record<string, unknown>));
}

export async function getArticleBySlug(slug: string, options?: { includeDrafts?: boolean }) {
  const db = await readyDb();

  if (!db) {
    return null;
  }

  const result = await db.execute({
    sql: options?.includeDrafts
      ? 'SELECT * FROM cms_articles WHERE slug = ? LIMIT 1'
      : "SELECT * FROM cms_articles WHERE slug = ? AND status = 'published' LIMIT 1",
    args: [slug],
  });

  if (!result.rows[0]) {
    return null;
  }

  return rowToArticle(result.rows[0] as Record<string, unknown>);
}

export async function getArticleById(id: string) {
  const db = await readyDb();

  if (!db) {
    return null;
  }

  const result = await db.execute({
    sql: 'SELECT * FROM cms_articles WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (!result.rows[0]) {
    return null;
  }

  return rowToArticle(result.rows[0] as Record<string, unknown>);
}

export async function createArticle(input: CmsArticleInput) {
  const db = await readyDb();

  if (!db) {
    throw new Error('Database CMS belum dikonfigurasi.');
  }

  const article = normalizeArticleInput(input);
  const now = new Date().toISOString();
  const id = randomUUID();

  try {
    await db.execute({
      sql: `
        INSERT INTO cms_articles (
          id, title, slug, category, excerpt, content, coverImage, seoTitle, seoDescription,
          seoKeywords, canonicalUrl, ogImage, status, publishedAt, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        article.title,
        article.slug,
        article.category,
        article.excerpt,
        article.content,
        article.coverImage,
        article.seoTitle,
        article.seoDescription,
        article.seoKeywords,
        article.canonicalUrl,
        article.ogImage,
        article.status,
        article.publishedAt,
        now,
        now,
      ],
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error('Slug artikel sudah dipakai. Gunakan slug lain.');
    }

    throw error;
  }

  return {
    id,
    ...article,
    createdAt: now,
    updatedAt: now,
  } satisfies CmsArticle;
}

export async function updateArticle(id: string, input: CmsArticleInput) {
  const db = await readyDb();

  if (!db) {
    throw new Error('Database CMS belum dikonfigurasi.');
  }

  const existing = await getArticleById(id);

  if (!existing) {
    throw new Error('Artikel tidak ditemukan.');
  }

  const article = normalizeArticleInput(input, existing);
  const updatedAt = new Date().toISOString();

  try {
    await db.execute({
      sql: `
        UPDATE cms_articles
        SET title = ?, slug = ?, category = ?, excerpt = ?, content = ?, coverImage = ?, seoTitle = ?,
            seoDescription = ?, seoKeywords = ?, canonicalUrl = ?, ogImage = ?, status = ?,
            publishedAt = ?, updatedAt = ?
        WHERE id = ?
      `,
      args: [
        article.title,
        article.slug,
        article.category,
        article.excerpt,
        article.content,
        article.coverImage,
        article.seoTitle,
        article.seoDescription,
        article.seoKeywords,
        article.canonicalUrl,
        article.ogImage,
        article.status,
        article.publishedAt,
        updatedAt,
        id,
      ],
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error('Slug artikel sudah dipakai. Gunakan slug lain.');
    }

    throw error;
  }

  return {
    ...existing,
    ...article,
    updatedAt,
  } satisfies CmsArticle;
}

export async function deleteArticle(id: string) {
  const db = await readyDb();

  if (!db) {
    throw new Error('Database CMS belum dikonfigurasi.');
  }

  const existing = await getArticleById(id);

  if (!existing) {
    throw new Error('Artikel tidak ditemukan.');
  }

  await db.execute({
    sql: 'DELETE FROM cms_articles WHERE id = ?',
    args: [id],
  });

  return existing;
}

export async function getCmsSettings() {
  const db = await readyDb();

  if (!db) {
    return DEFAULT_CMS_SETTINGS;
  }

  const result = await db.execute({
    sql: 'SELECT * FROM cms_settings WHERE id = ? LIMIT 1',
    args: ['global'],
  });

  if (!result.rows[0]) {
    const defaults = {
      ...DEFAULT_CMS_SETTINGS,
      updatedAt: new Date().toISOString(),
    };

    await db.execute({
      sql: `
        INSERT INTO cms_settings (
          id, blogTitle, blogDescription, defaultSeoTitle, defaultSeoDescription,
          defaultKeywords, defaultOgImage, profileName, profileRole, profilePhoto, profileBio, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'global',
        defaults.blogTitle,
        defaults.blogDescription,
        defaults.defaultSeoTitle,
        defaults.defaultSeoDescription,
        defaults.defaultKeywords,
        defaults.defaultOgImage,
        defaults.profileName,
        defaults.profileRole,
        defaults.profilePhoto,
        defaults.profileBio,
        defaults.updatedAt,
      ],
    });

    return defaults;
  }

  return rowToSettings(result.rows[0] as Record<string, unknown>);
}

export async function updateCmsSettings(input: Partial<CmsSettings>) {
  const db = await readyDb();

  if (!db) {
    throw new Error('Database CMS belum dikonfigurasi.');
  }

  const current = await getCmsSettings();
  const updatedAt = new Date().toISOString();
  const next = {
    blogTitle: pickSettingText(input, 'blogTitle', current.blogTitle),
    blogDescription: pickSettingText(input, 'blogDescription', current.blogDescription),
    defaultSeoTitle: pickSettingText(input, 'defaultSeoTitle', current.defaultSeoTitle),
    defaultSeoDescription: pickSettingText(input, 'defaultSeoDescription', current.defaultSeoDescription),
    defaultKeywords: pickSettingText(input, 'defaultKeywords', current.defaultKeywords),
    defaultOgImage: pickSettingText(input, 'defaultOgImage', current.defaultOgImage),
    profileName: pickSettingText(input, 'profileName', current.profileName),
    profileRole: pickSettingText(input, 'profileRole', current.profileRole),
    profilePhoto: pickSettingText(input, 'profilePhoto', current.profilePhoto),
    profileBio: pickSettingText(input, 'profileBio', current.profileBio),
    updatedAt,
  } satisfies CmsSettings;

  await db.execute({
    sql: `
      INSERT INTO cms_settings (
        id, blogTitle, blogDescription, defaultSeoTitle, defaultSeoDescription,
        defaultKeywords, defaultOgImage, profileName, profileRole, profilePhoto, profileBio, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        blogTitle = excluded.blogTitle,
        blogDescription = excluded.blogDescription,
        defaultSeoTitle = excluded.defaultSeoTitle,
        defaultSeoDescription = excluded.defaultSeoDescription,
        defaultKeywords = excluded.defaultKeywords,
        defaultOgImage = excluded.defaultOgImage,
        profileName = excluded.profileName,
        profileRole = excluded.profileRole,
        profilePhoto = excluded.profilePhoto,
        profileBio = excluded.profileBio,
        updatedAt = excluded.updatedAt
    `,
    args: [
      'global',
      next.blogTitle,
      next.blogDescription,
      next.defaultSeoTitle,
      next.defaultSeoDescription,
      next.defaultKeywords,
      next.defaultOgImage,
      next.profileName,
      next.profileRole,
      next.profilePhoto,
      next.profileBio,
      next.updatedAt,
    ],
  });

  return next;
}

export async function listAssets(limit = 24) {
  const db = await readyDb();

  if (!db) {
    return [] as CmsAsset[];
  }

  const result = await db.execute({
    sql: 'SELECT id, filename, mimeType, sizeBytes, altText, createdAt FROM cms_assets ORDER BY datetime(createdAt) DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((row) => rowToAsset(row as Record<string, unknown>));
}

export async function getAssetById(id: string) {
  const db = await readyDb();

  if (!db) {
    return null;
  }

  const result = await db.execute({
    sql: 'SELECT * FROM cms_assets WHERE id = ? LIMIT 1',
    args: [id],
  });

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0] as Record<string, unknown>;

  return {
    ...rowToAsset(row),
    base64Data: valueToString(row.base64Data),
  };
}

export async function createAsset(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText?: string;
  base64Data: string;
}) {
  const db = await readyDb();

  if (!db) {
    throw new Error('Database CMS belum dikonfigurasi.');
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO cms_assets (
        id, filename, mimeType, sizeBytes, altText, base64Data, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      cleanText(input.filename) || `asset-${id}`,
      cleanText(input.mimeType) || 'application/octet-stream',
      input.sizeBytes,
      cleanOptionalText(input.altText),
      input.base64Data,
      createdAt,
    ],
  });

  return {
    id,
    filename: cleanText(input.filename) || `asset-${id}`,
    mimeType: cleanText(input.mimeType) || 'application/octet-stream',
    sizeBytes: input.sizeBytes,
    altText: cleanOptionalText(input.altText),
    createdAt,
    url: `/api/cms/assets/${id}`,
  } satisfies CmsAsset;
}