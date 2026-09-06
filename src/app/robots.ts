import { MetadataRoute } from 'next';

function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/$/, '');
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  return 'http://localhost:3000';
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const hostname = (() => {
    try {
      return new URL(siteUrl).hostname.toLowerCase();
    } catch {
      return '';
    }
  })();

  const allowIndexing = hostname === 'moosleem.com' || hostname === 'www.moosleem.com';

  return {
    rules: allowIndexing
      ? {
          userAgent: '*',
          allow: '/',
        }
      : {
          userAgent: '*',
          disallow: '/',
        },
    sitemap: allowIndexing ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
