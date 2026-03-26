import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'Mahkota Taiwan | Rasa Indonesia, Hadir di Taiwan',
  description: 'Mahkota Taiwan is an Indonesian food brand based in Taiwan, focused on the production and distribution of ready-to-eat Indonesian specialties.',
  keywords: ['Indonesian food', 'Taiwan', 'halal food', 'Mahkota Taiwan', 'frozen food'],
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
