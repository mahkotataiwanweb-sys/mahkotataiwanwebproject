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
  ChevronDown,
  HelpCircle,
  Handshake,
  ChevronRight,
  Truck,
  ShoppingBag,
  Users,
  Package,
  Sparkles,
} from 'lucide-react';
import SandTexture from '@/components/effects/SandTexture';
import HeroBackground from '@/components/effects/HeroBackground';

function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.631-.63.631h-2.386c-.345 0-.627-.282-.627-.631V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.627-.631.627-.346 0-.626-.283-.626-.627V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.627-.631.627-.345 0-.627-.283-.627-.627V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.627H4.917c-.345 0-.63-.282-.63-.627V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .349-.281.631-.629.631M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

gsap.registerPlugin(ScrollTrigger);

/* ── LineReveal: professional line-by-line cascade reveal ── */
function LineReveal({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[]>([]);
  const measured = useRef(false);

  useEffect(() => {
    if (!containerRef.current || measured.current) return;
    const el = containerRef.current;
    const words = text.split(' ');

    const measurer = document.createElement('p');
    measurer.className = className || '';
    measurer.style.cssText = 'visibility:hidden;position:absolute;top:0;left:0;right:0;pointer-events:none;';
    el.parentElement?.appendChild(measurer);

    const detectedLines: string[] = [];
    let currentLine = '';
    let lastTop = -1;

    words.forEach((word) => {
      measurer.innerHTML = '';
      const testWords = currentLine ? (currentLine + ' ' + word).split(' ') : [word];
      testWords.forEach((w, wi) => {
        if (wi > 0) measurer.appendChild(document.createTextNode(' '));
        const span = document.createElement('span');
        span.textContent = w;
        measurer.appendChild(span);
      });
      const spans = measurer.querySelectorAll('span');
      const lastSpan = spans[spans.length - 1];
      const top = lastSpan.offsetTop;

      if (lastTop === -1) {
        lastTop = top;
        currentLine = word;
      } else if (top > lastTop) {
        detectedLines.push(currentLine);
        currentLine = word;
        lastTop = top;
      } else {
        currentLine = currentLine + ' ' + word;
      }
    });
    if (currentLine) detectedLines.push(currentLine);
    measurer.remove();

    measured.current = true;
    setLines(detectedLines);
  }, [text, className]);

  useEffect(() => {
    if (!containerRef.current || lines.length === 0) return;
    const lineEls = containerRef.current.querySelectorAll('.lr-line');
    if (lineEls.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineEls,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });
    return () => ctx.revert();
  }, [lines]);

  return (
    <div ref={containerRef} className={className}>
      {lines.length === 0 ? (
        <p style={{ visibility: 'hidden' }}>{text}</p>
      ) : (
        lines.map((line, i) => (
          <span
            key={i}
            className="lr-line"
            style={{ display: 'block', opacity: 0, willChange: 'transform, opacity, filter' }}
          >
            {line}
          </span>
        ))
      )}
    </div>
  );
}

const socials = [
  { icon: Music2, href: 'https://www.tiktok.com/@mahkotataiwan', label: 'TikTok' },
  { icon: Facebook, href: 'https://www.facebook.com/share/1DhYShuL19/?mibextid=wwXIfr', label: 'Facebook' },
  { icon: Instagram, href: 'https://www.instagram.com/mahkotatw', label: 'Instagram' },
  { icon: LineIcon, href: 'https://line.me/ti/p/@mahkotataiwan', label: 'LINE' },
];

// Google Maps links
const OFFICE_MAPS_URL = 'https://www.google.com/maps/search/No.+83,+Liyuan+2nd+Street,+Linkou+District,+New+Taipei+City';
const WAREHOUSE_MAPS_URL = 'https://www.google.com/maps/search/No.+53,+Lane+216,+Nanshi+4th+Street,+Linkou+District,+New+Taipei+City';

