'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEditableT } from '@/hooks/useEditableT';
import Image from 'next/image';
import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const t = useEditableT('hero');
  const sectionRef = useRef<HTMLElement>(null);
  const taglineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!taglineRef.current) return;
    const text = taglineRef.current.textContent || '';
    taglineRef.current.innerHTML = '';
    
    const chars = text.split('').map((char) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(60px)';
      taglineRef.current!.appendChild(span);
      return span;
    });

    gsap.to(chars, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.04,
      ease: 'power3.out',
      delay: 2.0, // After loading screen
    });
  }, []);

  const scrollToAbout = () => {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" ref={sectionRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-cream">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">

<div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-red/30" />
        <div className="absolute top-2/3 left-1/4 w-3 h-3 rounded-full bg-navy/20" />
        <div className="absolute top-1/2 left-[60%] w-1.5 h-1.5 rounded-full bg-red/20" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(var(--color-navy) 1px, transparent 1px), linear-gradient(90deg, var(--color-navy) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Crown Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.9, duration: 0.8, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image src="/images/logo.png" alt="Mahkota Taiwan" width={100} height={100} priority className="mx-auto" />
          </motion.div>
        </motion.div>

        {/* Company Name */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="text-sm tracking-[0.3em] uppercase text-navy/60 font-medium mb-4"
        >
          Mahkota Taiwan
        </motion.p>

        {/* Tagline - Letter by letter reveal */}
        <h1
          ref={taglineRef}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-navy leading-tight mb-6"
        >
          {t('tagline')}
        </h1>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.6, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
          className="w-20 h-[2px] bg-red mx-auto mb-6"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.6 }}
          className="text-base sm:text-lg text-navy/60 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('subtitle')}
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 0.6 }}
        >
          <button
            onClick={scrollToAbout}
            className="btn-magnetic inline-flex items-center gap-2 px-8 py-4 bg-red text-white rounded-full text-sm font-semibold tracking-wide uppercase hover:text-white transition-colors duration-500"
          >
            <span>{t('cta')}</span>
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5 }}
        onClick={scrollToAbout}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-navy/40 hover:text-navy/60 transition-colors"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
