'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Music2,
  Clock,
  ChevronDown,
  HelpCircle,
  Handshake,
  ChevronRight,
  Truck,
  ShoppingBag,
  Users,
  Package,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const socials = [
  { icon: Music2, href: 'https://www.tiktok.com/@mahkotataiwan', label: 'TikTok' },
  { icon: Facebook, href: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/mahkotatw', label: 'Instagram' },
];

// Google Maps links
const OFFICE_MAPS_URL = 'https://www.google.com/maps/search/No.+83,+Liyuan+2nd+Street,+Linkou+District,+New+Taipei+City';
const WAREHOUSE_MAPS_URL = 'https://www.google.com/maps/search/No.+53,+Lane+216,+Nanshi+4th+Street,+Linkou+District,+New+Taipei+City';

const businessHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM', open: true },
  { day: 'Saturday', hours: '9:00 AM - 1:00 PM', open: true },
  { day: 'Sunday', hours: 'Closed', open: false },
];

const faqs = [
  {
    icon: ShoppingBag,
    question: 'How can I order Mahkota Taiwan products?',
    answer: 'You can order our products through any of our 300+ partner stores across Taiwan. Check our store locator to find the nearest location, or contact us directly for bulk orders.',
  },
  {
    icon: Truck,
    question: 'Do you offer delivery services?',
    answer: 'Yes! We offer delivery services for bulk and wholesale orders. For individual purchases, please visit any of our partner stores. Contact our team for delivery schedules and minimum order quantities.',
  },
  {
    icon: Handshake,
    question: 'How can I become a retail partner?',
    answer: 'We\'re always looking for new retail partners! Please send us an email at mahkotataiwan@gmail.com or call us at +886-2-26099118 with your store details, and our partnership team will get back to you within 2 business days.',
  },
  {
    icon: Package,
    question: 'What types of products do you distribute?',
    answer: 'We distribute a wide range of authentic Indonesian products including instant noodles, seasonings, sauces, beverages, snacks, cooking essentials, and household items. We carry 26+ carefully selected product lines.',
  },
  {
    icon: Users,
    question: 'Can I request a specific Indonesian product?',
    answer: 'Absolutely! We welcome product suggestions from our community. Please reach out via email or our social media channels with the product details, and we\'ll do our best to source it for you.',
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = faq.icon;

  return (
    <motion.div
      className="faq-item bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-navy/5"
      initial={false}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-6 text-left group"
      >
        <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center shrink-0 group-hover:bg-red/20 transition-colors duration-300">
          <Icon className="w-5 h-5 text-red" />
        </div>
        <span className="font-semibold text-navy text-sm sm:text-base flex-1 pr-4">{faq.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-navy/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pl-20">
              <p className="text-navy/60 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const headerRef = useRef<HTMLDivElement>(null);
  const infoCardsRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // GSAP header animation
  useEffect(() => {
    if (!headerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current!.children,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP staggered info cards animation
  useEffect(() => {
    if (!infoCardsRef.current) return;
    const cards = infoCardsRef.current.children;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: infoCardsRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP social section animation
  useEffect(() => {
    if (!socialRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        socialRef.current!.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: socialRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  // GSAP animations for new sections
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Business hours card
      if (hoursRef.current) {
        gsap.fromTo(
          hoursRef.current,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: hoursRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // FAQ items stagger
      if (faqRef.current) {
        gsap.fromTo(
          faqRef.current.querySelectorAll('.faq-item'),
          { opacity: 0, y: 40, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: faqRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Map section
      if (mapRef.current) {
        gsap.fromTo(
          mapRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: mapRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // CTA section
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-red-dark via-red to-navy pt-32 pb-20 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-navy/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div ref={headerRef}>
            <p className="text-white/70 text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {t('title')}
            </h1>
            <div className="w-20 h-[3px] bg-white/50 mb-6" />
            <p className="text-white/60 max-w-lg text-lg">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Info Cards - 4 cards grid: Office first, then Warehouse */}
        <div ref={infoCardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Office Address (first) */}
          <a
            href={OFFICE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-red/20 transition-colors duration-300">
              <MapPin className="w-5 h-5 text-red group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('office')}</h4>
            <p className="text-navy/60 text-sm group-hover:text-navy transition-colors duration-300">No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</p>
            <p className="text-red/60 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Open in Maps ↗</p>
          </a>

          {/* Warehouse Address (second) */}
          <a
            href={WAREHOUSE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-red/20 transition-colors duration-300">
              <MapPin className="w-5 h-5 text-red group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('warehouse')}</h4>
            <p className="text-navy/60 text-sm group-hover:text-navy transition-colors duration-300">No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City</p>
            <p className="text-red/60 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Open in Maps ↗</p>
          </a>

          {/* Phone */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('phone')}</h4>
            <a
              href="tel:+886226099118"
              className="text-navy/60 text-sm hover:text-red transition-colors duration-300"
            >
              +886-2-26099118
            </a>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl p-6 text-center premium-shadow hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-red" />
            </div>
            <h4 className="font-semibold text-navy text-sm mb-1">{t('info.email')}</h4>
            <a
              href="mailto:mahkotataiwan@gmail.com"
              className="text-navy/60 text-sm hover:text-red transition-colors duration-300 break-all"
            >
              mahkotataiwan@gmail.com
            </a>
          </div>
        </div>

        {/* Social Links */}
        <div ref={socialRef} className="text-center mb-16">
          <p className="text-navy font-semibold text-sm mb-4">{t('followUs')}</p>
          <div className="flex justify-center gap-4">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-12 h-12 rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Business Hours Section */}
      <div className="bg-white/50 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Availability</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy mb-4">Business Hours</h2>
              <div className="w-16 h-[3px] bg-red/40 mx-auto" />
            </motion.div>
          </div>

          <div ref={hoursRef}>
            <motion.div
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-navy/5 relative overflow-hidden"
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-navy/5 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-7 h-7 text-red" />
                </div>

                <div className="space-y-4">
                  {businessHours.map((item) => (
                    <div
                      key={item.day}
                      className="flex items-center justify-between py-3 border-b border-navy/5 last:border-0"
                    >
                      <span className="font-semibold text-navy text-sm sm:text-base">{item.day}</span>
                      <span className={`text-sm sm:text-base font-medium ${item.open ? 'text-navy/70' : 'text-red/70'}`}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-navy/5">
                  <p className="text-navy/40 text-xs text-center">
                    * Taiwan Standard Time (GMT+8) · Closed on national holidays
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Got Questions?</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy mb-4">Frequently Asked Questions</h2>
            <div className="w-16 h-[3px] bg-red/40 mx-auto mb-4" />
            <p className="text-navy/60 text-base max-w-md mx-auto">Find quick answers to common questions about our products and services</p>
          </motion.div>
        </div>

        <div ref={faqRef} className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </div>
      </div>

      {/* Google Maps Section */}
      <div className="bg-white/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Find Us</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy mb-4">Our Location</h2>
              <div className="w-16 h-[3px] bg-red/40 mx-auto mb-4" />
              <p className="text-navy/60 text-base max-w-md mx-auto">Visit our office in Linkou, New Taipei City</p>
            </motion.div>
          </div>

          <div ref={mapRef}>
            <div className="bg-white rounded-3xl p-3 shadow-sm border border-navy/5 overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.5!2d121.37!3d25.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDA0JzEyLjAiTiAxMjHCsDIyJzEyLjAiRQ!5e0!3m2!1sen!2stw!4v1"
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: '1.25rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mahkota Taiwan Office Location"
                className="w-full"
              />
              <div className="flex items-center gap-3 p-4 mt-2">
                <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm">Mahkota Taiwan Office</p>
                  <p className="text-navy/60 text-xs">No. 83, Liyuan 2nd Street, Linkou District, New Taipei City</p>
                </div>
                <a
                  href={OFFICE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-red hover:text-red/80 text-sm font-medium transition-colors duration-300 whitespace-nowrap"
                >
                  Get Directions ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner With Us CTA Section */}
      <div ref={ctaRef} className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-navy via-navy/95 to-red-dark py-20 relative">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-red/10 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-red/5 blur-2xl" />
            {/* Decorative lines */}
            <div className="absolute top-10 left-10 w-20 h-[1px] bg-white/10 rotate-45" />
            <div className="absolute bottom-10 right-10 w-20 h-[1px] bg-white/10 -rotate-45" />
            <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-red/30" />
            <div className="absolute bottom-16 left-20 w-2 h-2 rounded-full bg-white/20" />
          </div>

          <motion.div
            className="max-w-3xl mx-auto px-6 text-center relative z-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Handshake className="w-8 h-8 text-red/80" />
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Interested in Becoming a Partner?
            </h2>
            <p className="text-cream/60 text-lg mb-8 max-w-lg mx-auto">
              Join 300+ stores across Taiwan selling Mahkota Taiwan products
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="mailto:mahkotataiwan@gmail.com?subject=Partnership%20Inquiry"
                className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red/90 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-base"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Contact Our Team
                <ChevronRight className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="tel:+886226099118"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 border border-white/20 text-base"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="w-4 h-4" />
                Call Us Now
              </motion.a>
            </div>

            <p className="text-cream/30 text-xs mt-8">
              We typically respond to partnership inquiries within 2 business days
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
