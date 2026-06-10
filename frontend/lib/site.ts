/** Public site URL for SEO (sitemap, canonical, Open Graph). Set in production. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  (process.env.NODE_ENV === 'production' ? 'https://gig-connection.com' : 'http://localhost:3000');

export const siteConfig = {
  name: 'GigConnection',
  title: 'GigConnection – Connect Musicians & Venues',
  description:
    'Book live music gigs with ease. Musicians discover venues and events; venues find artists, manage applications, and fill their calendar.',
  tagline: 'The #1 platform for live music',
  locale: 'en_US',
  keywords: [
    'live music',
    'gig booking',
    'musicians',
    'venues',
    'events',
    'bands',
    'Slovakia',
    'GigConnection',
  ],
  contactEmail: 'connectiongig@gmail.com',
  ogImage: '/frontHero.png',
} as const;

/** Routes that should appear in the sitemap (public, indexable). */
export const publicRoutes: Array<{
  path: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/legal', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/parties', changeFrequency: 'daily', priority: 0.9 },
  { path: '/login', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/register', changeFrequency: 'monthly', priority: 0.6 },
];

/** Private app areas — excluded from sitemap and disallowed in robots.txt. */
export const privateRoutePrefixes = [
  '/dashboard',
  '/admin',
  '/support',
  '/verify-email',
  '/listings',
  '/applications',
  '/events/create',
  '/api',
];
