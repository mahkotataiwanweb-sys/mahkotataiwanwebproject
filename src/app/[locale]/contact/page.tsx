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
import SandTexture from '@/components/effects/SandTexture';

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

/* ─── Contact Cards Data ─── */
const contactCards = [
  {
    icon: MapPin,
    label: 'office',
    value: 'No. 83, Liyuan 2nd Street, Linkou District, New Taipei City',
    href: OFFICE_MAPS_URL,
    color: 'bg-red/10',
    hoverHint: 'Open in Maps ↗',
  },
  {
    icon: MapPin,
    label: 'warehouse',
    value: 'No. 53, Lane 216, Nanshi 4th Street, Linkou District, New Taipei City',
    href: WAREHOUSE_MAPS_URL,
    color: 'bg-navy/10',
    hoverHint: 'Open in Maps ↗',
  },
  {
    icon: Phone,
    label: 'phone',
    value: '+886-2-26099118',
    href: 'tel:+886226099118',
    color: 'bg-red/10',
    hoverHint: 'Call now',
  },
  {
    icon: Mail,
    label: 'info.email',
    value: 'mahkotataiwan@gmail.com',
    href: 'mailto:mahkotataiwan@gmail.com',
    color: 'bg-navy/10',
    hoverHint: 'Send email',
  },
];

