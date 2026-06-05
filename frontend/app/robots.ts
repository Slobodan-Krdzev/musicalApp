import type { MetadataRoute } from 'next';
import { privateRoutePrefixes, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        ...privateRoutePrefixes,
        '/events/*/apply',
        '/offerings/*/apply',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
