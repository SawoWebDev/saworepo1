'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import ButtonClear from '../Buttons/ButtonClear';
import { afterPageLoad, prefersReducedMotion } from '@/utils/afterPageLoad';

export default function Hero() {
  const t = useTranslations('home.hero');
  const tc = useTranslations('common');
  const typewriterRef = useRef(null);
  const sentences = t.raw('sentences');

  useEffect(() => {
    const el = typewriterRef.current;
    if (!el) return;

    let n = 0;
    let i = 0;
    let isTyping = true;
    let spans = [];
    let timeout;

    function setupSentence() {
      const current = sentences[n];
      if (!el) return;
      el.innerHTML = current.split('').map((char) => `<span>${char}</span>`).join('');
      spans = el.querySelectorAll('span');
      i = 0;
      isTyping = true;
    }

    function animate() {
      if (!el) return;
      if (isTyping) {
        if (i < spans.length) {
          spans[i].style.opacity = 1;
          i++;
          timeout = setTimeout(animate, 70);
        } else {
          isTyping = false;
          timeout = setTimeout(animate, 900);
        }
      } else if (i > 0) {
        i--;
        spans[i].style.opacity = 0;
        timeout = setTimeout(animate, 50);
      } else {
        n = (n + 1) % sentences.length;
        setupSentence();
        timeout = setTimeout(animate, 500);
      }
    }

    if (prefersReducedMotion()) {
      el.textContent = sentences[0];
      el.style.opacity = 1;
      return;
    }

    const cancelStart = afterPageLoad(() => {
      setupSentence();
      animate();
    });

    return () => {
      clearTimeout(timeout);
      cancelStart();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences.join('|')]);

  return (
    <section
      className="sauna-unique relative isolate w-full min-h-[95vh] flex flex-col justify-center px-5 md:px-10 overflow-hidden"
      style={{ backgroundColor: '#3a3a3a' }}
    >
      <div className="absolute inset-0 -z-10" style={{ backgroundColor: '#3a3a3a' }}>
        <picture>
          <source media="(max-width: 640px)" srcSet="/640.webp 1x" type="image/webp" />
          <source media="(max-width: 1024px)" srcSet="/1024.webp 1x" type="image/webp" />
          <source srcSet="/1920.webp 1x" type="image/webp" />
          <img
            src="/1920.webp"
            alt={t('alt')}
            width="1920"
            height="1080"
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            loading="eager"
            style={{ display: 'block' }}
          />
        </picture>
      </div>

      <h1
        className="font-bold text-white text-left whitespace-nowrap text-2xl mt-10 sm:text-4xl md:text-5xl lg:text-[60px] leading-tight"
        style={{ fontFamily: 'Montserrat, sans-serif', textShadow: '4px 6px 7px rgba(0,0,0,0.5)' }}
      >
        {t('experience')}
      </h1>

      <div className="sr-only">
        {sentences.join(', ')}, {t('seoKeywords')}
      </div>

      <div className="stack flex flex-col items-center text-center">
        <div
          ref={typewriterRef}
          className="typewriter font-montserrat font-light text-white text-center mb-6 sm:mb-8 text-lg sm:text-2xl md:text-4xl lg:text-[46px] leading-snug"
          style={{ letterSpacing: '0.2px', textShadow: '0px 12px 10px rgba(0,0,0,0.9)', minHeight: '1.4em' }}
        />
        <ButtonClear
          text={tc('viewCatalogue')}
          href="https://www.sawo.com/wp-content/uploads/2025/10/SAWO-Product-Catalogue-2025.pdf"
          download
        />
      </div>
    </section>
  );
}
