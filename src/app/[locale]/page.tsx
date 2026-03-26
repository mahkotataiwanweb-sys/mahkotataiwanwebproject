import { setRequestLocale } from 'next-intl/server';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import MarqueeSection from '@/components/sections/MarqueeSection';
import ProductsSection from '@/components/sections/ProductsSection';
import ContactSection from '@/components/sections/ContactSection';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ProductsSection />
      <ContactSection />
    </>
  );
}
