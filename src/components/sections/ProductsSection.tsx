'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Package } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// Static placeholder data
const categories = [
  { id: 'all', name: 'All Products', icon: '✨' },
  { id: 'abon', name: 'Abon Sapi', icon: '🥩' },
  { id: 'bakso', name: 'Bakso & Pentol', icon: '🍡' },
  { id: 'cita-rasa', name: 'Cita Rasa Indonesia', icon: '🍜' },
  { id: 'nasi', name: 'Nasi Rempah', icon: '🍚' },
  { id: 'snack', name: 'Snack', icon: '🍘' },
];

const products = [
  { id: '1', name: 'Abon Original', category: 'abon' },
  { id: '2', name: 'Abon Bawang Goreng', category: 'abon' },
  { id: '3', name: 'Abon Rumput Laut Wijen', category: 'abon' },
  { id: '4', name: 'Bakso Biasa', category: 'bakso' },
  { id: '5', name: 'Bakso Urat', category: 'bakso' },
  { id: '6', name: 'Bakso Iga', category: 'bakso' },
  { id: '7', name: 'Bakso Mercon', category: 'bakso' },
  { id: '8', name: 'Bakso Beranak', category: 'bakso' },
  { id: '9', name: 'Pentol Bakso', category: 'bakso' },
  { id: '10', name: 'Pentol Mercon', category: 'bakso' },
  { id: '11', name: 'Baso Aci', category: 'cita-rasa' },
  { id: '12', name: 'Baso Cabe Ijo', category: 'cita-rasa' },
  { id: '13', name: 'Cilok', category: 'cita-rasa' },
  { id: '14', name: 'Cireng Rujak', category: 'cita-rasa' },
  { id: '15', name: 'Cuanki Soto', category: 'cita-rasa' },
  { id: '16', name: 'Korean Spicy Cheese', category: 'cita-rasa' },
  { id: '17', name: 'Sambal Petis Instant', category: 'cita-rasa' },
  { id: '18', name: 'Seblak', category: 'cita-rasa' },
  { id: '19', name: 'Nasi Biryani', category: 'nasi' },
  { id: '20', name: 'Nasi Kebuli', category: 'nasi' },
  { id: '21', name: 'Basreng', category: 'snack' },
  { id: '22', name: 'Cimol', category: 'snack' },
  { id: '23', name: 'Keripik Singkong Kriwil', category: 'snack' },
  { id: '24', name: 'Keripik Original', category: 'snack' },
  { id: '25', name: 'Keripik Pedas', category: 'snack' },
  { id: '26', name: 'Keripik Sambal Matah', category: 'snack' },
];

export default function ProductsSection() {
  const t = useTranslations('products');
  const [activeCategory, setActiveCategory] = useState('all');
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(headerRef.current.children,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
            scrollTrigger: { trigger: headerRef.current, start: 'top 85%', toggleActions: 'play none none reverse' }
          }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="products" ref={sectionRef} className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-navy/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
            {t('label')}
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy mb-4">
            {t('title')}
          </h2>
          <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          <p className="text-navy/60 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${activeCategory === cat.id
                  ? 'bg-navy text-white shadow-lg shadow-navy/20'
                  : 'bg-cream text-navy/70 hover:bg-cream-dark hover:text-navy'
                }
              `}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="group"
              >
                <div className="bg-cream rounded-2xl overflow-hidden hover-lift premium-shadow">
                  {/* Image Placeholder */}
                  <div className="aspect-square bg-gradient-to-br from-cream to-cream-dark flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <Package className="w-12 h-12 text-navy/20 mx-auto mb-2" />
                      <p className="text-navy/30 text-xs">{t('productImage')}</p>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/5 transition-colors duration-500" />
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <span className="text-xs text-red/80 font-medium uppercase tracking-wider">
                      {categories.find(c => c.id === product.category)?.name || ''}
                    </span>
                    <h3 className="font-heading text-lg font-semibold text-navy mt-1 group-hover:text-red transition-colors duration-300">
                      {product.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
