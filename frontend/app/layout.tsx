import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { SiteJsonLd } from '@/components/seo/JsonLd';
import { rootMetadata } from '@/lib/metadata';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-zinc-950 text-zinc-100`}>
        <SiteJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
