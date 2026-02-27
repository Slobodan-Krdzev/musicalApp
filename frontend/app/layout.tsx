import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'GigMatch – Connect Musicians & Venues',
  description: 'Arrange live events and gigs. Musicians find venues, venues find artists.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-zinc-950 text-zinc-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
