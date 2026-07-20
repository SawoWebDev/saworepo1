'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import paths from '@/translation/routing';
import { afterPageLoad, prefersReducedMotion } from '@/utils/afterPageLoad';

const HEATER_KEYS = ['tower', 'wallMounted', 'floor', 'combi', 'stone', 'dragonfire'];
const HEATER_HREFS = {
  tower: paths.sauna.heaters.tower,
  wallMounted: paths.sauna.heaters.wallMounted,
  floor: paths.sauna.heaters.floor,
  combi: paths.sauna.heaters.combi,
  stone: paths.sauna.heaters.stone,
  dragonfire: paths.sauna.heaters.dragonfire,
};
const HEATER_IMAGES = {
  tower: '/assets/Home/Section2/TOWER-SERIES-2-600x360-1.webp',
  wallMounted: '/assets/Home/Section2/WALL-MOUNTED-SERIES-v2-1.webp',
  floor: '/assets/Home/Section2/FLOOR-MOUNTED-SERIES1-1024x614-1.webp',
  combi: '/assets/Home/Section2/COMBI-SERIES-600x360-1.webp',
  stone: '/assets/Home/Section2/STONE-SERIES-3-600x320-new-.webp',
  dragonfire: '/assets/Home/Section2/DRAGON-SERIES-1-600x360-1.webp',
};

export default function Section2() {
  const t = useTranslations('home.section2');
  const tc = useTranslations('common');
  const carouselRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const saunaHeaters = HEATER_KEYS.map((key) => ({
    key,
    title: t(`items.${key}.title`),
    caption: t(`items.${key}.caption`),
    alt: t(`items.${key}.alt`),
    href: HEATER_HREFS[key],
    img: HEATER_IMAGES[key],
  }));
  const loopedItems = [...saunaHeaters, ...saunaHeaters];

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
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left: carouselRef.current.scrollLeft <= 0 ? carouselRef.current.scrollWidth / 2 : -itemWidth,
      behavior: 'smooth',
    });
  };
  const scrollRight = () => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.firstChild.offsetWidth + 24;
    carouselRef.current.scrollBy({
      left: carouselRef.current.scrollLeft >= carouselRef.current.scrollWidth / 2 ? -carouselRef.current.scrollWidth / 2 : itemWidth,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative pt-12">
      <h2
        className="text-center mb-6"
        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: '#AF8564', fontSize: '2.2rem' }}
      >
        {t('heading')}
      </h2>

      <div
        className="sauna-carousel-wrapper relative flex items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button className="arrow left-arrow text-3xl font-bold text-gray-700 hover:text-amber-600 mr-2 z-20" onClick={scrollLeft} aria-label={tc('previous')}>&#10094;</button>

        <div className="sauna-carousel flex overflow-x-auto gap-6 scroll-smooth snap-x snap-mandatory px-2" ref={carouselRef}>
          {loopedItems.map((item, idx) => (
            <a href={item.href} key={`${item.key}-${idx}`} className="carousel-item relative flex-shrink-0 snap-start rounded overflow-hidden group">
              <img src={item.img} alt={item.alt} title={item.title} width="600" height="360" loading="lazy" decoding="async" className="w-full h-auto block transition-transform duration-300 ease-in-out group-hover:scale-105" />
              <div className="overlay absolute inset-0 bg-black/10 transition duration-300 group-hover:bg-black/60" />
              <div className="content absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
                <div className="title text-white text-base uppercase font-semibold text-center z-10 group-hover:opacity-0 transition-opacity duration-300">{item.title}</div>
                <div className="caption absolute inset-0 flex justify-center items-center text-center text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-3">{item.caption}</div>
              </div>
            </a>
          ))}
        </div>

        <button className="arrow right-arrow text-3xl font-bold text-gray-700 hover:text-yellow-900 ml-2 z-20" onClick={scrollRight} aria-label={tc('next')}>&#10095;</button>
      </div>
    </section>
  );
}
