import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Mahkota Taiwan | Rasa Indonesia, Hadir di Taiwan',
  description: 'Mahkota Taiwan is an Indonesian food brand based in Taiwan, focused on the production and distribution of ready-to-eat Indonesian specialties.',
  keywords: ['Indonesian food', 'Taiwan', 'halal food', 'Mahkota Taiwan', 'frozen food', 'makanan Indonesia', '印尼食品', '台灣'],
  metadataBase: new URL('https://mahkotatw.com'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: ['en_US', 'zh_TW'],
    url: 'https://mahkotatw.com',
    siteName: 'Mahkota Taiwan',
    title: 'Mahkota Taiwan | Rasa Indonesia, Hadir di Taiwan',
    description: 'Distributor produk makanan Indonesia di Taiwan. 300+ toko mitra, bersertifikat halal, melayani diaspora Indonesia & pasar Taiwan sejak 2021.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mahkota Taiwan — Cita Rasa Indonesia di Taiwan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mahkota Taiwan | Rasa Indonesia, Hadir di Taiwan',
    description: 'Distributor produk makanan Indonesia di Taiwan. 300+ toko mitra, bersertifikat halal.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
