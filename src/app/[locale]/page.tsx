import { setRequestLocale } from 'next-intl/server';
import HeroSlider from '@/components/sections/HeroSlider';
import MarqueeSection from '@/components/sections/MarqueeSection';
import ProductsShowcase from '@/components/sections/ProductsShowcase';
import RecipesSection from '@/components/sections/RecipesSection';
import MomentsSection from '@/components/sections/MomentsSection';
import EventsSection from '@/components/sections/EventsSection';
import WhereToBuySection from '@/components/sections/WhereToBuySection';
import AboutSection from '@/components/sections/AboutSection';
import ContactSection from '@/components/sections/ContactSection';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSlider />
      <MarqueeSection />
      <ProductsShowcase />
      <RecipesSection />
      <MomentsSection />
      <EventsSection />
      <WhereToBuySection />
      <AboutSection />
      <ContactSection />
    </>
  );
}