const businessHours = [
  { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM', open: true },
  { day: 'Saturday', hours: '9:00 AM - 1:00 PM', open: true },
  { day: 'Sunday', hours: 'Closed', open: false },
];

/* ── Clock / Arc geometry ── */
const CLK = 400;
const CC = CLK / 2;
const toRad = (d: number) => (d * Math.PI) / 180;
const hToA = (h: number) => h * 30 - 90;
const pol = (a: number, r: number) => ({
  x: CC + r * Math.cos(toRad(a)),
  y: CC + r * Math.sin(toRad(a)),
});
const mkArc = (h1: number, h2: number, r: number) => {
  const a1 = hToA(h1), a2 = hToA(h2);
  const p1 = pol(a1, r), p2 = pol(a2, r);
  let span = a2 - a1;
  if (span <= 0) span += 360;
  return `M ${p1.x.toFixed(1)},${p1.y.toFixed(1)} A ${r},${r} 0 ${span > 180 ? 1 : 0},1 ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
};

/* ── Clock face image sizing ── */
const FACE_SIZE = 310;          // clock face image size in SVG units
const FACE_OFFSET = (CLK - FACE_SIZE) / 2;  // center the image

/* ── Arc rings — sit just outside the visible clock face ── */
const GREEN_ARC_R = 168;      // Mon–Fri outer ring
const YELLOW_ARC_R = 160;     // Saturday inner ring (tiny gap from clock face)
const GREEN_SW = 9;           // green stroke width
const YELLOW_SW = 7;          // yellow stroke width

// Mon–Fri: 9 AM → 6 PM (270° arc, outer ring)
const GREEN_D = mkArc(9, 6, GREEN_ARC_R);
// Saturday: 9 AM → 1 PM (120° arc, inner ring)
const YELLOW_D = mkArc(9, 1, YELLOW_ARC_R);
// Label midpoints
const greenMid = pol(hToA(3.5), GREEN_ARC_R);
const yellowMid = pol(hToA(11), YELLOW_ARC_R);


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
  const contactSectionRef = useRef<HTMLDivElement>(null);
  const contactLeftRef = useRef<HTMLDivElement>(null);
  const contactCardsRef = useRef<HTMLDivElement>(null);
  const hoursSectionRef = useRef<HTMLDivElement>(null);
  const hoursHeaderRef = useRef<HTMLDivElement>(null);
  const hoursCardRef = useRef<HTMLDivElement>(null);
  const hoursLegendRef = useRef<HTMLDivElement>(null);
  const hoursFootnoteRef = useRef<HTMLDivElement>(null);
  const faqHeaderRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const greenArcRef = useRef<SVGPathElement>(null);
  const yellowArcRef = useRef<SVGPathElement>(null);
  const greenLabelRef = useRef<SVGGElement>(null);
  const yellowLabelRef = useRef<SVGGElement>(null);

  /* ── Live Taiwan clock state ── */
  const [clockTime, setClockTime] = useState<{ h: number; m: number; s: number } | null>(null);

  const hours12 = clockTime ? clockTime.h % 12 : 0;
  const mins = clockTime?.m ?? 0;
  const secs = clockTime?.s ?? 0;
  const secondAngle = secs * 6;
  const minuteAngle = mins * 6 + secs * 0.1;
  const hourAngle = hours12 * 30 + mins * 0.5;

  /* ═══════════════════════════════════════════
     GSAP — All animations in a single effect
     ═══════════════════════════════════════════ */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* ── Hero Text — Premium Staggered Blur Reveal ── */
      gsap.from('.hero-text', {
        opacity: 0,
        y: 60,
        scale: 0.9,
        duration: 1.6,
        stagger: 0.25,
        ease: 'power4.out',
      });

      /* ── Contact Left Column — all lines appear together, slow & dramatic ── */
      if (contactLeftRef.current) {
        gsap.fromTo(
          contactLeftRef.current.children,
          { opacity: 0, x: -40 },
          {
            opacity: 1,
            x: 0,
            duration: 2.2,
            stagger: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: contactSectionRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Contact Cards — One-time flip entrance, top row then bottom row ── */
      if (contactCardsRef.current) {
        const cards = contactCardsRef.current.children;
        // Disable CSS transitions and hide with flip
        gsap.set(cards, {
          opacity: 0,
          rotateY: -90,
          transformPerspective: 1200,
          transformOrigin: 'center center',
          willChange: 'transform, opacity',
          transition: 'none',
        });

        const delays = [0.6, 1.0, 2.0, 2.8];

        ScrollTrigger.create({
          trigger: contactCardsRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            Array.from(cards).forEach((card, i) => {
              gsap.to(card, {
                opacity: 1,
                rotateY: 0,
                duration: 2.0,
                ease: 'power2.out',
                delay: delays[i],
                onComplete: () => {
                  // Re-enable CSS transitions for hover effects after GSAP is done
                  gsap.set(card, { clearProps: 'transition,willChange' });
                },
              });
            });
          },
        });
      }

      /* ── Business Hours — Premium Text Reveal at top 60% ── */
      if (hoursHeaderRef.current) {
        // Character-by-character reveal for "Business Hours"
        const chars = hoursHeaderRef.current.querySelectorAll('.bh-char');
        if (chars.length > 0) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 80, rotateX: -90 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 1.2,
              stagger: 0.06,
              ease: 'back.out(1.4)',
              scrollTrigger: {
                trigger: hoursHeaderRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // "Availability" label — slide up + fade
        const availLabel = hoursHeaderRef.current.querySelector('.bh-reveal-item');
        if (availLabel) {
          gsap.fromTo(
            availLabel,
            { opacity: 0, y: 30, letterSpacing: '0.8em' },
            {
              opacity: 1,
              y: 0,
              letterSpacing: '0.3em',
              duration: 1.4,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: hoursHeaderRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Red line — scale from center
        const redLine = hoursHeaderRef.current.querySelectorAll('.bh-reveal-item')[1];
        if (redLine) {
          gsap.fromTo(
            redLine,
            { opacity: 0, scaleX: 0 },
            {
              opacity: 1,
              scaleX: 1,
              duration: 1.2,
              delay: 0.8,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: hoursHeaderRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      }

      /* ── Business Hours Clock ── */
      if (hoursCardRef.current) {
        gsap.fromTo(
          hoursCardRef.current,
          { opacity: 0, y: 60, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: hoursSectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Business Hours Legend — stagger items ── */
      if (hoursLegendRef.current) {
        gsap.fromTo(
          hoursLegendRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1.0,
            stagger: 0.25,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: hoursLegendRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Business Hours Footnote — gentle reveal ── */
      if (hoursFootnoteRef.current) {
        gsap.fromTo(
          hoursFootnoteRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 1.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: hoursFootnoteRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Business Hour Arcs — Slow Dramatic Loop ── */
      if (greenArcRef.current && yellowArcRef.current && greenLabelRef.current && yellowLabelRef.current) {
        const gArc = greenArcRef.current;
        const yArc = yellowArcRef.current;
        const gLabel = greenLabelRef.current;
        const yLabel = yellowLabelRef.current;

        // Get ACTUAL path lengths for reliable stroke-draw animation
        const gLen = gArc.getTotalLength();
        const yLen = yArc.getTotalLength();

        // Set up stroke-dasharray = full length, offset = full length (hidden)
        gsap.set(gArc, { strokeDasharray: gLen, strokeDashoffset: gLen, opacity: 0 });
        gsap.set(yArc, { strokeDasharray: yLen, strokeDashoffset: yLen, opacity: 0 });
        gsap.set([gLabel, yLabel], { opacity: 0, scale: 0.7 });

        const arcTl = gsap.timeline({ repeat: -1, repeatDelay: 1, paused: true });

        // ── Reset: hide arcs fully (opacity 0) to prevent dot glitch ──
        arcTl.set(gArc, { strokeDashoffset: gLen, opacity: 0 });
        arcTl.set(yArc, { strokeDashoffset: yLen, opacity: 0 });
        arcTl.set([gLabel, yLabel], { opacity: 0, scale: 0.7 });

        // ── Show blue arc the instant it starts drawing ──
        arcTl.set(gArc, { opacity: 1 }, 0);
        // ── Navy blue draws — 6s constant speed ──
        arcTl.to(gArc, { strokeDashoffset: 0, duration: 6, ease: 'none' }, 0);

        // ── Show red arc the instant it starts drawing ──
        arcTl.set(yArc, { opacity: 1 }, 1.0);
        // ── Red starts 1s after blue, 5s duration — BOTH FINISH at t=6 ──
        arcTl.to(yArc, { strokeDashoffset: 0, duration: 5, ease: 'none' }, 1.0);

        // ── Labels pop up at exactly t=3 ──
        arcTl.to(gLabel, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, 3);
        arcTl.to(yLabel, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, 3);

        // ── Hold both visible for 3.5s after arcs complete ──
        arcTl.to({}, { duration: 3.5 }, 6);

        // ── Both fade out together ──
        arcTl.to([gArc, yArc, gLabel, yLabel], {
          opacity: 0,
          duration: 2.3,
          ease: 'power2.inOut',
        });

        // Play when section scrolls into view
        ScrollTrigger.create({
          trigger: hoursSectionRef.current,
          start: 'top 60%',
          onEnter: () => arcTl.restart(),
        });
      }

      /* ── FAQ Header — Dramatic Reveal ── */
      if (faqHeaderRef.current) {
        gsap.fromTo(
          faqHeaderRef.current.children,
          { opacity: 0, y: 60, scale: 0.8, filter: 'blur(2px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 2.2,
            stagger: 0.2,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: faqHeaderRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── FAQ Items Stagger — Dramatic Reveal ── */
      if (faqRef.current) {
        gsap.fromTo(
          faqRef.current.querySelectorAll('.faq-item'),
          { opacity: 0, y: 70, scale: 0.85, filter: 'blur(2px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 4,
            stagger: 0.4,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: faqRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      /* ── Map Section — Slow Dramatic Reveal ── */
      if (mapRef.current) {
        gsap.fromTo(
          mapRef.current,
          { opacity: 0, y: 60, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 2.3,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: mapRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  /* ── Live clock tick (Taiwan time UTC+8) ── */
  useEffect(() => {
    const tick = () => {
      const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
      );
      setClockTime({
        h: now.getHours(),
        m: now.getMinutes(),
        s: now.getSeconds(),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <SandTexture fixed />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      ` }} />

      {/* ╔═══════════════════════════════════════════╗
          ║  1. HERO                                   ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={heroRef} className="relative bg-gradient-to-br from-[#003048] via-[#003048] to-[#002236] pt-32 pb-24 overflow-hidden">
        <HeroBackground />

        {/* Extra hero decorations */}
        <motion.div
          className="absolute top-16 left-[10%] pointer-events-none"
          animate={{ y: [0, -10, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="w-10 h-10 text-cream/20" />
        </motion.div>
        <motion.div
          className="absolute bottom-10 right-[15%] pointer-events-none"
          animate={{ y: [0, 8, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-3 h-3 rounded-full bg-red/30" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Back link */}
          <div className="hero-text mb-8">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-cream/60 hover:text-cream transition-colors text-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t('backToHome')}
            </Link>
          </div>

          <motion.span
            className="hero-text inline-block text-base sm:text-lg font-bold tracking-[0.35em] uppercase mb-5 px-6 py-2 rounded-full border border-cream/20"
            style={{
              background: 'linear-gradient(135deg, rgba(193,33,38,0.15), rgba(250,237,211,0.1))',
              color: '#FAEDD3',
              textShadow: '0 0 20px rgba(250,237,211,0.4), 0 0 40px rgba(193,33,38,0.2)',
            }}
            animate={{ opacity: [0.85, 1, 0.85], scale: [0.98, 1, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ✦ {t('label')} ✦
          </motion.span>
          <h1 className="hero-text text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-5">
            {t('title')}
          </h1>
          <p className="hero-text text-cream/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Animated separator */}
          <div className="hero-text relative mt-8 flex items-center justify-center gap-3">
            <motion.div
              className="w-12 h-px bg-gradient-to-r from-transparent to-red/60"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 1.5, delay: 1.2, ease: 'power4.out' }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-red"
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 1.8 }}
            />
            <motion.div
              className="w-12 h-px bg-gradient-to-l from-transparent to-red/60"
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 1.5, delay: 1.2, ease: 'power4.out' }}
            />
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  2. CONTACT CARDS — Premium 2-Col Layout  ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={contactSectionRef} className="py-24 sm:py-32 bg-cream relative overflow-hidden">
<div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left — Heading + Socials */}
            <div ref={contactLeftRef} className="lg:sticky lg:top-32">
              <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">
                {t('label')}
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3 leading-tight">
                {t('title')}
              </h2>
              <div className="w-16 h-[2px] bg-red mb-4" />
              <LineReveal
                text={t('subtitle')}
                className="text-navy/60 text-base sm:text-lg tracking-wide leading-relaxed max-w-md mb-10"
              />

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
                        className="w-[58px] h-[58px] rounded-full border-2 border-navy/15 flex items-center justify-center text-navy/60 hover:bg-red hover:text-white hover:border-red transition-all duration-300"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-6 h-6" />
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
          ║  3. BUSINESS HOURS — Analog Clock Design   ║
          ╚═══════════════════════════════════════════╝ */}
      <section ref={hoursSectionRef} className="py-24 sm:py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          {/* Section Header — Premium Scroll-Triggered Text Reveal */}
          <div ref={hoursHeaderRef} className="text-center mb-14">
            <p className="bh-reveal-item text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3" style={{ opacity: 0 }}>{t('businessHours')}</p>
            <h2 className="bh-reveal-title font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3 overflow-hidden">
              {t('businessHours').split("").map((ch, i) => (
                <span key={i} className="bh-char" style={{ display: 'inline-block', opacity: 0, whiteSpace: ch === ' ' ? 'pre' : undefined }}>{ch}</span>
              ))}
            </h2>
            <div className="bh-reveal-item w-16 h-[2px] bg-red mx-auto mb-4" style={{ opacity: 0, transform: 'scaleX(0)' }} />
          </div>

          {/* Clock with animated arcs — moon clock face image + SVG arcs */}
          <div ref={hoursCardRef} className="flex justify-center">
            <div
              className="relative mx-auto"
              style={{ width: 'min(420px, 85vw)', aspectRatio: '1' }}
            >
              <svg className="w-full h-full" viewBox={`0 0 ${CLK} ${CLK}`}>
                <defs>
                  {/* Subtle shadow for clock hands */}
                  <filter id="handShadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.18)" />
                  </filter>
                  {/* Red glow for second hand */}
                  <filter id="secGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(193,33,38,0.3)" />
                  </filter>
                  {/* Soft glow for arcs */}
                  <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Dramatic shadow for the clock face */}
                  <filter id="clockShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#000000" floodOpacity="0.45" />
                    <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
                  </filter>
                </defs>

                {/* ── Moon clock face image with dramatic shadow ── */}
                <image
                  href="/images/clock-face.png"
                  x={FACE_OFFSET} y={FACE_OFFSET}
                  width={FACE_SIZE} height={FACE_SIZE}
                  preserveAspectRatio="xMidYMid meet"
                  filter="url(#clockShadow)"
                />









                {/* ── Green arc (Mon-Fri 9 AM → 6 PM) ── */}
                <path
                  ref={greenArcRef}
                  d={GREEN_D}
                  fill="none"
                  stroke="rgba(0,48,72,0.85)"
                  strokeWidth={GREEN_SW}
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                />

                {/* ── Yellow arc (Saturday 9 AM → 1 PM) ── */}
                <path
                  ref={yellowArcRef}
                  d={YELLOW_D}
                  fill="none"
                  stroke="rgba(193,33,38,0.85)"
                  strokeWidth={YELLOW_SW}
                  strokeLinecap="round"
                  filter="url(#arcGlow)"
                />

                {/* ── Green arc label ── */}
                <g ref={greenLabelRef} style={{ opacity: 0 }}>
                  <rect
                    x={greenMid.x - 40} y={greenMid.y - 12}
                    width={80} height={24} rx={12}
                    fill="rgba(0,48,72,0.92)"
                  />
                  <text
                    x={greenMid.x} y={greenMid.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="11" fontWeight="700" fill="#ffffff"
                    letterSpacing="0.3"
                  >
                    Mon – Fri
                  </text>
                </g>

                {/* ── Yellow arc label ── */}
                <g ref={yellowLabelRef} style={{ opacity: 0 }}>
                  <rect
                    x={yellowMid.x - 36} y={yellowMid.y - 11}
                    width={72} height={22} rx={11}
                    fill="rgba(193,33,38,0.92)"
                  />
                  <text
                    x={yellowMid.x} y={yellowMid.y}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize="10.5" fontWeight="700" fill="#ffffff"
                    letterSpacing="0.3"
                  >
                    Saturday
                  </text>
                </g>

                {/* ── Hour hand — tapered elegant ── */}
                <g transform={`rotate(${hourAngle}, ${CC}, ${CC})`} filter="url(#handShadow)">
                  <path
                    d={`M ${CC - 3.8} ${CC + 12} Q ${CC - 4.2} ${CC + 6} ${CC - 3} ${CC} L ${CC - 1.2} ${CC - 72} Q ${CC} ${CC - 78} ${CC + 1.2} ${CC - 72} L ${CC + 3} ${CC} Q ${CC + 4.2} ${CC + 6} ${CC + 3.8} ${CC + 12} Z`}
                    fill="#1a1a1a"
                  />
                </g>

                {/* ── Minute hand — tapered slim ── */}
                <g transform={`rotate(${minuteAngle}, ${CC}, ${CC})`} filter="url(#handShadow)">
                  <path
                    d={`M ${CC - 2.5} ${CC + 12} Q ${CC - 3} ${CC + 6} ${CC - 2} ${CC} L ${CC - 0.8} ${CC - 102} Q ${CC} ${CC - 108} ${CC + 0.8} ${CC - 102} L ${CC + 2} ${CC} Q ${CC + 3} ${CC + 6} ${CC + 2.5} ${CC + 12} Z`}
                    fill="#2a2a2a"
                  />
                </g>

                {/* ── Second hand — thin red with counterweight dot & glow ── */}
                <g transform={`rotate(${secondAngle}, ${CC}, ${CC})`} filter="url(#secGlow)">
                  <line
                    x1={CC} y1={CC + 20}
                    x2={CC} y2={CC - 118}
                    stroke="#C12126" strokeWidth={1.2} strokeLinecap="round"
                  />
                  <circle cx={CC} cy={CC + 16} r={3} fill="#C12126" opacity={0.5} />
                </g>

                {/* ── Center pivot — layered concentric circles ── */}
                <circle cx={CC} cy={CC} r={7.5} fill="#1a1a1a" />
                <circle cx={CC} cy={CC} r={4.5} fill="#C12126" />
                <circle cx={CC} cy={CC} r={2} fill="#fff" />
              </svg>
            </div>
          </div>

          {/* Business-hours legend */}
          <div ref={hoursLegendRef} className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10 mt-10">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[3px] rounded-full bg-navy" />
              <span className="text-navy text-sm font-semibold">{t('mondayToFriday')}</span>
              <span className="text-navy/50 text-sm">{t('weekdayHours')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-[3px] rounded-full bg-red" />
              <span className="text-navy text-sm font-semibold">{t('saturday')}</span>
              <span className="text-navy/50 text-sm">{t('saturdayHours')}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-[3px] rounded-full bg-red/40" />
              <span className="text-navy text-sm font-semibold">{t('sunday')}</span>
              <span className="text-navy/50 text-sm">{t('sundayStatus')}</span>
            </div>
          </div>

          {/* Footnote */}
          <div ref={hoursFootnoteRef} className="text-center mt-8">
            <p className="text-navy/40 text-xs">
              {t('timezoneNote')}
            </p>
          </div>
        </div>
      </section>


      {/* ╔═══════════════════════════════════════════╗
          ║  4. FAQ — Premium Accordion               ║
          ╚═══════════════════════════════════════════╝ */}
      <section className="py-24 sm:py-32 bg-cream relative overflow-hidden">
<div className="max-w-3xl mx-auto px-6">
          {/* Section Header */}
          <div ref={faqHeaderRef} className="text-center mb-14">
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">{t('faq.title')}</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">
              {t('faq.title')}
            </h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              {t('subtitle')}
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
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header — Premium Reveal */}
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.22, 0.68, 0, 1] }}
          >
            <p className="text-red text-sm tracking-[0.3em] uppercase font-semibold mb-3">{t('label')}</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight mb-3">{t('title')}</h2>
            <div className="w-16 h-[2px] bg-red mx-auto mb-4" />
            <p className="text-navy/50 max-w-lg mx-auto text-sm tracking-wide">
              {t('subtitle')}
            </p>
          </motion.div>

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
                    <p className="font-semibold text-navy text-base">{t('officeTitle')}</p>
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
                  {t('getDirections')}
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ╔═══════════════════════════════════════════╗
          ║  6. CTA — Premium Floating Box             ║
          ╚═══════════════════════════════════════════╝ */}
      <section className="py-20 sm:py-28 bg-cream relative overflow-hidden">
        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 2.3, ease: [0.22, 0.68, 0, 1] }}
          className="max-w-4xl mx-auto px-6 sm:px-8"
        >
          <div className="relative bg-navy rounded-[2rem] p-10 sm:p-14 lg:p-16 text-center overflow-hidden shadow-[0_40px_100px_-25px_rgba(0,48,72,0.5),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
            style={{ animation: 'floatSubtle 6s ease-in-out infinite' }}
          >
            {/* Glossy shine overlays */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.1] via-transparent to-white/[0.02] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            
            {/* Animated gradient orbs */}


{/* Moving shimmer effect */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" style={{ animation: 'shimmerSlide 4s ease-in-out infinite' }} />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-[72px] h-[72px] rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-white/[0.08]"
              >
                <Handshake className="w-9 h-9 text-red/80" />
              </motion.div>

              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-5 leading-tight">
                {t('ctaTitle')}
              </h2>
              <p className="text-cream/70 text-sm tracking-wide mb-10 max-w-lg mx-auto">
                {t('ctaDescription')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:mahkotataiwan@gmail.com?subject=Partnership%20Inquiry"
                  className="inline-flex items-center justify-center gap-2 bg-red hover:bg-red/90 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red/20 text-base"
                >
                  {t('ctaButtonEmail')}
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a
                  href="tel:+886226099118"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 border border-white/20 hover:border-white/30 text-base backdrop-blur-sm"
                >
                  <Phone className="w-4 h-4" />
                  {t('ctaButtonPhone')}
                </a>
              </div>

              <p className="text-cream/25 text-xs mt-10">
                {t('ctaFootnote')}
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
