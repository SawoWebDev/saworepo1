'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/translation/navigation';
import paths from '@/translation/routing';
import { afterPageLoad, prefersReducedMotion } from '@/utils/afterPageLoad';

const ACCESSORY_KEYS = [
  'pailsLadles', 'thermometers', 'clocksSandtimers', 'lightsCovers',
  'headrestsBackrests', 'doorsHandles', 'benches', 'kivistone', 'ventilations',
];
const ACCESSORY_HREFS = {
  pailsLadles: paths.sauna.accessories.pailsLadles,
  thermometers: paths.sauna.accessories.thermometers,
  clocksSandtimers: paths.sauna.accessories.clocksSandtimers,
  lightsCovers: paths.sauna.accessories.lightsCovers,
  headrestsBackrests: paths.sauna.accessories.headrestsBackrests,
  doorsHandles: paths.sauna.accessories.doorsHandles,
  benches: paths.sauna.accessories.benches,
  kivistone: paths.sauna.accessories.kivistone,
  ventilations: paths.sauna.accessories.ventilations,
};
const ACCESSORY_IMAGES = {
  pailsLadles: '/assets/Home/Section4/DRAGON-FIRE-PAIL-AND-LADDLE-SCENE.webp',
  thermometers: '/assets/Home/Section4/BoxType2-copy-new.webp',
  clocksSandtimers: '/assets/Home/Section4/sand-timer-copy-new.webp',
  lightsCovers: '/assets/Home/Section4/TR-LIGHT-COVER_SCENE1-copy.webp',
  headrestsBackrests: '/assets/Home/Section4/506-2-D.webp',
  doorsHandles: '/assets/Home/Section4/DOORS-AND-HANDLES-copy.webp',
  benches: '/assets/Home/Section4/siro-bench.webp',
  kivistone: '/assets/Home/Section4/R-500-D_Scene2.webp',
  ventilations: '/assets/Home/Section4/Ventilation.webp',
};

export default function Section4() {
  const t = useTranslations('home.section4');
  const tc = useTranslations('common');
  const carouselRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const accessories = ACCESSORY_KEYS.map((key) => ({
    key,
    title: t(`items.${key}.title`),
    alt: t(`items.${key}.alt`),
    href: ACCESSORY_HREFS[key],
    img: ACCESSORY_IMAGES[key],
  }));
  const loopedItems = [...accessories, ...accessories];

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let interval;
    const cancelStart = afterPageLoad(() => {
      interval = setInterval(() => {
        if (carouselRef.current && !isHovered) {
          const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
          if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) {
            carouselRef.current.scrollLeft = 0;
          } else {
            carouselRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
          }
        }
      }, 3000);
    });
    return () => {
      cancelStart();
      clearInterval(interval);
    };
  }, [isHovered]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
      if (carouselRef.current.scrollLeft <= 0) carouselRef.current.scrollLeft = carouselRef.current.scrollWidth / 2;
      carouselRef.current.scrollBy({ left: -itemWidth, behavior: 'smooth' });
    }
  };
  const scrollRight = () => {
    if (carouselRef.current) {
      const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
      if (carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2) carouselRef.current.scrollLeft = 0;
      carouselRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: 'rgb(175, 133, 100)', fontSize: '35px' }}
      >
        {t('heading')}
      </h2>

      <div className="accessories-carousel-wrapper relative flex items-center" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <button className="arrow left-arrow text-2xl font-bold text-gray-700 hover:text-amber-600 mr-2 z-20" onClick={scrollLeft} aria-label={tc('previous')}>&#10094;</button>

        <div className="accessories-carousel flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory px-2" ref={carouselRef}>
          {loopedItems.map((item, idx) => (
            <Link href={item.href} key={`${item.key}-${idx}`} className="carousel-item relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} width="400" height="400" loading="lazy" decoding="async" className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="gradient-overlay absolute bottom-0 left-0 w-full h-2/3 z-10 pointer-events-none" />
              <div className="slide-title absolute bottom-0 w-full text-center p-2 z-20" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: '#fff', fontSize: '20px', lineHeight: '30px' }}>
                {item.title}
              </div>
            </Link>
          ))}
        </div>

        <button className="arrow right-arrow text-2xl font-bold text-gray-700 hover:text-yellow-700 ml-2 z-20" onClick={scrollRight} aria-label={tc('next')}>&#10095;</button>
      </div>

      <div className="text-center mt-6">
        <Link
          href={paths.sauna.accessories.parent}
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, fontSize: '15px', lineHeight: '27px', color: '#333333', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.3s ease' }}
          onMouseEnter={e => e.currentTarget.style.color = '#af8564'}
          onMouseLeave={e => e.currentTarget.style.color = '#333333'}
        >
          {tc('exploreMore')} &#8250;
        </Link>
      </div>
    </section>
  );
}
