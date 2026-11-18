import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { APP_CONFIG } from '@/lib/config';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.APP_NAME} — Live Streamer Directory`,
  description: APP_CONFIG.APP_SHORT_DESCRIPTION,
  openGraph: {
    title: `${APP_CONFIG.APP_NAME} — Live Streamer Directory`,
    description: APP_CONFIG.APP_SHORT_DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.APP_NAME} — Live Streamer Directory`,
    description: APP_CONFIG.APP_SHORT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#0B0614] text-[#FFF5FA] selection:bg-[#FF2E93]/30 selection:text-[#FFF5FA]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
