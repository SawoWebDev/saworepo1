'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/translation/navigation';
import paths from '@/translation/routing';
import { afterPageLoad, prefersReducedMotion } from '@/utils/afterPageLoad';

const ITEM_KEYS = ['heaters', 'steamGenerators', 'rooms', 'infrared', 'accessories', 'controls'];
const ITEM_HREFS = {
  heaters: paths.sauna.heaters.parent,
  steamGenerators: paths.steam.generators,
  rooms: paths.sauna.rooms,
  infrared: paths.infrared,
  accessories: paths.sauna.accessories.parent,
  controls: paths.sauna.controls,
};
const ITEM_IMAGES = {
  heaters: '/assets/Home/Section1/FinnishSauna.webp',
  steamGenerators: '/assets/Home/Section1/5-SAUNA-ROOM-STEAM-GENERATOR.webp',
  rooms: '/assets/Home/Section1/Sauna-Room.webp',
  infrared: '/assets/Home/Section1/IR-SAUNA-1P-CEDAR.webp',
  accessories: '/assets/Home/Section1/Sauna-Accessories.webp',
  controls: '/assets/Home/Section1/INC-S-V2AspenSauna.webp',
};

export default function Section1() {
  const t = useTranslations('home.section1');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    return afterPageLoad(() => setIsReady(true));
  }, []);

  const carouselItems = ITEM_KEYS.map((key) => ({
    key,
    title: t(`items.${key}.title`),
    caption: t(`items.${key}.caption`),
    alt: t(`items.${key}.alt`),
    href: ITEM_HREFS[key],
    img: ITEM_IMAGES[key],
  }));

  return (
    <div>
      <section className="py-8">
        <h2
          className="text-center"
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: 'rgb(175, 133, 100)', fontSize: '35px' }}
        >
          {t('heading')}
        </h2>
      </section>

      <section className="pb-12 bg-gray-50">
        <div
          className="sawo-carousel-container overflow-x-auto overflow-y-hidden flex gap-5 snap-x scroll-smooth"
          role="region"
          aria-label={t('carouselLabel')}
        >
          <div className={`sawo-carousel-track flex gap-5${isReady ? ' is-ready' : ''}`} role="list">
            {[...carouselItems, ...carouselItems].map((item, index) => (
              <div
                className="sawo-carousel-item flex-shrink-0 w-[calc(25%-20px)] rounded overflow-hidden relative snap-start"
                key={`${item.key}-${index}`}
                role="listitem"
              >
                <Link href={item.href} className="relative block text-white">
                  <picture>
                    <source srcSet={item.img} type="image/webp" />
                    <img
                      src={item.img}
                      alt={item.alt}
                      title={item.title}
                      width="350"
                      height="350"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto block transition-transform duration-500 ease-in-out hover:scale-105"
                    />
                  </picture>
                  <div className="sawo-carousel-overlay absolute inset-0 bg-black/30 z-10" />
                  <div className="sawo-carousel-content absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent flex flex-col h-24 z-20">
                    <div className="sawo-carousel-title text-white text-base uppercase font-normal">{item.title}</div>
                    <div className="sawo-carousel-caption text-white text-xs sm:text-sm md:text-sm opacity-0 translate-y-2 transition-all duration-300">
                      {item.caption}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