export default function ContactPage() {
  const t = useTranslations('contact');
  const locale = useLocale();

  /* ─── Refs ─── */
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const contactLeftRef = useRef<HTMLDivElement>(null);
  const contactCardsRef = useRef<HTMLDivElement>(null);
  const hoursSectionRef = useRef<HTMLDivElement>(null);
  const hoursCardRef = useRef<HTMLDivElement>(null);
  const faqHeaderRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  /* ═══════════════════════════════════════════
     GSAP — All animations in a single effect
     ═══════════════════════════════════════════ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── Hero Text Stagger Entrance ── */
      if (heroTextRef.current) {
        gsap.fromTo(
          heroTextRef.current.children,
          { opacity: 0, y: 50, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            stagger: 0.13,
            ease: 'power3.out',
            delay: 0.15,
          }
        );
      }

      /* ── Contact Left Column ── */
      if (contactLeftRef.current) {
        gsap.fromTo(
          contactLeftRef.current.children,
          { opacity: 0, x: -40, filter: 'blur(8px)' },
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: contactSectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Contact Cards Stagger (right side) ── */
      if (contactCardsRef.current) {
        gsap.fromTo(
          contactCardsRef.current.children,
          { opacity: 0, x: 60, filter: 'blur(8px)' },
          {
            opacity: 1,
            x: 0,
            filter: 'blur(0px)',
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: contactCardsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Business Hours Card ── */
      if (hoursCardRef.current) {
        gsap.fromTo(
          hoursCardRef.current,
          { opacity: 0, y: 50, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: hoursSectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── FAQ Header ── */
      if (faqHeaderRef.current) {
        gsap.fromTo(
          faqHeaderRef.current.children,
          { opacity: 0, y: 30, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: faqHeaderRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── FAQ Items Stagger ── */
      if (faqRef.current) {
        gsap.fromTo(
          faqRef.current.querySelectorAll('.faq-item'),
          { opacity: 0, y: 40, filter: 'blur(8px)' },
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

      /* ── Map Section ── */
      if (mapRef.current) {
        gsap.fromTo(
          mapRef.current,
          { opacity: 0, y: 40, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: mapRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── CTA Section ── */
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 40, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
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
      <SandTexture fixed />

      {/* ╔═══════════════════════════════════════════╗
          ║  1. HERO                                   ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={heroRef} className="py-24 sm:py-32 bg-navy relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-cream/70 hover:text-cream text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div ref={heroTextRef} className="text-center">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
              {t('label')}
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3 leading-[1.1]">
              {t('title')}
            </h1>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-cream/70 max-w-lg mx-auto text-sm tracking-wide">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  2. CONTACT CARDS — Premium 2-Col Layout  ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={contactSectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — Heading + Socials */}
            <div ref={contactLeftRef} className="lg:sticky lg:top-32">
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
                Reach Out
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3 leading-tight">
                Get in Touch
              </h2>
              <div className="w-16 h-[2px] bg-red mb-4" />
              <p className="text-navy/60 text-sm tracking-wide leading-relaxed max-w-md mb-10">
                Whether you have questions about our products, partnerships, or services — we&apos;d love to hear from you. Reach out through any of these channels.
              </p>

              {/* Social Links */}
              <div>
                <p className="text-navy font-semibold text-sm mb-4">{t('followUs')}</p>
                <div className="flex gap-4">
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

            {/* Right — 2x2 Contact Cards Grid */}
            <div ref={contactCardsRef} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {contactCards.map((card) => {
                const Icon = card.icon;
                return (
                  <a
                    key={card.label}
                    href={card.href}
                    target={card.href.startsWith('http') ? '_blank' : undefined}
                    rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group bg-white rounded-3xl p-7 shadow-[0_4px_30px_rgba(0,48,72,0.06)] hover:shadow-[0_12px_40px_rgba(0,48,72,0.12)] hover:-translate-y-1 transition-all duration-400 cursor-pointer border border-navy/[0.04]"
                  >
                    <div className={`w-[52px] h-[52px] rounded-2xl ${card.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-red" />
                    </div>
                    <h4 className="font-semibold text-navy text-sm mb-2">{t(card.label)}</h4>
                    <p className="text-navy/55 text-sm leading-relaxed group-hover:text-navy/80 transition-colors duration-300">
                      {card.value}
                    </p>
                    <p className="text-red/50 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                      {card.hoverHint}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  3. BUSINESS HOURS — Navy Dark Section     ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={hoursSectionRef} className="py-24 sm:py-32 bg-navy relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Availability</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">Business Hours</h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
          </div>

          {/* Glass Card */}
          <div ref={hoursCardRef}>
            <div className="bg-white/[0.06] backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-white/[0.08] relative overflow-hidden">
              {/* Decorative glow inside card */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-red/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
                  <Clock className="w-6 h-6 text-red/80" />
                </div>

                <div className="space-y-1">
                  {businessHours.map((item) => (
                    <div
                      key={item.day}
                      className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0"
                    >
                      <span className="font-semibold text-white text-sm sm:text-base">{item.day}</span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${item.open ? 'bg-green-400' : 'bg-red/60'}`}
                        />
                        <span
                          className={`text-sm sm:text-base font-medium ${
                            item.open ? 'text-white/70' : 'text-red/70'
                          }`}
                        >
                          {item.hours}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-5 border-t border-white/[0.06]">
                  <p className="text-white/30 text-xs text-center">
                    * Taiwan Standard Time (GMT+8) · Closed on national holidays
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  4. FAQ — Premium Accordion               ║
          ╚═══════════════════════════════════════════╝ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        <div className="absolute top-20 right-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-3xl mx-auto px-6">
          {/* Section Header */}
          <div ref={faqHeaderRef} className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Got Questions?</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              Find quick answers to common questions about our products and services
            </p>
          </div>

          {/* FAQ Items */}
          <div ref={faqRef} className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  5. GOOGLE MAPS                            ║
          ╚═══════════════════════════════════════════╝ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
        <div className="absolute bottom-20 left-0 w-80 h-80 rounded-full bg-red/5 blur-3xl" />

        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">Find Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">Our Location</h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              Visit our office in Linkou, New Taipei City
            </p>
          </div>

          <div ref={mapRef}>
            <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-[0_4px_30px_rgba(0,48,72,0.08)] border border-navy/[0.04] overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.5!2d121.37!3d25.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDA0JzEyLjAiTiAxMjHCsDIyJzEyLjAiRQ!5e0!3m2!1sen!2stw!4v1"
                width="100%"
                height="480"
                style={{ border: 0, borderRadius: '1.25rem' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mahkota Taiwan Office Location"
                className="w-full"
              />

              {/* Location Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 mt-2">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy text-base">Mahkota Taiwan Office</p>
                    <p className="text-navy/50 text-sm">
                      No. 83, Liyuan 2nd Street, Linkou District, New Taipei City
                    </p>
                  </div>
                </div>
                <a
                  href={OFFICE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-red hover:text-red/80 text-sm font-semibold transition-colors duration-300 whitespace-nowrap bg-red/5 hover:bg-red/10 px-5 py-2.5 rounded-full"
                >
                  Get Directions
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  6. CTA                                    ║
          ╚═══════════════════════════════════════════╝ */}
      <section className="py-24 sm:py-32 bg-navy relative overflow-hidden">
        <div ref={ctaRef} className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <div className="w-[72px] h-[72px] rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8">
            <Handshake className="w-9 h-9 text-red/80" />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
            Interested in Becoming a Partner?
          </h2>
          <p className="text-cream/70 text-sm tracking-wide mb-10 max-w-lg mx-auto">
            Join 300+ stores across Taiwan selling Mahkota Taiwan products
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:mahkotataiwan@gmail.com?subject=Partnership%20Inquiry"
              className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red/90 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl text-base"
            >
              Contact Our Team
              <ChevronRight className="w-5 h-5" />
            </a>
            <a
              href="tel:+886226099118"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/30 text-base"
            >
              <Phone className="w-4 h-4" />
              Call Us Now
            </a>
          </div>

          <p className="text-cream/25 text-xs mt-10">
            We typically respond to partnership inquiries within 2 business days
          </p>
        </div>
      </section>
    </div>
  );
}
